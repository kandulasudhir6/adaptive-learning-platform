import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import pool from '../config/db.js';
import { JWT_SECRET } from '../middlewares/authMiddleware.js';

export const register = async (req, res) => {
  const { firstName, lastName, email, password, role = 'student' } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, email, and password are required.' });
  }

  const validRoles = ['student', 'faculty', 'mentor'];
  const userRole = validRoles.includes(role) ? role : 'student';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check duplicate email
    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    // Insert user
    await client.query(
      `INSERT INTO users (id, first_name, last_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, firstName.trim(), lastName.trim(), email.toLowerCase().trim(), passwordHash, userRole]
    );

    // If student, create student profile & assign default mentor/faculty
    if (userRole === 'student') {
      const mentorRes = await client.query(`SELECT id FROM users WHERE role = 'mentor' LIMIT 1`);
      const facultyRes = await client.query(`SELECT id FROM users WHERE role = 'faculty' LIMIT 1`);

      const mentorId = mentorRes.rows[0]?.id || null;
      const facultyId = facultyRes.rows[0]?.id || null;

      await client.query(
        `INSERT INTO student_profiles (user_id, assigned_mentor_id, assigned_faculty_id, current_level, entrance_completed)
         VALUES ($1, $2, $3, 'beginner', 0)`,
        [userId, mentorId, facultyId]
      );
    }

    await client.query('COMMIT');

    const token = jwt.sign(
      {
        id: userId,
        email: email.toLowerCase().trim(),
        role: userRole,
        firstName: firstName.trim(),
        lastName: lastName.trim()
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        role: userRole,
        entranceCompleted: false,
        currentLevel: 'beginner'
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const userRes = await pool.query(
      `SELECT id, first_name, last_name, email, password_hash, role, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Fetch student profile if student
    let profileData = null;
    if (user.role === 'student') {
      const profRes = await pool.query(
        `SELECT sp.current_level, sp.entrance_completed,
                m.first_name as mentor_first_name, m.last_name as mentor_last_name,
                f.first_name as faculty_first_name, f.last_name as faculty_last_name
         FROM student_profiles sp
         LEFT JOIN users m ON sp.assigned_mentor_id = m.id
         LEFT JOIN users f ON sp.assigned_faculty_id = f.id
         WHERE sp.user_id = $1`,
        [user.id]
      );
      profileData = profRes.rows[0] || null;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        currentLevel: profileData ? profileData.current_level : null,
        entranceCompleted: profileData ? Boolean(profileData.entrance_completed) : null,
        mentor: profileData?.mentor_first_name ? `${profileData.mentor_first_name} ${profileData.mentor_last_name}` : 'Prof. Sarah Jenkins',
        faculty: profileData?.faculty_first_name ? `${profileData.faculty_first_name} ${profileData.faculty_last_name}` : 'Dr. Robert Vance'
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const userRes = await pool.query(
      `SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];
    let profileData = null;

    if (user.role === 'student') {
      const profRes = await pool.query(
        `SELECT sp.current_level, sp.entrance_completed,
                m.first_name as mentor_first_name, m.last_name as mentor_last_name,
                f.first_name as faculty_first_name, f.last_name as faculty_last_name
         FROM student_profiles sp
         LEFT JOIN users m ON sp.assigned_mentor_id = m.id
         LEFT JOIN users f ON sp.assigned_faculty_id = f.id
         WHERE sp.user_id = $1`,
        [user.id]
      );
      profileData = profRes.rows[0] || null;
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        currentLevel: profileData ? profileData.current_level : null,
        entranceCompleted: profileData ? Boolean(profileData.entrance_completed) : null,
        mentor: profileData?.mentor_first_name ? `${profileData.mentor_first_name} ${profileData.mentor_last_name}` : null,
        faculty: profileData?.faculty_first_name ? `${profileData.faculty_first_name} ${profileData.faculty_last_name}` : null
      }
    });
  } catch (err) {
    console.error('GetMe Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getDemoAccounts = async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT id, first_name, last_name, email, role FROM users ORDER BY role, first_name`
    );
    return res.status(200).json({
      success: true,
      accounts: users.rows.map(u => ({
        ...u,
        defaultPassword: 'password123'
      }))
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch demo accounts' });
  }
};
