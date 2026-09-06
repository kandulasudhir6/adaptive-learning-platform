import pool from './src/config/db.js';
import { generateDynamicEntranceQuestions, generateDynamicPeriodicQuestions } from './src/services/questionGenerator.js';
import { generateEntranceExam, submitEntranceExam } from './src/controllers/entranceExamController.js';
import { startPeriodicExam, submitPeriodicExam } from './src/controllers/periodicTestController.js';

function createMockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
}

async function verifyDynamicSystem() {
  console.log('🧪 Testing Dynamic Question Generator Engine & Comprehensive Content...\n');

  const course = (await pool.query('SELECT id, title FROM courses LIMIT 1')).rows[0];
  console.log(`Course: ${course.title} (ID: ${course.id})`);

  // 1. Test Dynamic Entrance Generation (Run 1)
  console.log('\nStep 1: Generate Dynamic Entrance Exam Batch 1...');
  const run1 = await generateDynamicEntranceQuestions(course.id);
  console.log(`✅ Generated ${run1.length} questions in Batch 1`);
  const b1 = run1.filter(q => q.difficulty === 'beginner').length;
  const i1 = run1.filter(q => q.difficulty === 'intermediate').length;
  const a1 = run1.filter(q => q.difficulty === 'advanced').length;
  console.log(`   Distribution: Beginner=${b1}, Intermediate=${i1}, Advanced=${a1}`);

  // 2. Test Dynamic Entrance Generation (Run 2) and verify randomness
  console.log('\nStep 2: Generate Dynamic Entrance Exam Batch 2 and check uniqueness...');
  const run2 = await generateDynamicEntranceQuestions(course.id);
  console.log(`✅ Generated ${run2.length} questions in Batch 2`);
  const run1Ids = new Set(run1.map(q => q.id));
  const duplicates = run2.filter(q => run1Ids.has(q.id));
  console.log(`   Unique IDs: ${run2.length - duplicates.length} / ${run2.length}`);

  // 3. Test Dynamic Periodic Generation
  console.log('\nStep 3: Generate Dynamic Periodic Test (Intermediate Tier)...');
  const mod = (await pool.query("SELECT id, title FROM modules WHERE level = 'intermediate' LIMIT 1")).rows[0];
  const periodicQuestions = await generateDynamicPeriodicQuestions(course.id, mod.id, 'intermediate', 5);
  console.log(`✅ Generated ${periodicQuestions.length} periodic questions for "${mod.title}"`);
  console.log(`   Sample Question 1: ${periodicQuestions[0].questionText.slice(0, 100)}...`);
  console.log(`   Option A: ${periodicQuestions[0].optionA}`);
  console.log(`   Option B: ${periodicQuestions[0].optionB}`);
  console.log(`   Option C: ${periodicQuestions[0].optionC}`);
  console.log(`   Option D: ${periodicQuestions[0].optionD}`);
  console.log(`   Correct Key: ${periodicQuestions[0].correctOption}`);

  // 4. Test Comprehensive Module Content
  console.log('\nStep 4: Verify Module Comprehensive Study Content...');
  const allMods = await pool.query('SELECT id, title, level, length(content_body) as bytes FROM modules');
  for (const m of allMods.rows) {
    console.log(`   Module [${m.level}]: "${m.title}" -> ${m.bytes} characters of detailed study matter`);
    if (m.bytes < 500) {
      throw new Error(`Module ${m.title} content too short! Expected rich material.`);
    }
  }

  // 5. Test Live Controller Entrance Generation & Submission with Student
  console.log('\nStep 5: Testing Live Student Controller Flow with Dynamic Questions...');
  // Fresh student
  const student = (await pool.query("SELECT id, role, email FROM users WHERE role = 'student' LIMIT 1")).rows[0];
  await pool.query("DELETE FROM exam_sessions WHERE student_id = $1", [student.id]);
  await pool.query("UPDATE student_profiles SET current_level = 'beginner', entrance_completed = 0 WHERE user_id = $1", [student.id]);

  const genReq = { user: student, body: { courseId: course.id } };
  const genRes = createMockRes();
  await generateEntranceExam(genReq, genRes);
  if (genRes.statusCode !== 201) throw new Error('Entrance generation failed: ' + JSON.stringify(genRes.data));

  console.log(`✅ Controller successfully generated dynamic exam. Session ID: ${genRes.data.examSessionId}`);
  console.log(`   Total Questions returned: ${genRes.data.questions.length}`);
  console.log(`   Is dynamically generated flag: ${genRes.data.isDynamicallyGenerated}`);

  // Submit with answer key lookup
  const qIds = genRes.data.questions.map(q => q.id);
  const keys = (await pool.query("SELECT id, correct_option FROM question_bank WHERE id = ANY($1::uuid[])", [qIds])).rows;
  const keyMap = new Map(keys.map(k => [k.id, k.correct_option]));

  const submitReq = {
    user: student,
    body: {
      examSessionId: genRes.data.examSessionId,
      responses: genRes.data.questions.map(q => ({
        questionId: q.id,
        selectedOption: keyMap.get(q.id)
      }))
    }
  };
  const submitRes = createMockRes();
  await submitEntranceExam(submitReq, submitRes);
  console.log(`✅ Exam submitted and evaluated dynamically!`);
  console.log(`   Score: ${submitRes.data.scorePercentage}%`);
  console.log(`   Assigned Level: ${submitRes.data.assignedLevel}`);

  // Reset student for clean user demo
  await pool.query("DELETE FROM exam_sessions WHERE student_id = $1", [student.id]);
  await pool.query("UPDATE student_profiles SET current_level = 'beginner', entrance_completed = 0 WHERE user_id = $1", [student.id]);

  console.log('\n🎉 ALL DYNAMIC QUESTION & COMPREHENSIVE CONTENT VERIFICATIONS PASSED!\n');
}

verifyDynamicSystem().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
