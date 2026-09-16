import pool from '../config/db.js';
import crypto from 'node:crypto';
import { generateDynamicEntranceQuestions } from '../services/questionGenerator.js';
import { executeCode } from '../services/codeRunner.js';
import { generatePersonalizedRoadmap } from '../services/roadmapGenerator.js';

/**
 * 1. GENERATE DYNAMIC ENTRANCE EXAM WITH CODING CHALLENGE (CodeTantra Style)
 * Samples 15 dynamic non-repeating questions (5-5-5) + 1 algorithmic coding problem
 */
export const generateEntranceExam = async (req, res) => {
  const studentId = req.user.id;
  let { courseId } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Default course if not specified
    if (!courseId) {
      const enrolled = await client.query(
        `SELECT course_id FROM student_course_enrollments WHERE student_id = $1 AND status = 'active' LIMIT 1`,
        [studentId]
      );
      if (enrolled.rows.length > 0) {
        courseId = enrolled.rows[0].course_id;
      } else {
        const defaultCourse = await client.query(`SELECT id FROM courses ORDER BY code LIMIT 1`);
        if (defaultCourse.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'No active courses found in platform.' });
        }
        courseId = defaultCourse.rows[0].id;
      }
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

    // 1. Synthesize 15 fresh dynamic non-repeating questions (5 Beginner, 5 Intermediate, 5 Advanced)
    const questions = await generateDynamicEntranceQuestions(courseId);

    // 2. Fetch Coding Challenges for this exam session (CodeTantra style)
    // We want a progressive coding round: easy -> medium -> hard
    const challengeRes = await client.query(
      `SELECT id, title, description, starter_code, test_cases_json, difficulty
       FROM coding_challenges
       WHERE course_id = $1`
       // Removed LIMIT 1 to get all available challenges for the course
       ,
      [courseId]
    );

    let codingChallenges = [];
    if (challengeRes.rows.length > 0) {
      // Sort them by difficulty for progressive rounds
      const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
      const sortedChallenges = challengeRes.rows.sort((a, b) => 
        (difficultyOrder[a.difficulty] || 9) - (difficultyOrder[b.difficulty] || 9)
      );

      codingChallenges = sortedChallenges.map(c => {
        let testCases = [];
        try {
          testCases = JSON.parse(c.test_cases_json);
        } catch (e) {
          testCases = [];
        }

        return {
          id: c.id,
          title: c.title,
          description: c.description,
          difficulty: c.difficulty,
          starterCode: c.starter_code,
          // Only return public test cases for student testing in sandbox
          publicTestCases: testCases.filter((tc) => !tc.isHidden),
        };
      });
    }

    // Initialize active exam session
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

    return res.status(201).json({
      success: true,
      examSessionId: examSession.id,
      courseId,
      startedAt: examSession.started_at,
      totalQuestions: questions.length,
      isDynamicallyGenerated: true,
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
      codingChallenges,
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
 * 2. SUBMIT & EVALUATE ENTRANCE EXAM WITH CODING CHALLENGE + AI ROADMAP GENERATION
 */
export const submitEntranceExam = async (req, res) => {
  const studentId = req.user.id;
  const { examSessionId, responses, codingSubmission } = req.body;

  if (!examSessionId || !Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: 'Exam session ID and responses array are required.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate active exam session
    const sessionRes = await client.query(
      `SELECT es.id, es.course_id, es.completed_at, c.title as course_title
       FROM exam_sessions es
       JOIN courses c ON es.course_id = c.id
       WHERE es.id = $1 AND es.student_id = $2 AND es.type = 'entrance'`,
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

    const courseId = sessionRes.rows[0].course_id;
    const courseTitle = sessionRes.rows[0].course_title;

    // Fetch assigned faculty for this student/course
    const facultyRes = await client.query(
      `SELECT sce.faculty_id, sp.assigned_faculty_id
       FROM student_profiles sp
       LEFT JOIN student_course_enrollments sce ON sp.user_id = sce.student_id AND sce.course_id = $1
       WHERE sp.user_id = $2`,
      [courseId, studentId]
    );

    const facultyId = facultyRes.rows[0]?.faculty_id || facultyRes.rows[0]?.assigned_faculty_id || null;

    // --- PART 1: EVALUATE MCQ RESPONSES ---
    const questionIds = responses.map((r) => r.questionId);
    const keysResult = await client.query(
      `SELECT id, correct_option, difficulty FROM question_bank WHERE id = ANY($1::uuid[])`,
      [questionIds]
    );

    const questionMap = new Map();
    keysResult.rows.forEach((q) => questionMap.set(q.id, q));

    const WEIGHTS = { beginner: 1.0, intermediate: 2.0, advanced: 3.0 };
    let mcqEarnedPoints = 0;
    const maxMcqPoints = 30.0;
    const responseRecords = [];
    const breakdown = {
      beginner: { correct: 0, total: 0, points: 0 },
      intermediate: { correct: 0, total: 0, points: 0 },
      advanced: { correct: 0, total: 0, points: 0 },
    };

    for (const resp of responses) {
      const question = questionMap.get(resp.questionId);
      if (question) {
        const chosenOption = resp.selectedOption || resp.selectedAnswer || null;
        const isCorrect = chosenOption ? question.correct_option.toUpperCase() === chosenOption.toUpperCase() : false;
        const tier = question.difficulty;

        breakdown[tier].total++;
        if (isCorrect) {
          const pts = WEIGHTS[tier] || 1.0;
          mcqEarnedPoints += pts;
          breakdown[tier].correct++;
          breakdown[tier].points += pts;
        }

        responseRecords.push({
          id: crypto.randomUUID(),
          examSessionId,
          questionId: resp.questionId,
          selectedOption: chosenOption,
          isCorrect: isCorrect ? 1 : 0,
        });
      }
    }

    const mcqPercentage = parseFloat(((mcqEarnedPoints / maxMcqPoints) * 100).toFixed(2));

    // --- PART 2: EVALUATE CODING CHALLENGES (CodeTantra Sandbox) ---
    let codingScorePct = 100;
    
    // We now expect an array: codingSubmissions: [{ challengeId, code, testResults }]
    const submissionsArray = Array.isArray(codingSubmission) ? codingSubmission : 
                           (req.body.codingSubmissions || []);
                           
    if (submissionsArray.length > 0) {
      let totalCodingPct = 0;
      
      for (const sub of submissionsArray) {
        if (!sub.challengeId || !sub.code) continue;
        
        const chalRes = await client.query(
          `SELECT id, test_cases_json FROM coding_challenges WHERE id = $1`,
          [sub.challengeId]
        );

        if (chalRes.rows.length > 0) {
          let allTestCases = [];
          try {
            allTestCases = JSON.parse(chalRes.rows[0].test_cases_json);
          } catch (e) {
            allTestCases = [];
          }

          // Execute student's code against ALL test cases (public + hidden)
          const codingResult = executeCode(sub.code, allTestCases);
          totalCodingPct += codingResult.passRatePct;

          // Record submission
          await client.query(
            `INSERT INTO coding_submissions (id, student_id, challenge_id, exam_session_id, code_submitted, passed_cases, total_cases, is_passed, execution_time_ms)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              crypto.randomUUID(),
              studentId,
              sub.challengeId,
              examSessionId,
              sub.code,
              codingResult.passedCases,
              codingResult.totalCases,
              codingResult.allPassed ? 1 : 0,
              codingResult.results?.[0]?.executionTimeMs || 0,
            ]
          );
        }
      }
      
      codingScorePct = submissionsArray.length > 0 ? (totalCodingPct / submissionsArray.length) : 0;
    }

    // Combined Weighted Score: 70% MCQ + 30% Coding
    const compositeScore = parseFloat(
      (mcqPercentage * 0.7 + codingScorePct * 0.3).toFixed(2)
    );

    // Placement Tier Determination
    let assignedLevel = 'beginner';
    if (compositeScore >= 75.0) {
      assignedLevel = 'advanced';
    } else if (compositeScore >= 45.0) {
      assignedLevel = 'intermediate';
    }

    // Audit log insertion
    for (const record of responseRecords) {
      await client.query(
        `INSERT INTO exam_responses (id, exam_session_id, question_id, selected_option, is_correct)
         VALUES ($1, $2, $3, $4, $5)`,
        [record.id, record.examSessionId, record.questionId, record.selectedOption, record.isCorrect]
      );
    }

    // Finalize Exam Session
    await client.query(
      `UPDATE exam_sessions
       SET score = $1, assigned_level = $2, completed_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [compositeScore, assignedLevel, examSessionId]
    );

    // Update Student Profile
    await client.query(
      `UPDATE student_profiles
       SET current_level = $1, entrance_completed = 1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2`,
      [assignedLevel, studentId]
    );

    // --- PART 3: AI-GENERATED PERSONALIZED ROADMAP ---
    const generatedRoadmap = generatePersonalizedRoadmap({
      courseTitle,
      currentLevel: assignedLevel,
      diagnosticScorePct: compositeScore,
      codingScorePct,
    });

    const roadmapId = crypto.randomUUID();
    const milestonesJson = JSON.stringify(generatedRoadmap.milestones);

    // Insert or update student roadmap in 'pending_approval' state for Faculty review!
    await client.query(
      `INSERT INTO student_roadmaps (id, student_id, course_id, faculty_id, title, overview, current_level, status, milestones_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending_approval', $8)
       ON CONFLICT(student_id, course_id) DO UPDATE
       SET title = excluded.title, overview = excluded.overview, current_level = excluded.current_level,
           status = 'pending_approval', milestones_json = excluded.milestones_json, updated_at = CURRENT_TIMESTAMP`,
      [
        roadmapId,
        studentId,
        courseId,
        facultyId,
        generatedRoadmap.title,
        generatedRoadmap.overview,
        assignedLevel,
        milestonesJson,
      ]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Diagnostic entrance exam evaluated and AI Personalized Roadmap generated for Faculty approval!',
      compositeScore,
      mcqPercentage,
      codingScorePct,
      mcqEarnedPoints,
      maxMcqPoints,
      assignedLevel,
      breakdown,
      codingResult,
      roadmap: {
        id: roadmapId,
        title: generatedRoadmap.title,
        overview: generatedRoadmap.overview,
        status: 'pending_approval',
        statusNotice: 'Your personalized roadmap has been submitted to your assigned Faculty Mentor for review and official sign-off.',
        milestones: generatedRoadmap.milestones,
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting entrance exam:', error);
    return res.status(500).json({ error: 'Internal server error while scoring exam.' });
  } finally {
    client.release();
  }
};
