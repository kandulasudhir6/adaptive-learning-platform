import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { createSchema } from './schema.js';


async function query(sql, ...params) {
  let i = 1;
  const pgSql = sql.replace(/\?/g, () => '$' + (i++));
  const finalSql = pgSql.replace(/INSERT INTO/g, 'INSERT INTO');
  return await pool.query(finalSql, params);
}

export async function seedEnhancements() {

  console.log('🔄 Initializing enhanced schema and tables...');
  

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Ensure faculty accounts
  const robert = await query("SELECT id FROM users WHERE email = 'dr.jenkins@faculty.com'").then(res => res.rows[0]);
  let robertId = robert?.id;
  if (!robertId) {
    robertId = crypto.randomUUID();
    await query(`
      INSERT INTO users (id, first_name, last_name, email, password_hash, role)
      VALUES (?, 'Robert', 'Vance', 'dr.jenkins@faculty.com', ?, 'faculty') ON CONFLICT (email) DO NOTHING
    `, robertId, passwordHash);
  }

  // Convert or create Sarah as faculty
  const sarah = await pool.query("SELECT id FROM users WHERE email IN ('prof.sarah@mentor.com', 'prof.sarah@faculty.com')").then(res => res.rows[0]);
  let sarahId = sarah?.id;
  if (!sarahId) {
    sarahId = crypto.randomUUID();
    await query(`
      INSERT INTO users (id, first_name, last_name, email, password_hash, role)
      VALUES (?, 'Sarah', 'Jenkins', 'prof.sarah@faculty.com', ?, 'faculty') ON CONFLICT (email) DO NOTHING
    `, sarahId, passwordHash);
  } else {
    await query("UPDATE users SET role = 'faculty', email = 'prof.sarah@faculty.com' WHERE id = ?", sarahId);
  }

  // 2. Fetch student IDs
  const alex = await query("SELECT id FROM users WHERE email = 'alex@student.com'").then(res => res.rows[0]);
  const maria = await pool.query("SELECT id FROM users WHERE email = 'maria@student.com'").then(res => res.rows[0]);
  const alexId = alex?.id;
  const mariaId = maria?.id;

  // 3. Seed Faculty Specialized Subjects
  await query("DELETE FROM faculty_subjects");

  const subjects = [
    {
      id: crypto.randomUUID(),
      faculty_id: robertId,
      subject_name: 'C Programming & Systems Fundamentals',
      category: 'Computer Science',
      description: 'Pointers, memory management, system-level programming, and data structures in C.',
    },
    {
      id: crypto.randomUUID(),
      faculty_id: robertId,
      subject_name: 'Distributed Systems, Consensus & Fault Tolerance',
      category: 'Systems Architecture',
      description: 'Paxos, Raft consensus, consistent hashing rings, and lock-free concurrent primitives.',
    },
    {
      id: crypto.randomUUID(),
      faculty_id: sarahId,
      subject_name: 'Full-Stack Modern Web Architecture & Scalability',
      category: 'Software Engineering',
      description: 'High-throughput microservices, edge caching, reactive state machines, and relational database indexing.',
    },
    {
      id: crypto.randomUUID(),
      faculty_id: sarahId,
      subject_name: 'Database Schema Optimization & Query Execution Plans',
      category: 'Database Systems',
      description: 'Relational calculus, query optimizer internals, B+ Tree index design, and ACID guarantees.',
    },
  ];

  for (const sub of subjects) {
    await query(`
      INSERT INTO faculty_subjects (id, faculty_id, subject_name, category, description)
      VALUES (?, ?, ?, ?, ?)
    `, sub.id, sub.faculty_id, sub.subject_name, sub.category, sub.description);
  }

  // 4. Seed Coding Challenges for CodeTantra arena
  const courseCs101 = await query("SELECT id FROM courses WHERE code = 'C101'").then(r => r.rows[0]);
  const courseId = courseCs101?.id;

  if (courseId) {
    await query("DELETE FROM coding_challenges");

    const challenges = [
      {
        id: crypto.randomUUID(),
        course_id: courseId,
        difficulty: 'beginner',
        title: 'Sum of Two Integers',
        description: `Read two space-separated integers from standard input and print their sum to standard output.

### Constraints:
- Use standard C \`scanf\` and \`printf\`.

### Example 1:
\`\`\`
Input: 5 7
Output: 12
\`\`\`
`,
        starter_code: `#include <stdio.h>

int main() {
    int a, b;
    // Your code here
    
    return 0;
}
`,
        test_cases_json: JSON.stringify([
          { id: 1, input: "5 7", expected: "12", isHidden: false },
          { id: 2, input: "-3 10", expected: "7", isHidden: false },
          { id: 3, input: "0 0", expected: "0", isHidden: true },
        ]),
        hints: JSON.stringify(["Use scanf(\"%d %d\", &a, &b);", "Use printf(\"%d\", a + b);"])
      },
      {
        id: crypto.randomUUID(),
        course_id: courseId,
        difficulty: 'intermediate',
        title: 'String Length',
        description: `Read a single string (without spaces) from standard input and print its length without using \`strlen\`.

### Constraints:
- Use a while loop to iterate until the null terminator \`\\0\` is reached.
- Maximum string length is 100 characters.

### Example 1:
\`\`\`
Input: hello
Output: 5
\`\`\`
`,
        starter_code: `#include <stdio.h>

int main() {
    char str[101];
    // Read the string and calculate length
    
    return 0;
}
`,
        test_cases_json: JSON.stringify([
          { id: 1, input: "hello", expected: "5", isHidden: false },
          { id: 2, input: "adaptive", expected: "8", isHidden: false },
          { id: 3, input: "c", expected: "1", isHidden: true },
        ]),
        hints: JSON.stringify(["Use scanf(\"%s\", str);", "Iterate while str[i] != '\\0'"])
      },
      {
        id: crypto.randomUUID(),
        course_id: courseId,
        difficulty: 'advanced',
        title: 'Check Even or Odd',
        description: `Read a single integer from standard input. Print "Even" if it is even, and "Odd" if it is odd.

### Example 1:
\`\`\`
Input: 42
Output: Even
\`\`\`
`,
        starter_code: `#include <stdio.h>

int main() {
    int n;
    // Check if n is even or odd
    
    return 0;
}
`,
        test_cases_json: JSON.stringify([
          { id: 1, input: "42", expected: "Even", isHidden: false },
          { id: 2, input: "7", expected: "Odd", isHidden: false },
          { id: 3, input: "0", expected: "Even", isHidden: true },
        ]),
        hints: JSON.stringify(["Use the modulo operator % 2."])
      }
    ];

    for (const c of challenges) {
      await query(`
        INSERT INTO coding_challenges (id, course_id, difficulty, title, description, starter_code, test_cases_json, hints)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, c.id, c.course_id, c.difficulty, c.title, c.description, c.starter_code, c.test_cases_json, c.hints);
    }
  }

  // 5. Seed day-to-day login logs for students
  await query("DELETE FROM user_login_logs", );

  if (mariaId && robertId) {
    // Maria chose Dr. Robert Vance as mentor
    await query(`
      INSERT INTO student_course_enrollments (id, student_id, course_id, faculty_id, status)
      VALUES (?, ?, ?, ?, 'active') ON CONFLICT DO NOTHING
    `, crypto.randomUUID(), mariaId, courseId, robertId);

    // Maria's login logs for last 4 days
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const pastLogins = [
      { time: new Date(now - 3 * dayMs + 10 * 60 * 1000).toISOString(), ip: '192.168.1.45', device: 'Chrome 128 / Windows 11' },
      { time: new Date(now - 2 * dayMs + 45 * 60 * 1000).toISOString(), ip: '192.168.1.45', device: 'Chrome 128 / Windows 11' },
      { time: new Date(now - 1 * dayMs + 15 * 60 * 1000).toISOString(), ip: '192.168.1.45', device: 'Chrome 128 / Windows 11' },
      { time: new Date(now - 2 * 60 * 60 * 1000).toISOString(), ip: '192.168.1.45', device: 'Chrome 128 / Windows 11' },
    ];

    for (const l of pastLogins) {
      await query(`
        INSERT INTO user_login_logs (id, user_id, login_time, ip_address, device_info)
        VALUES (?, ?, ?, ?, ?)
      `, crypto.randomUUID(), mariaId, l.time, l.ip, l.device);
    }
  }

  if (alexId && robertId) {
    // Alex also chose Dr. Robert Vance
    await query(`
      INSERT INTO student_course_enrollments (id, student_id, course_id, faculty_id, status)
      VALUES (?, ?, ?, ?, 'active') ON CONFLICT DO NOTHING
    `, crypto.randomUUID(), alexId, courseId, robertId);

    await query(`
      INSERT INTO user_login_logs (id, user_id, login_time, ip_address, device_info)
      VALUES (?, ?, CURRENT_TIMESTAMP, '127.0.0.1', 'Chrome 128 / Windows 11 (Student Station)')
    `, crypto.randomUUID(), alexId);
  }

  console.log('✅ Enhancements seeded: Faculty accounts, Specialized Subjects, CodeTantra Challenges & Day-to-Day Logins!');
}







