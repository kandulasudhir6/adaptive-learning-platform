import pool from '../config/db.js';

/**
 * GET /api/v1/mentor/requests
 * Fetch pending test requests for students
 */
export const getPendingRequests = async (req, res) => {
  const reviewerId = req.user.id;
  const userRole = req.user.role;

  try {
    // Mentors see assigned students; faculty & admins see all or assigned
    const query = `
      SELECT
        tr.id as request_id,
        tr.student_id,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        u.email as student_email,
        sp.current_level as student_current_level,
        sp.entrance_completed,
        m.id as module_id,
        m.title as module_title,
        m.level as module_level,
        m.sequence_order as module_sequence,
        m.study_time_recommended,
        c.id as course_id,
        c.title as course_title,
        c.code as course_code,
        tr.status,
        tr.time_spent_minutes,
        tr.requested_at,
        tr.reviewed_at,
        tr.rejection_reason
      FROM test_requests tr
      JOIN users u ON tr.student_id = u.id
      JOIN student_profiles sp ON u.id = sp.user_id
      JOIN modules m ON tr.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      WHERE tr.status = 'pending'
      ORDER BY tr.requested_at DESC
    `;

    const result = await pool.query(query);

    // Format metrics (e.g. 4h 12m, threshold check)
    const formattedRequests = result.rows.map((r) => {
      const hours = Math.floor(r.time_spent_minutes / 60);
      const mins = r.time_spent_minutes % 60;
      const formattedTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      const thresholdMet = r.time_spent_minutes >= (r.study_time_recommended || 60);

      return {
        ...r,
        formattedTimeSpent: formattedTime,
        thresholdMet,
        thresholdLabel: thresholdMet
          ? 'Threshold Met'
          : `Below recommended ${Math.floor((r.study_time_recommended || 120) / 60)}h`,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedRequests.length,
      requests: formattedRequests,
    });
  } catch (err) {
    console.error('Error in getPendingRequests:', err);
    return res.status(500).json({ error: 'Internal server error fetching requests.' });
  }
};

/**
 * PATCH /api/v1/mentor/requests/:id
 * Approve or reject a student's periodic test request
 */
export const reviewRequest = async (req, res) => {
  const reviewerId = req.user.id;
  const requestId = req.params.id;
  const { status, rejectionReason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "Status must be either 'approved' or 'rejected'." });
  }

  if (status === 'rejected' && !rejectionReason) {
    return res.status(400).json({ error: 'Feedback / rejection reason is required when rejecting a request.' });
  }

  try {
    const existing = await pool.query(`SELECT id, status FROM test_requests WHERE id = $1`, [requestId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Test request not found.' });
    }

    await pool.query(
      `UPDATE test_requests
       SET status = $1, rejection_reason = $2, reviewer_id = $3, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, status === 'rejected' ? rejectionReason : null, reviewerId, requestId]
    );

    return res.status(200).json({
      success: true,
      message: `Test request successfully ${status}.`,
      requestId,
      status,
      reviewedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error in reviewRequest:', err);
    return res.status(500).json({ error: 'Internal server error reviewing request.' });
  }
};

/**
 * GET /api/v1/mentor/students
 * Return roster of all students with levels, diagnostic scores, and module completions
 */
export const getStudentRoster = async (req, res) => {
  try {
    const rosterRes = await pool.query(`
      SELECT
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        sp.current_level,
        sp.entrance_completed,
        sp.updated_at as last_level_update,
        m.first_name as mentor_first_name,
        m.last_name as mentor_last_name,
        f.first_name as faculty_first_name,
        f.last_name as faculty_last_name,
        (SELECT score FROM exam_sessions WHERE student_id = u.id AND type = 'entrance' ORDER BY completed_at DESC LIMIT 1) as entrance_score,
        (SELECT COUNT(*) FROM student_module_progress WHERE student_id = u.id AND is_completed = 1) as completed_modules_count,
        (SELECT AVG(score) FROM exam_sessions WHERE student_id = u.id AND type = 'periodic' AND completed_at IS NOT NULL) as avg_periodic_score
      FROM users u
      JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN users m ON sp.assigned_mentor_id = m.id
      LEFT JOIN users f ON sp.assigned_faculty_id = f.id
      WHERE u.role = 'student'
      ORDER BY u.first_name ASC
    `);

    return res.status(200).json({
      success: true,
      students: rosterRes.rows.map((s) => ({
        ...s,
        entrance_completed: Boolean(s.entrance_completed),
        entrance_score: s.entrance_score != null ? parseFloat(s.entrance_score).toFixed(1) : null,
        avg_periodic_score: s.avg_periodic_score != null ? parseFloat(s.avg_periodic_score).toFixed(1) : null,
      })),
    });
  } catch (err) {
    console.error('Error fetching roster:', err);
    return res.status(500).json({ error: 'Internal server error fetching roster.' });
  }
};

/**
 * GET /api/v1/mentor/question-bank
 * View question bank overview for faculty/mentors
 */
export const getQuestionBankOverview = async (req, res) => {
  try {
    const statsRes = await pool.query(`
      SELECT difficulty, COUNT(*) as count
      FROM question_bank
      GROUP BY difficulty
    `);

    const questionsRes = await pool.query(`
      SELECT q.id, q.difficulty, q.question_text, q.correct_option, c.code as course_code
      FROM question_bank q
      JOIN courses c ON q.course_id = c.id
      ORDER BY q.difficulty, q.created_at DESC
      LIMIT 30
    `);

    return res.status(200).json({
      success: true,
      stats: statsRes.rows,
      sampleQuestions: questionsRes.rows,
    });
  } catch (err) {
    console.error('Error fetching question bank:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
