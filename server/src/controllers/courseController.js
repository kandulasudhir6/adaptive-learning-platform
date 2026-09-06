import pool from '../config/db.js';

/**
 * Get all available courses
 */
export const getCourses = async (req, res) => {
  try {
    const coursesRes = await pool.query(
      `SELECT c.id, c.title, c.code, c.description, c.created_at,
              COUNT(m.id) as total_modules
       FROM courses c
       LEFT JOIN modules m ON c.id = m.course_id
       GROUP BY c.id
       ORDER BY c.code`
    );
    return res.status(200).json({ success: true, courses: coursesRes.rows });
  } catch (err) {
    console.error('Error fetching courses:', err);
    return res.status(500).json({ error: 'Internal server error fetching courses.' });
  }
};

/**
 * GET /courses/:id/content
 * Returns unlocked course modules based on student's evaluated level and progress.
 */
export const getCourseContent = async (req, res) => {
  const studentId = req.user.id;
  const courseId = req.params.id;

  try {
    // 1. Get student profile & current level
    const profileRes = await pool.query(
      `SELECT current_level, entrance_completed FROM student_profiles WHERE user_id = $1`,
      [studentId]
    );

    const profile = profileRes.rows[0];
    const studentLevel = profile?.current_level || 'beginner';
    const entranceCompleted = Boolean(profile?.entrance_completed);

    // 2. Fetch course info
    const courseRes = await pool.query(`SELECT * FROM courses WHERE id = $1`, [courseId]);
    if (courseRes.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // 3. Fetch all modules for this course
    const modulesRes = await pool.query(
      `SELECT m.id, m.course_id, m.title, m.level, m.sequence_order,
              m.study_time_recommended,
              COALESCE(p.time_spent_minutes, 0) as time_spent_minutes,
              COALESCE(p.is_completed, 0) as is_completed,
              COALESCE(p.last_studied_at, NULL) as last_studied_at,
              tr.id as request_id,
              tr.status as request_status,
              tr.rejection_reason,
              tr.requested_at,
              tr.reviewed_at
       FROM modules m
       LEFT JOIN student_module_progress p ON m.id = p.module_id AND p.student_id = $1
       LEFT JOIN test_requests tr ON m.id = tr.module_id AND tr.student_id = $1
       WHERE m.course_id = $2
       ORDER BY
         CASE m.level
           WHEN 'beginner' THEN 1
           WHEN 'intermediate' THEN 2
           WHEN 'advanced' THEN 3
         END,
         m.sequence_order ASC`,
      [studentId, courseId]
    );

    // Level precedence ranks
    const LEVEL_RANK = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
    };

    const studentRank = LEVEL_RANK[studentLevel] || 1;

    // Determine accessibility for each module:
    // If entrance test is not completed, prompt entrance test first.
    // If student is at Level 2 (intermediate), Level 1 modules are marked "Bypassed / Mastered",
    // Level 2 modules are unlocked, Level 3 modules are locked until Level 2 periodic evaluation.
    const enrichedModules = modulesRes.rows.map((m) => {
      const moduleRank = LEVEL_RANK[m.level];
      let isUnlocked = false;
      let isBypassed = false;
      let lockReason = null;

      if (!entranceCompleted) {
        isUnlocked = false;
        lockReason = 'Diagnostic Entrance Exam required to place your starting level.';
      } else if (moduleRank < studentRank) {
        // Lower level bypassed by diagnostic test
        isUnlocked = true;
        isBypassed = true;
      } else if (moduleRank === studentRank) {
        // Current level is unlocked!
        isUnlocked = true;
      } else {
        // Higher level requires completing current level periodic tests
        isUnlocked = false;
        lockReason = `Locked until ${studentLevel.toUpperCase()} tier periodic examinations are passed.`;
      }

      return {
        ...m,
        is_completed: Boolean(m.is_completed),
        isUnlocked,
        isBypassed,
        lockReason,
        // Status can be: 'ready_to_study', 'in_progress', 'ready_for_test', 'test_requested', 'test_approved', 'test_rejected', 'test_completed'
        actionState: deriveActionState(m, isUnlocked, isBypassed),
      };
    });

    return res.status(200).json({
      success: true,
      course: courseRes.rows[0],
      studentLevel,
      entranceCompleted,
      modules: enrichedModules,
    });
  } catch (err) {
    console.error('Error in getCourseContent:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

function deriveActionState(mod, isUnlocked, isBypassed) {
  if (!isUnlocked) return 'locked';
  if (isBypassed) return 'bypassed';
  if (mod.request_status === 'approved') return 'test_approved';
  if (mod.request_status === 'pending') return 'pending_approval';
  if (mod.request_status === 'rejected') return 'rejected';
  if (mod.is_completed) return 'ready_to_request_test';
  return 'in_progress';
}

/**
 * GET /modules/:id
 * Retrieve module content for learning
 */
export const getModuleDetails = async (req, res) => {
  const studentId = req.user.id;
  const moduleId = req.params.id;

  try {
    const modRes = await pool.query(
      `SELECT m.*, c.title as course_title, c.code as course_code
       FROM modules m
       JOIN courses c ON m.course_id = c.id
       WHERE m.id = $1`,
      [moduleId]
    );

    if (modRes.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    const progRes = await pool.query(
      `SELECT time_spent_minutes, is_completed
       FROM student_module_progress
       WHERE student_id = $1 AND module_id = $2`,
      [studentId, moduleId]
    );

    const reqRes = await pool.query(
      `SELECT id, status, rejection_reason, requested_at, reviewed_at
       FROM test_requests
       WHERE student_id = $1 AND module_id = $2
       ORDER BY requested_at DESC LIMIT 1`,
      [studentId, moduleId]
    );

    return res.status(200).json({
      success: true,
      module: modRes.rows[0],
      progress: progRes.rows[0] || { time_spent_minutes: 0, is_completed: 0 },
      testRequest: reqRes.rows[0] || null,
    });
  } catch (err) {
    console.error('Error fetching module details:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /modules/:id/progress
 * Update time spent on module content and completion status
 */
export const updateStudyProgress = async (req, res) => {
  const studentId = req.user.id;
  const moduleId = req.params.id;
  const { additionalMinutes = 10, markCompleted = false } = req.body;

  try {
    const existing = await pool.query(
      `SELECT time_spent_minutes, is_completed
       FROM student_module_progress
       WHERE student_id = $1 AND module_id = $2`,
      [studentId, moduleId]
    );

    let newTime = additionalMinutes;
    let completedFlag = markCompleted ? 1 : 0;

    if (existing.rows.length > 0) {
      newTime = existing.rows[0].time_spent_minutes + additionalMinutes;
      completedFlag = markCompleted ? 1 : existing.rows[0].is_completed;
      await pool.query(
        `UPDATE student_module_progress
         SET time_spent_minutes = $1, is_completed = $2, last_studied_at = CURRENT_TIMESTAMP
         WHERE student_id = $3 AND module_id = $4`,
        [newTime, completedFlag, studentId, moduleId]
      );
    } else {
      await pool.query(
        `INSERT INTO student_module_progress (student_id, module_id, time_spent_minutes, is_completed)
         VALUES ($1, $2, $3, $4)`,
        [studentId, moduleId, newTime, completedFlag]
      );
    }

    return res.status(200).json({
      success: true,
      timeSpentMinutes: newTime,
      isCompleted: Boolean(completedFlag),
    });
  } catch (err) {
    console.error('Error updating progress:', err);
    return res.status(500).json({ error: 'Internal server error updating progress.' });
  }
};
