import pool from '../config/db.js';

export async function createSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT NOT NULL CHECK(role IN ('student', 'faculty', 'mentor', 'admin')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      assigned_mentor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      assigned_faculty_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      current_level TEXT DEFAULT 'beginner' CHECK(current_level IN ('beginner', 'intermediate', 'advanced')),
      entrance_completed INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS courses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('beginner', 'intermediate', 'advanced')),
      sequence_order INTEGER NOT NULL,
      study_time_recommended INTEGER NOT NULL,
      content_body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS question_bank (
      id TEXT PRIMARY KEY,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT NOT NULL,
      option_d TEXT NOT NULL,
      correct_option TEXT NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS test_requests (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
      reviewer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      rejection_reason TEXT,
      time_spent_minutes INTEGER DEFAULT 0,
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exam_sessions (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      module_id TEXT REFERENCES modules(id) ON DELETE SET NULL,
      type TEXT NOT NULL CHECK(type IN ('entrance', 'periodic')),
      score REAL,
      assigned_level TEXT CHECK(assigned_level IN ('beginner', 'intermediate', 'advanced', NULL)),
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
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
      last_studied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (student_id, module_id)
    );

    CREATE TABLE IF NOT EXISTS user_login_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      device_info TEXT
    );

    CREATE TABLE IF NOT EXISTS faculty_subjects (
      id TEXT PRIMARY KEY,
      faculty_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      subject_name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_course_enrollments (
      id TEXT PRIMARY KEY,
      student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
      faculty_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS faculty_qr_sessions (
      id TEXT PRIMARY KEY,
      session_token TEXT UNIQUE NOT NULL,
      faculty_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'expired')),
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
