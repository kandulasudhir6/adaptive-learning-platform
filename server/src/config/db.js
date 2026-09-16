import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'adaptive_learning.db');
const rawDb = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys
rawDb.exec('PRAGMA foreign_keys = ON;');
rawDb.exec('PRAGMA journal_mode = WAL;');

/**
 * Initialize all database tables matching PostgreSQL DDL specifications
 */
export function initSchema() {
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student' CHECK(role IN ('student', 'faculty', 'mentor', 'admin')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      assigned_mentor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      assigned_faculty_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      current_level TEXT DEFAULT 'beginner' CHECK(current_level IN ('beginner', 'intermediate', 'advanced')),
      entrance_completed INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('beginner', 'intermediate', 'advanced')),
      sequence_order INTEGER NOT NULL,
      content_body TEXT,
      study_time_recommended INTEGER DEFAULT 120,
      UNIQUE(course_id, level, sequence_order)
    );

    CREATE TABLE IF NOT EXISTS question_bank (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      module_id TEXT REFERENCES modules(id) ON DELETE SET NULL,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS test_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
      reviewer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      rejection_reason TEXT,
      time_spent_minutes INTEGER DEFAULT 0,
      requested_at TEXT DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS exam_sessions (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      module_id TEXT REFERENCES modules(id) ON DELETE SET NULL,
      type TEXT NOT NULL CHECK(type IN ('entrance', 'periodic')),
      score REAL,
      assigned_level TEXT CHECK(assigned_level IN ('beginner', 'intermediate', 'advanced', NULL)),
      started_at TEXT DEFAULT CURRENT_TIMESTAMP,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS exam_responses (
      id TEXT PRIMARY KEY,
      exam_session_id TEXT REFERENCES exam_sessions(id) ON DELETE CASCADE,
      question_id TEXT REFERENCES question_bank(id) ON DELETE CASCADE,
      selected_option TEXT,
      is_correct INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS student_module_progress (
      student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
      time_spent_minutes INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      last_studied_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (student_id, module_id)
    );

    CREATE TABLE IF NOT EXISTS user_login_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      login_time TEXT DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      device_info TEXT
    );

    CREATE TABLE IF NOT EXISTS faculty_subjects (
      id TEXT PRIMARY KEY,
      faculty_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      subject_name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_course_enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      faculty_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'dropped')),
      UNIQUE(student_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS student_roadmaps (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      faculty_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      overview TEXT,
      current_level TEXT DEFAULT 'beginner',
      status TEXT DEFAULT 'pending_approval' CHECK(status IN ('pending_approval', 'approved', 'customized')),
      faculty_notes TEXT,
      milestones_json TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS coding_challenges (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      module_id TEXT REFERENCES modules(id) ON DELETE SET NULL,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      starter_code TEXT NOT NULL,
      test_cases_json TEXT NOT NULL,
      hints TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coding_submissions (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      challenge_id TEXT REFERENCES coding_challenges(id) ON DELETE CASCADE,
      exam_session_id TEXT REFERENCES exam_sessions(id) ON DELETE CASCADE,
      code_submitted TEXT NOT NULL,
      passed_cases INTEGER NOT NULL,
      total_cases INTEGER NOT NULL,
      is_passed INTEGER NOT NULL,
      execution_time_ms REAL,
      submitted_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS faculty_qr_sessions (
      id TEXT PRIMARY KEY,
      session_token TEXT UNIQUE NOT NULL,
      faculty_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'expired')),
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Normalizes PostgreSQL query syntax ($1, $2, ANY, etc.) to SQLite-compatible queries
 */
function normalizeQuery(sql, params = []) {
  let normalizedSql = sql;
  const mappedParams = [];

  // Handle ANY($1::uuid[]) or ANY($1) -> IN (?, ?, ...)
  const anyRegex = /=\s*ANY\s*\(\s*\$(\d+)(?:::uuid\[\])?\s*\)/gi;
  normalizedSql = normalizedSql.replace(anyRegex, (match, paramIdx) => {
    const idx = parseInt(paramIdx, 10) - 1;
    const arr = params[idx];
    if (Array.isArray(arr) && arr.length > 0) {
      const placeholders = arr.map(() => '?').join(', ');
      arr.forEach(val => mappedParams.push(val));
      return `IN (${placeholders})`;
    }
    return '= NULL';
  });

  // Replace remaining $1, $2, ... mapping to their parameter values
  normalizedSql = normalizedSql.replace(/\$(\d+)/g, (match, idxStr) => {
    const idx = parseInt(idxStr, 10) - 1;
    mappedParams.push(params[idx]);
    return '?';
  });

  return { sql: normalizedSql, params: mappedParams };
}

/**
 * Execute query on SQLite and return { rows, rowCount }
 */
export function executeQuery(rawSql, params = []) {
  const trimmed = rawSql.trim();
  const upper = trimmed.toUpperCase();

  // Transaction control statements
  if (upper === 'BEGIN' || upper === 'BEGIN TRANSACTION') {
    rawDb.exec('BEGIN TRANSACTION;');
    return { rows: [], rowCount: 0 };
  }
  if (upper === 'COMMIT') {
    try {
      rawDb.exec('COMMIT;');
    } catch (e) {
      // Transaction might not be active
    }
    return { rows: [], rowCount: 0 };
  }
  if (upper === 'ROLLBACK') {
    try {
      rawDb.exec('ROLLBACK;');
    } catch (e) {
      // Transaction might not be active
    }
    return { rows: [], rowCount: 0 };
  }

  const { sql, params: rawFinalParams } = normalizeQuery(rawSql, params);
  const finalParams = rawFinalParams.map(p => p === undefined ? null : p);

  // Check if query is returning data (SELECT or RETURNING)
  const isSelect = upper.startsWith('SELECT') || upper.startsWith('(SELECT') || upper.includes('RETURNING');

  try {
    const stmt = rawDb.prepare(sql);
    if (isSelect) {
      const rows = stmt.all(...finalParams);
      return { rows: rows.map(r => ({ ...r })), rowCount: rows.length };
    } else {
      const info = stmt.run(...finalParams);
      return { rows: [], rowCount: info.changes };
    }
  } catch (err) {
    console.error('Database Query Error:', err.message, '\nSQL:', sql, '\nParams:', finalParams);
    throw err;
  }
}

/**
 * pg-compatible pool object so standard Express controllers run identically
 */
const pool = {
  query: async (sql, params = []) => executeQuery(sql, params),
  connect: async () => {
    return {
      query: async (sql, params = []) => executeQuery(sql, params),
      release: () => {
        // No-op for sync local sqlite connection
      }
    };
  }
};

export { rawDb, crypto };
export default pool;
