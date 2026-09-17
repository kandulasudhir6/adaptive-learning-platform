import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { rawDb as db } from './src/config/db.js';

async function run() {
  const userId = crypto.randomUUID();
  db.prepare('INSERT INTO users (id, first_name, last_name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)').run(userId, 'T', 'T', 't' + Date.now() + '@t.com', 'h', 'student');
  db.prepare('INSERT INTO student_profiles (user_id, current_level, entrance_completed) VALUES (?, ?, ?)').run(userId, 'beginner', 0);

  const token = jwt.sign({ id: userId, role: 'student' }, 'eduvibe_super_secret_jwt_key_2024_adaptive_learning', { expiresIn: '7d' });

  const res = await fetch('http://localhost:5000/api/v1/exams/entrance/generate', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  const data = await res.text();
  console.log('STATUS:', res.status);
  console.log('DATA:', data);
}
run();
