import pool from '../config/db.js';
import crypto from 'node:crypto';
import { generateDynamicEntranceQuestions } from '../services/questionGenerator.js';

/**
 * 1. GENERATE DYNAMIC ENTRANCE EXAM
 * Multi-Tiered Adaptive Pool Sampling (MAPS) with Dynamic Question Synthesis.
 * Automatically generates 15 fresh questions (5 Beginner, 5 Intermediate, 5 Advanced).
 * Creates an active exam session and strips answers before returning.
 */
export const generateEntranceExam = async (req, res) => {
  const studentId = req.user.id;
  let { courseId } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Default to the first course if courseId is not explicitly sent
    if (!courseId) {
      const defaultCourse = await client.query(`SELECT id FROM courses ORDER BY code LIMIT 1`);
      if (defaultCourse.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'No active courses found in platform.' });
      }
      courseId = defaultCourse.rows[0].id;
    }

    // Check if student already completed the entrance exam
    const profileCheck = await client.query(
      `SELECT entrance_completed, current_level FROM student_profiles WHERE user_id = $1`,
      [studentId]
    );

    if (profileCheck.rows[0]?.entrance_completed) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Entrance exam has already been completed.',
        currentLevel: profileCheck.rows[0].current_level,
      });
    }

    // Synthesize 15 fresh dynamic questions on the fly!
    const questions = await generateDynamicEntranceQuestions(courseId);

    // Initialize an active exam session
    const sessionId = crypto.randomUUID();
    await client.query(
      `INSERT INTO exam_sessions (id, student_id, course_id, type)
       VALUES ($1, $2, $3, 'entrance')`,
      [sessionId, studentId, courseId]
    );

    const sessionResult = await client.query(
      `SELECT id, started_at FROM exam_sessions WHERE id = $1`,
      [sessionId]
    );
    const examSession = sessionResult.rows[0];

    await client.query('COMMIT');

    // Return session details alongside sanitized questions
    return res.status(201).json({
      success: true,
      examSessionId: examSession.id,
      startedAt: examSession.started_at,
      totalQuestions: questions.length,
      isDynamicallyGenerated: true,
      distribution: {
        beginner: 5,
        intermediate: 5,
        advanced: 5,
      },
      questions: questions.map((q) => ({
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
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating entrance exam:', error);
    return res.status(500).json({ error: 'Internal server error while generating exam.' });
  } finally {
    client.release();
  }
};

/**
 * 2. SUBMIT & EVALUATE ENTRANCE EXAM
 * Scores submitted answers against correct keys, calculates weighted %,
 * updates the student's current level, and completes the exam session.
 */
export const submitEntranceExam = async (req, res) => {
  const studentId = req.user.id;
  const { examSessionId, responses } = req.body;

  if (!examSessionId || !Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: 'Exam session ID and responses array are required.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate active exam session
    const sessionRes = await client.query(
      `SELECT id, completed_at FROM exam_sessions
       WHERE id = $1 AND student_id = $2 AND type = 'entrance'`,
      [examSessionId, studentId]
    );

    if (sessionRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Exam session not found or unauthorized.' });
    }

    if (sessionRes.rows[0].completed_at) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This exam session has already been submitted.' });
    }

    // Extract Question IDs from responses to fetch target answer keys
    const questionIds = responses.map((r) => r.questionId);

    const keysResult = await client.query(
      `SELECT id, correct_option, difficulty
       FROM question_bank
       WHERE id = ANY($1::uuid[])`,
      [questionIds]
    );

    const questionMap = new Map();
    keysResult.rows.forEach((q) => questionMap.set(q.id, q));

    // Scoring Multipliers
    const WEIGHTS = {
      beginner: 1.0,
      intermediate: 2.0,
      advanced: 3.0,
    };

    let totalEarnedPoints = 0;
    const maxPossiblePoints = 30.0; // (5 * 1.0) + (5 * 2.0) + (5 * 3.0)
    const responseRecords = [];
    const breakdown = {
      beginner: { correct: 0, total: 0, points: 0 },
      intermediate: { correct: 0, total: 0, points: 0 },
      advanced: { correct: 0, total: 0, points: 0 },
    };

    // Score each response
    for (const resp of responses) {
      const question = questionMap.get(resp.questionId);

      if (question) {
        const isCorrect = question.correct_option.toUpperCase() === resp.selectedOption?.toUpperCase();
        const tier = question.difficulty;

        breakdown[tier].total++;
        if (isCorrect) {
          const pts = WEIGHTS[tier] || 1.0;
          totalEarnedPoints += pts;
          breakdown[tier].correct++;
          breakdown[tier].points += pts;
        }

        responseRecords.push({
          id: crypto.randomUUID(),
          examSessionId,
          questionId: resp.questionId,
          selectedOption: resp.selectedOption,
          isCorrect: isCorrect ? 1 : 0,
        });
      }
    }

    // Calculate percentage and determine level placement
    const scorePercentage = parseFloat(
      ((totalEarnedPoints / maxPossiblePoints) * 100).toFixed(2)
    );

    let assignedLevel = 'beginner';
    if (scorePercentage >= 75.0) {
      assignedLevel = 'advanced';
    } else if (scorePercentage >= 45.0) {
      assignedLevel = 'intermediate';
    }

    // Bulk insert response audit log
    for (const record of responseRecords) {
      await client.query(
        `INSERT INTO exam_responses (id, exam_session_id, question_id, selected_option, is_correct)
         VALUES ($1, $2, $3, $4, $5)`,
        [record.id, record.examSessionId, record.questionId, record.selectedOption, record.isCorrect]
      );
    }

    // Finalize Exam Session record
    await client.query(
      `UPDATE exam_sessions
       SET score = $1, assigned_level = $2, completed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [scorePercentage, assignedLevel, examSessionId]
    );

    // Update Student Profile with evaluated level
    await client.query(
      `UPDATE student_profiles
       SET current_level = $1, entrance_completed = 1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [assignedLevel, studentId]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Entrance exam evaluated successfully.',
      scorePercentage,
      totalEarnedPoints,
      maxPossiblePoints,
      assignedLevel,
      breakdown,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting entrance exam:', error);
    return res.status(500).json({ error: 'Internal server error while scoring exam.' });
  } finally {
    client.release();
  }
};
