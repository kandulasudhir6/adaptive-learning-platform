import pool from './src/config/db.js';
import { generateEntranceExam } from './src/controllers/entranceExamController.js';
import crypto from 'node:crypto';

async function test() {
  const req = {
    user: { id: crypto.randomUUID() },
    body: {} 
  };
  const res = {
    status: (code) => ({
      json: (data) => { console.log('STATUS', code, data); return data; }
    }),
    json: (data) => { console.log('JSON', data); return data; }
  };
  
  await pool.query('INSERT INTO users (id, first_name, last_name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6)', [req.user.id, 'Test', 'User', req.user.id + '@test.com', 'hash', 'student']);

  await generateEntranceExam(req, res);
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
