import { sendOtpEmail } from '../services/emailService.js';
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

import admin from '../config/firebaseAdmin.js';

export const register = async (req, res) => {
  const { idToken, firstName, lastName, role } = req.body;
  if (!idToken || !firstName || !lastName || !role) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  const validRoles = ['student', 'faculty', 'mentor', 'admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number not found in token.' });

    const existing = await pool.query(`SELECT id FROM users WHERE phone = $1`, [phoneNumber]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'User with this phone number already exists.' });

    const userId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO users (id, first_name, last_name, phone, role) VALUES ($1, $2, $3, $4, $5)`,
      [userId, firstName, lastName, phoneNumber, role]
    );

    if (role === 'student') await pool.query(`INSERT INTO student_profiles (user_id) VALUES ($1)`, [userId]);

    await recordLoginLog(userId, req);

    const jwtToken = jwt.sign(
      { id: userId, phone: phoneNumber, role, firstName, lastName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({ success: true, token: jwtToken, user: { id: userId, firstName, lastName, phone: phoneNumber, role } });
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

export const login = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'idToken is required.' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number not found in token.' });

    const userRes = await pool.query(`SELECT id, first_name, last_name, email, phone, role FROM users WHERE phone = $1`, [phoneNumber]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found. Please register first.' });

    const user = userRes.rows[0];
    await recordLoginLog(user.id, req);

    const jwtToken = jwt.sign(
      { id: user.id, phone: user.phone, email: user.email, role: user.role, firstName: user.first_name, lastName: user.last_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      token: jwtToken,
      user: { id: user.id, firstName: user.first_name, lastName: user.last_name, phone: user.phone, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login Error:', err);
    return res.status(401).json({ error: 'Invalid or expired phone token.' });
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

// In-memory store for OTPs (For production, use Redis or a DB table)
// Structure: Map<email, { otp: string, expires: number }>

/**
 * Generate and send OTP (Used for both Student and Faculty)
 */
export const requestOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  // Generate a random 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  
  // Store it (expires in 10 minutes)
  otpStore.set(email.toLowerCase().trim(), {
    otp,
    expires: Date.now() + 10 * 60 * 1000
  });

  // Print to terminal for debugging
  console.log(`\n[SIMULATED EMAIL] OTP for ${email} is: ${otp}\n`);

  // Attempt to send real email
  try {
    await sendOtpEmail(email.toLowerCase().trim(), otp);
  } catch (err) {
    // We swallow the error here in dev mode if they haven't set up the email yet,
    // so they can still test using the terminal code.
    console.warn("Could not send real email. Relying on terminal output.");
  }

  res.json({ success: true, message: 'OTP sent' });
};
