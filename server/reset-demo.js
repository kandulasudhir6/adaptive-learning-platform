import pool from './src/config/db.js';

async function resetDemo() {
  const alex = (await pool.query("SELECT id FROM users WHERE email = 'alex@student.com'")).rows[0];
  if (alex) {
    await pool.query("DELETE FROM exam_sessions WHERE student_id = $1", [alex.id]);
    await pool.query("DELETE FROM test_requests WHERE student_id = $1", [alex.id]);
    await pool.query("DELETE FROM student_module_progress WHERE student_id = $1", [alex.id]);
    await pool.query(
      "UPDATE student_profiles SET current_level = 'beginner', entrance_completed = 0 WHERE user_id = $1",
      [alex.id]
    );
  }
  console.log('✨ Demo database reset: Alex Rivera ready to take Diagnostic Entrance Exam!');
}

resetDemo().catch(console.error);
