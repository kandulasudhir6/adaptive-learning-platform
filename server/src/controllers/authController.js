const otpStore = new Map();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import pool from '../config/db.js';
import { JWT_SECRET } from '../middlewares/authMiddleware.js';

/**
 * Helper to record day-to-day login activity
 */
async function recordLoginLog(userId, req) {
  try {
    const logId = crypto.randomUUID();
    const ipAddress = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const deviceInfo = req.headers['user-agent'] || 'Web Browser (EduVibe Platform)';

    await pool.query(
      `INSERT INTO user_login_logs (id, user_id, login_time, ip_address, device_info)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4)`,
      [logId, userId, ipAddress, deviceInfo]
    );
  } catch (err) {
    console.error('Failed to record login log:', err.message);
  }
}

/**
 * Student Registration
 */
export const register = async (req, res) => {
  const { firstName, lastName, email, password, role = 'student', otp } = req.body;

  if (!firstName || !lastName || !email || !password || !otp) {
    return res.status(400).json({ error: 'All fields including OTP are required.' });
  }

  const storedData = otpStore.get(email.toLowerCase().trim());
  if (!storedData || storedData.otp !== otp || Date.now() > storedData.expires) {
    return res.status(401).json({ error: 'Invalid or expired verification code.' });
  }
  // Do not delete OTP here yet, let it be consumed successfully first or delete after.
  
  // Student default, faculty via admin/preset
  const userRole = role === 'faculty' ? 'faculty' : 'student';

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

    // If student, create student profile & assign default faculty mentor
    if (userRole === 'student') {
      const facultyRes = await client.query(`SELECT id FROM users WHERE role = 'faculty' LIMIT 1`);
      const facultyId = facultyRes.rows[0]?.id || null;

      await client.query(
        `INSERT INTO student_profiles (user_id, assigned_faculty_id, current_level, entrance_completed)
         VALUES ($1, $2, 'beginner', 0)`,
        [userId, facultyId]
      );
    }

    await client.query('COMMIT');
    otpStore.delete(email.toLowerCase().trim());

    // Record login log
    await recordLoginLog(userId, req);

    const token = jwt.sign(
      {
        id: userId,
        email: email.toLowerCase().trim(),
        role: userRole,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
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
        currentLevel: 'beginner',
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  } finally {
    client.release();
  }
};

/**
 * Standard Login (Student and fallback Faculty)
 */
export const login = async (req, res) => {
  const { email, password, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  const storedData = otpStore.get(email.toLowerCase().trim());
  if (!storedData || storedData.otp !== otp || Date.now() > storedData.expires) {
    return res.status(401).json({ error: 'Invalid or expired OTP.' });
  }
  otpStore.delete(email.toLowerCase().trim());

  try {
    const userRes = await pool.query(
      `SELECT id, first_name, last_name, email, password_hash, role, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'User not found.' });
    }

    const user = userRes.rows[0];

    // If user is a student, we also verify password
    if (user.role === 'student') {
      if (!password) return res.status(400).json({ error: 'Password required for students.' });
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
    }

    // Record login timestamp
    await recordLoginLog(user.id, req);

    // Fetch student profile if student
    let profileData = null;
    let enrolledCourse = null;
    if (user.role === 'student') {
      const profRes = await pool.query(
        `SELECT sp.current_level, sp.entrance_completed,
                f.id as faculty_id, f.first_name as faculty_first_name, f.last_name as faculty_last_name
         FROM student_profiles sp
         LEFT JOIN users f ON sp.assigned_faculty_id = f.id
         WHERE sp.user_id = $1`,
        [user.id]
      );
      profileData = profRes.rows[0] || null;

      const enrollRes = await pool.query(
        `SELECT sce.course_id, sce.faculty_id, c.title as course_title, c.code as course_code,
                f.first_name as faculty_first_name, f.last_name as faculty_last_name
         FROM student_course_enrollments sce
         JOIN courses c ON sce.course_id = c.id
         LEFT JOIN users f ON sce.faculty_id = f.id
         WHERE sce.student_id = $1 AND sce.status = 'active'
         LIMIT 1`,
        [user.id]
      );
      enrolledCourse = enrollRes.rows[0] || null;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
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
        faculty: profileData?.faculty_first_name ? `${profileData.faculty_first_name} ${profileData.faculty_last_name}` : 'Dr. Robert Vance',
        assignedFacultyId: profileData?.faculty_id || null,
        enrolledCourse,
      },
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};

/**
 * Initiate Faculty QR Code Authentication Session
 * Generates an ephemeral session token that renders as a dynamic QR code
 */
export const initiateFacultyQRSession = async (req, res) => {
  try {
    const sessionId = crypto.randomUUID();
    const sessionToken = `eduvibe_qr_${crypto.randomBytes(24).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000).toISOString(); // 3 minutes validity

    // Get default faculty ID for quick linking
    const facultyUser = (await pool.query("SELECT id FROM users WHERE role = 'faculty' LIMIT 1")).rows[0];
    const facultyId = facultyUser?.id || null;

    await pool.query(
      `INSERT INTO faculty_qr_sessions (id, session_token, faculty_id, status, expires_at)
       VALUES ($1, $2, $3, 'pending', $4)`,
      [sessionId, sessionToken, facultyId, expiresAt]
    );

    // Payload embedded in QR code
    const qrPayload = JSON.stringify({
      app: 'EduVibeAI',
      type: 'FACULTY_AUTH_CHALLENGE',
      token: sessionToken,
      issuedAt: new Date().toISOString(),
      expiresAt,
    });

    return res.status(201).json({
      success: true,
      sessionId,
      sessionToken,
      qrPayload,
      expiresAt,
      message: 'Faculty QR authentication code generated. Scan to authenticate.',
    });
  } catch (err) {
    console.error('Error initiating faculty QR:', err);
    return res.status(500).json({ error: 'Failed to generate faculty QR code.' });
  }
};

/**
 * Check Faculty QR Session Status (Polled by frontend)
 */
export const checkFacultyQRSessionStatus = async (req, res) => {
  const { token } = req.params;

  try {
    const sessionRes = await pool.query(
      `SELECT qs.*, u.id as user_id, u.first_name, u.last_name, u.email, u.role
       FROM faculty_qr_sessions qs
       JOIN users u ON qs.faculty_id = u.id
       WHERE qs.session_token = $1`,
      [token]
    );

    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: 'QR Session not found.' });
    }

    const session = sessionRes.rows[0];

    // Check expiry
    if (new Date(session.expires_at) < new Date()) {
      return res.status(410).json({ status: 'expired', error: 'QR code expired. Please refresh.' });
    }

    if (session.status === 'verified') {
      // Record login log
      await recordLoginLog(session.user_id, req);

      const jwtToken = jwt.sign(
        {
          id: session.user_id,
          email: session.email,
          role: session.role,
          firstName: session.first_name,
          lastName: session.last_name,
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(200).json({
        success: true,
        status: 'verified',
        token: jwtToken,
        user: {
          id: session.user_id,
          firstName: session.first_name,
          lastName: session.last_name,
          email: session.email,
          role: session.role,
        },
      });
    }

    return res.status(200).json({
      success: true,
      status: 'pending',
      message: 'Waiting for faculty mobile scan verification...',
    });
  } catch (err) {
    console.error('Error checking QR status:', err);
    return res.status(500).json({ error: 'Failed to verify QR status.' });
  }
};

/**
 * Verify / Simulate Faculty QR Code Scan
 * (Can be called by phone camera reader or instant browser simulator)
 */
export const verifyFacultyQRSession = async (req, res) => {
  const { sessionToken, facultyEmail } = req.body;

  if (!sessionToken) {
    return res.status(400).json({ error: 'Session token is required.' });
  }

  try {
    const targetEmail = facultyEmail || 'dr.jenkins@faculty.com';
    const facultyRes = await pool.query(
      `SELECT id, first_name, last_name, email, role FROM users WHERE email = $1`,
      [targetEmail.toLowerCase().trim()]
    );

    if (facultyRes.rows.length === 0) {
      return res.status(404).json({ error: 'Faculty profile not found.' });
    }

    const faculty = facultyRes.rows[0];

    await pool.query(
      `UPDATE faculty_qr_sessions
       SET status = 'verified', faculty_id = $1
       WHERE session_token = $2`,
      [faculty.id, sessionToken]
    );

    // Record login log
    await recordLoginLog(faculty.id, req);

    const jwtToken = jwt.sign(
      {
        id: faculty.id,
        email: faculty.email,
        role: faculty.role,
        firstName: faculty.first_name,
        lastName: faculty.last_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      status: 'verified',
      token: jwtToken,
      user: faculty,
      message: `QR code authenticated successfully for Faculty ${faculty.first_name} ${faculty.last_name}.`,
    });
  } catch (err) {
    console.error('Error verifying QR session:', err);
    return res.status(500).json({ error: 'Internal server error verifying QR session.' });
  }
};

/**
 * Get current user profile with latest metadata
 */
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
    let enrolledCourse = null;

    if (user.role === 'student') {
      const profRes = await pool.query(
        `SELECT sp.current_level, sp.entrance_completed,
                f.id as faculty_id, f.first_name as faculty_first_name, f.last_name as faculty_last_name
         FROM student_profiles sp
         LEFT JOIN users f ON sp.assigned_faculty_id = f.id
         WHERE sp.user_id = $1`,
        [user.id]
      );
      profileData = profRes.rows[0] || null;

      const enrollRes = await pool.query(
        `SELECT sce.course_id, sce.faculty_id, c.title as course_title, c.code as course_code,
                f.first_name as faculty_first_name, f.last_name as faculty_last_name
         FROM student_course_enrollments sce
         JOIN courses c ON sce.course_id = c.id
         LEFT JOIN users f ON sce.faculty_id = f.id
         WHERE sce.student_id = $1 AND sce.status = 'active'
         LIMIT 1`,
        [user.id]
      );
      enrolledCourse = enrollRes.rows[0] || null;
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
        faculty: profileData?.faculty_first_name ? `${profileData.faculty_first_name} ${profileData.faculty_last_name}` : 'Dr. Robert Vance',
        assignedFacultyId: profileData?.faculty_id || null,
        enrolledCourse,
      },
    });
  } catch (err) {
    console.error('GetMe Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * Return preset demo accounts for easy switching
 */
export const getDemoAccounts = async (req, res) => {
  try {
    const users = await pool.query(
      `SELECT id, first_name, last_name, email, role FROM users WHERE role IN ('student', 'faculty', 'admin') ORDER BY role, first_name`
    );
    return res.status(200).json({
      success: true,
      accounts: users.rows.map((u) => ({
        ...u,
        defaultPassword: 'password123',
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch demo accounts' });
  }
};
export const requestOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(email.toLowerCase().trim(), { otp, expires: Date.now() + 10 * 60 * 1000 });
  console.log(`\n\n[SIMULATED EMAIL] OTP for ${email} is: ${otp}\n\n`);
  return res.status(200).json({ success: true, message: 'OTP sent' });
};
