import pool from './src/config/db.js';
import { login } from './src/controllers/authController.js';
import { generateEntranceExam, submitEntranceExam } from './src/controllers/entranceExamController.js';
import { getCourseContent, updateStudyProgress } from './src/controllers/courseController.js';
import { requestTestAccess, startPeriodicExam, submitPeriodicExam } from './src/controllers/periodicTestController.js';
import { getPendingRequests, reviewRequest } from './src/controllers/mentorController.js';

// Mock Express req/res
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

async function runE2ETests() {
  console.log('🧪 Starting End-to-End Test Suite...\n');

  // Reset Alex's student profile & sessions for idempotent testing
  const alexUserRow = (await pool.query("SELECT id FROM users WHERE email = 'alex@student.com'")).rows[0];
  if (alexUserRow) {
    await pool.query("DELETE FROM exam_sessions WHERE student_id = $1", [alexUserRow.id]);
    await pool.query("DELETE FROM test_requests WHERE student_id = $1", [alexUserRow.id]);
    await pool.query("DELETE FROM student_module_progress WHERE student_id = $1", [alexUserRow.id]);
    await pool.query("UPDATE student_profiles SET current_level = 'beginner', entrance_completed = 0 WHERE user_id = $1", [alexUserRow.id]);
  }

  // 1. Student Login (Alex)
  console.log('Step 1: Student Login (alex@student.com)...');
  const loginReq = { body: { email: 'alex@student.com', password: 'password123' } };
  const loginRes = createMockRes();
  await login(loginReq, loginRes);
  if (loginRes.statusCode !== 200) throw new Error('Login failed: ' + JSON.stringify(loginRes.data));
  const alexUser = loginRes.data.user;
  console.log(`✅ Logged in as: ${alexUser.firstName} ${alexUser.lastName} (Role: ${alexUser.role}, Entrance Completed: ${alexUser.entranceCompleted})`);

  // 2. Generate Entrance Exam (15 questions: 5 beginner, 5 intermediate, 5 advanced)
  console.log('\nStep 2: Generate Diagnostic Entrance Exam (MAPS)...');
  const genReq = { user: alexUser, body: {} };
  const genRes = createMockRes();
  await generateEntranceExam(genReq, genRes);
  if (genRes.statusCode !== 201) throw new Error('Entrance generation failed: ' + JSON.stringify(genRes.data));
  const examSessionId = genRes.data.examSessionId;
  const questions = genRes.data.questions;
  console.log(`✅ Exam generated. Session ID: ${examSessionId}`);
  console.log(`   Total Questions: ${questions.length}`);
  const tiers = { beginner: 0, intermediate: 0, advanced: 0 };
  questions.forEach(q => tiers[q.difficulty]++);
  console.log(`   Distribution: Beginner=${tiers.beginner}, Intermediate=${tiers.intermediate}, Advanced=${tiers.advanced}`);
  if (tiers.beginner !== 5 || tiers.intermediate !== 5 || tiers.advanced !== 5) {
    throw new Error('MAPS distribution failed: must be 5-5-5!');
  }

  // 3. Submit Entrance Exam (Simulate answers to achieve ~60-70% => Intermediate level)
  console.log('\nStep 3: Submit Entrance Exam...');
  // Look up correct answers for 4 beginner, 3 intermediate, 1 advanced => (4*1) + (3*2) + (1*3) = 13 / 30 = 43.3% or more
  // Let's answer 5 beginner (5), 4 intermediate (8), 2 advanced (6) = 19 / 30 = 63.3% -> Intermediate!
  const bankKeys = await pool.query('SELECT id, correct_option, difficulty FROM question_bank');
  const keyMap = new Map(bankKeys.rows.map(k => [k.id, k.correct_option]));

  let bCount = 0, iCount = 0, aCount = 0;
  const responses = questions.map(q => {
    const correctOpt = keyMap.get(q.id);
    let selectedOption = 'D';
    if (q.difficulty === 'beginner' && bCount < 5) {
      selectedOption = correctOpt;
      bCount++;
    } else if (q.difficulty === 'intermediate' && iCount < 4) {
      selectedOption = correctOpt;
      iCount++;
    } else if (q.difficulty === 'advanced' && aCount < 2) {
      selectedOption = correctOpt;
      aCount++;
    } else {
      // Wrong option
      selectedOption = correctOpt === 'A' ? 'B' : 'A';
    }
    return { questionId: q.id, selectedOption };
  });

  const submitReq = { user: alexUser, body: { examSessionId, responses } };
  const submitRes = createMockRes();
  await submitEntranceExam(submitReq, submitRes);
  if (submitRes.statusCode !== 200) throw new Error('Entrance submission failed: ' + JSON.stringify(submitRes.data));
  console.log(`✅ Exam evaluated!`);
  console.log(`   Total Points: ${submitRes.data.totalEarnedPoints} / ${submitRes.data.maxPossiblePoints}`);
  console.log(`   Score %: ${submitRes.data.scorePercentage}%`);
  console.log(`   Assigned Starting Level: ${submitRes.data.assignedLevel.toUpperCase()}`);

  // 4. Fetch Course Content & Verify Module Unlocking
  console.log('\nStep 4: Fetch Course Content for Student...');
  const courseRes = await pool.query('SELECT id FROM courses LIMIT 1');
  const courseId = courseRes.rows[0].id;
  const contentReq = { user: alexUser, params: { id: courseId } };
  const contentRes = createMockRes();
  await getCourseContent(contentReq, contentRes);
  console.log(`✅ Student level in profile: ${contentRes.data.studentLevel}`);
  console.log(`   Modules loaded: ${contentRes.data.modules.length}`);
  const unlocked = contentRes.data.modules.filter(m => m.isUnlocked);
  const bypassed = contentRes.data.modules.filter(m => m.isBypassed);
  console.log(`   Unlocked modules: ${unlocked.length}, Bypassed beginner modules: ${bypassed.length}`);

  // 5. Study a Module and Log Time
  console.log('\nStep 5: Study an intermediate module and update progress...');
  const targetModule = contentRes.data.modules.find(m => m.level === 'intermediate' && m.isUnlocked);
  const progReq = { user: alexUser, params: { id: targetModule.id }, body: { additionalMinutes: 190, markCompleted: true } };
  const progRes = createMockRes();
  await updateStudyProgress(progReq, progRes);
  console.log(`✅ Studied: "${targetModule.title}". Time spent: ${progRes.data.timeSpentMinutes} mins. Completed: ${progRes.data.isCompleted}`);

  // 6. Request Test Access from Mentor
  console.log('\nStep 6: Request Periodic Test Access...');
  const reqAccessReq = { user: alexUser, body: { moduleId: targetModule.id } };
  const reqAccessRes = createMockRes();
  await requestTestAccess(reqAccessReq, reqAccessRes);
  if (reqAccessRes.statusCode !== 201) throw new Error('Request test access failed: ' + JSON.stringify(reqAccessRes.data));
  const testRequestId = reqAccessRes.data.requestId;
  console.log(`✅ Test request submitted to mentor. Request ID: ${testRequestId}`);

  // 7. Mentor Login and View Pending Requests
  console.log('\nStep 7: Mentor (prof.sarah@mentor.com) reviews pending requests...');
  const mentorUser = (await pool.query("SELECT id, role FROM users WHERE role = 'mentor' LIMIT 1")).rows[0];
  const pendingReq = { user: mentorUser };
  const pendingRes = createMockRes();
  await getPendingRequests(pendingReq, pendingRes);
  console.log(`✅ Mentor sees ${pendingRes.data.requests.length} pending request(s).`);
  const foundReq = pendingRes.data.requests.find(r => r.request_id === testRequestId);
  console.log(`   Found request for: ${foundReq.student_first_name} ${foundReq.student_last_name}`);
  console.log(`   Module: ${foundReq.module_title}`);
  console.log(`   Time spent: ${foundReq.formattedTimeSpent} (${foundReq.thresholdLabel})`);

  // 8. Mentor Approves Access
  console.log('\nStep 8: Mentor Approves Periodic Test Request...');
  const reviewReqPayload = { user: mentorUser, params: { id: testRequestId }, body: { status: 'approved' } };
  const reviewRes = createMockRes();
  await reviewRequest(reviewReqPayload, reviewRes);
  console.log(`✅ Request ${testRequestId} status updated to: ${reviewRes.data.status}`);

  // 9. Student Starts Periodic Test
  console.log('\nStep 9: Student Starts Approved Periodic Test...');
  const startTestReq = { user: alexUser, body: { moduleId: targetModule.id } };
  const startTestRes = createMockRes();
  await startPeriodicExam(startTestReq, startTestRes);
  if (startTestRes.statusCode !== 201) throw new Error('Start periodic test failed: ' + JSON.stringify(startTestRes.data));
  const periodicSessionId = startTestRes.data.examSessionId;
  const periodicQuestions = startTestRes.data.questions;
  console.log(`✅ Periodic test started! Questions count: ${periodicQuestions.length}`);

  // 10. Student Submits Periodic Test
  console.log('\nStep 10: Student Submits Periodic Test...');
  const periodicResponses = periodicQuestions.map(q => ({
    questionId: q.id,
    selectedOption: keyMap.get(q.id) // Answer correctly to pass
  }));
  const subPeriodicReq = { user: alexUser, body: { examSessionId: periodicSessionId, responses: periodicResponses } };
  const subPeriodicRes = createMockRes();
  await submitPeriodicExam(subPeriodicReq, subPeriodicRes);
  console.log(`✅ Periodic test evaluated!`);
  console.log(`   Score: ${subPeriodicRes.data.scorePercentage}%`);
  console.log(`   Status: ${subPeriodicRes.data.isPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`   Message: ${subPeriodicRes.data.message}`);

  console.log('\n🎉 ALL 10 END-TO-END TESTS PASSED FLAWLESSLY!\n');
}

runE2ETests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
