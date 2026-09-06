import pool from '../config/db.js';
import crypto from 'node:crypto';
import { generateDynamicPeriodicQuestions } from '../services/questionGenerator.js';

/**
 * POST /api/v1/tests/request-access
 * Student submits request for mentor/faculty periodic test authorization
 */
export const requestTestAccess = async (req, res) => {
  const studentId = req.user.id;
  const { moduleId } = req.body;

  if (!moduleId) {
    return res.status(400).json({ error: 'Module ID is required.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch student's assigned mentor / faculty
    const profileRes = await client.query(
      `SELECT assigned_mentor_id, assigned_faculty_id FROM student_profiles WHERE user_id = $1`,
      [studentId]
    );

    if (profileRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const reviewerId = profileRes.rows[0].assigned_mentor_id || profileRes.rows[0].assigned_faculty_id;

    // 2. Fetch study progress to attach metrics
    const progRes = await client.query(
      `SELECT time_spent_minutes, is_completed FROM student_module_progress
       WHERE student_id = $1 AND module_id = $2`,
      [studentId, moduleId]
    );

    const timeSpent = progRes.rows[0]?.time_spent_minutes || 0;

    // 3. Check existing request status
    const existingReq = await client.query(
      `SELECT id, status FROM test_requests WHERE student_id = $1 AND module_id = $2`,
      [studentId, moduleId]
    );

    let requestId;
    if (existingReq.rows.length > 0) {
      requestId = existingReq.rows[0].id;
      // Re-request access
      await client.query(
        `UPDATE test_requests
         SET status = 'pending', rejection_reason = NULL,
             time_spent_minutes = $1, requested_at = CURRENT_TIMESTAMP, reviewer_id = $2
         WHERE id = $3`,
        [timeSpent, reviewerId, requestId]
      );
    } else {
      requestId = crypto.randomUUID();
      await client.query(
        `INSERT INTO test_requests (id, student_id, module_id, reviewer_id, status, time_spent_minutes)
         VALUES ($1, $2, $3, $4, 'pending', $5)`,
        [requestId, studentId, moduleId, reviewerId, timeSpent]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Test request submitted to mentor for review.',
      requestId,
      status: 'pending',
      timeSpentMinutes: timeSpent,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error requesting test access:', err);
    return res.status(500).json({ error: 'Internal server error requesting test access.' });
  } finally {
    client.release();
  }
};

/**
 * POST /api/v1/exams/periodic/start
 * Initialize periodic exam session (requires active 'approved' status)
 * Dynamically synthesizes module-specific questions
 */
export const startPeriodicExam = async (req, res) => {
  const studentId = req.user.id;
  const { moduleId } = req.body;

  if (!moduleId) {
    return res.status(400).json({ error: 'Module ID is required.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verify approval status
    const requestRes = await client.query(
      `SELECT id, status, rejection_reason FROM test_requests
       WHERE student_id = $1 AND module_id = $2`,
      [studentId, moduleId]
    );

    if (requestRes.rows.length === 0 || requestRes.rows[0].status !== 'approved') {
      await client.query('ROLLBACK');
      const currentStatus = requestRes.rows[0]?.status || 'unrequested';
      return res.status(403).json({
        error: `Periodic test access has not been approved. Current status: '${currentStatus}'.`,
        status: currentStatus,
        reason: requestRes.rows[0]?.rejection_reason || null,
      });
    }

    // 2. Fetch module & course info
    const modRes = await client.query(
      `SELECT id, course_id, level as difficulty FROM modules WHERE id = $1`,
      [moduleId]
    );

    if (modRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Module not found.' });
    }

    const courseId = modRes.rows[0].course_id;
    const modDifficulty = modRes.rows[0].difficulty || 'beginner';

    // 3. Dynamically synthesize 5 fresh periodic questions matching module topic
    const dynamicQuestions = await generateDynamicPeriodicQuestions(courseId, moduleId, modDifficulty, 5);

    // 4. Create active exam session
    const sessionId = crypto.randomUUID();
    await client.query(
      `INSERT INTO exam_sessions (id, student_id, course_id, module_id, type)
       VALUES ($1, $2, $3, $4, 'periodic')`,
      [sessionId, studentId, courseId, moduleId]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      examSessionId: sessionId,
      moduleId,
      totalQuestions: dynamicQuestions.length,
      isDynamicallyGenerated: true,
      questions: dynamicQuestions.map((q) => ({
        id: q.id,
        difficulty: q.difficulty,
        questionText: q.questionText,
        options: {
          A: q.optionA,
          B: q.optionB,
          C: q.optionC,
          D: q.optionD,
        },
      })),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error starting periodic exam:', err);
    return res.status(500).json({ error: 'Internal server error starting periodic exam.' });
  } finally {
    client.release();
  }
};

/**
 * POST /api/v1/exams/periodic/submit
 * Evaluate periodic exam results
 */
export const submitPeriodicExam = async (req, res) => {
  const studentId = req.user.id;
  const { examSessionId, responses } = req.body;

  if (!examSessionId || !Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: 'Exam session ID and responses are required.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const sessionRes = await client.query(
      `SELECT id, module_id, course_id, completed_at
       FROM exam_sessions
       WHERE id = $1 AND student_id = $2 AND type = 'periodic'`,
      [examSessionId, studentId]
    );

    if (sessionRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Periodic exam session not found or unauthorized.' });
    }

    if (sessionRes.rows[0].completed_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This exam has already been evaluated.' });
    }

    const questionIds = responses.map((r) => r.questionId);
    const keysRes = await client.query(
      `SELECT id, correct_option, difficulty FROM question_bank WHERE id = ANY($1::uuid[])`,
      [questionIds]
    );

    const keyMap = new Map();
    keysRes.rows.forEach((k) => keyMap.set(k.id, k));

    let correctCount = 0;
    const totalCount = responses.length;

    for (const r of responses) {
      const item = keyMap.get(r.questionId);
      const isCorrect = item && item.correct_option.toUpperCase() === r.selectedOption?.toUpperCase();
      if (isCorrect) correctCount++;

      await client.query(
        `INSERT INTO exam_responses (id, exam_session_id, question_id, selected_option, is_correct)
         VALUES ($1, $2, $3, $4, $5)`,
        [crypto.randomUUID(), examSessionId, r.questionId, r.selectedOption, isCorrect ? 1 : 0]
      );
    }

    const percentage = parseFloat(((correctCount / totalCount) * 100).toFixed(2));
    const isPassed = percentage >= 70.0;

    await client.query(
      `UPDATE exam_sessions
       SET score = $1, completed_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [percentage, examSessionId]
    );

    // If passed, mark module fully completed in progress tracking
    const moduleId = sessionRes.rows[0].module_id;
    if (moduleId) {
      await client.query(
        `UPDATE student_module_progress
         SET is_completed = 1, last_studied_at = CURRENT_TIMESTAMP
         WHERE student_id = $1 AND module_id = $2`,
        [studentId, moduleId]
      );
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      scorePercentage: percentage,
      correctCount,
      totalCount,
      isPassed,
      message: isPassed
        ? 'Periodic evaluation PASSED! Module mastery verified.'
        : 'Periodic evaluation did not meet pass threshold (70%). Please review module concepts with your mentor.',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error submitting periodic exam:', err);
    return res.status(500).json({ error: 'Internal server error evaluating exam.' });
  } finally {
    client.release();
  }
};
