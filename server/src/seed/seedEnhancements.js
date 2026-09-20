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
      subject_name: 'Advanced Data Structures & Algorithmic Complexity',
      category: 'Computer Science',
      description: 'Asymptotic analysis, memory layout, red-black & AVL self-balancing trees, and graph flow networks.',
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
        title: 'Two Sum Target Identifier',
        description: `Given an array of integers \`nums\` and an integer \`target\`, return the **indices** of the two numbers such that they add up to \`target\`.

### Constraints:
- Each input will have exactly one solution.
- You may not use the same element twice.
- Return the indices in an array \`[index1, index2]\`.

### Example 1:
\`\`\`
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]
Explanation: nums[0] + nums[1] == 9, return [0, 1].
\`\`\`
`,
        starter_code: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Write your code here
  
}
`,
        test_cases_json: JSON.stringify([
          { id: 1, input: [[2, 7, 11, 15], 9], expected: [0, 1], isHidden: false },
          { id: 2, input: [[3, 2, 4], 6], expected: [1, 2], isHidden: false },
          { id: 3, input: [[3, 3], 6], expected: [0, 1], isHidden: true },
        ]),
        hints: JSON.stringify(['Try using a Hash Map to store numbers you have already seen.'])
      },
      {
        id: crypto.randomUUID(),
        course_id: courseId,
        difficulty: 'intermediate',
        title: 'Valid Parentheses Syntax Matcher',
        description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

### Invariant Rules:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Example:
\`\`\`
Input: s = "()[]{}" -> Output: true
Input: s = "(]" -> Output: false
\`\`\`
`,
        starter_code: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Write your code here
  
}
`,
        test_cases_json: JSON.stringify([
          { id: 1, input: ['()'], expected: true, isHidden: false },
          { id: 2, input: ['()[]{}'], expected: true, isHidden: false },
          { id: 3, input: ['(]'], expected: false, isHidden: false },
          { id: 4, input: ['([)]'], expected: false, isHidden: true },
          { id: 5, input: ['{[]}'], expected: true, isHidden: true },
        ]),
        hints: JSON.stringify(['Use a Stack data structure.', 'Push opening brackets, pop and compare for closing brackets.'])
      },
      {
        id: crypto.randomUUID(),
        course_id: courseId,
        difficulty: 'advanced',
        title: 'Longest Common Subsequence',
        description: `Given two strings \`text1\` and \`text2\`, return the length of their longest common subsequence. If there is no common subsequence, return \`0\`.

### Example 1:
\`\`\`
Input: text1 = "abcde", text2 = "ace"
Output: 3
Explanation: The LCS is "ace" which has length 3.

Input: text1 = "abc", text2 = "abc"
Output: 3

Input: text1 = "abc", text2 = "def"
Output: 0
\`\`\`

### Constraints:
- 1 <= text1.length, text2.length <= 1000
- Expected Time Complexity: O(m x n)
`,
        starter_code: `/**
 * @param {string} text1
 * @param {string} text2
 * @return {number}
 */
function longestCommonSubsequence(text1, text2) {
  // Write your code here
  
}
`,
        test_cases_json: JSON.stringify([
          { id: 1, input: ['abcde', 'ace'], expected: 3, isHidden: false },
          { id: 2, input: ['abc', 'abc'], expected: 3, isHidden: false },
          { id: 3, input: ['abc', 'def'], expected: 0, isHidden: false },
          { id: 4, input: ['pmjghexybyrgzise', 'hafcdqbgncrcbihkd'], expected: 4, isHidden: true },
        ]),
        hints: JSON.stringify(['Dynamic Programming is your friend.', 'Build a 2D array dp[i][j] representing the LCS of text1[0..i] and text2[0..j].'])
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







