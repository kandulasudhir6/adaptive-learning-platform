import pool from '../config/db.js';
import crypto from 'node:crypto';

/**
 * 1. GET /api/v1/faculty/my-students
 * Fetch only the students who selected THIS faculty as their mentor
 */
export const getMyStudents = async (req, res) => {
  const facultyId = req.user.id;

  try {
    const query = `
      SELECT DISTINCT
        u.id as student_id,
        u.first_name,
        u.last_name,
        u.email,
        sp.current_level,
        sp.entrance_completed,
        c.id as course_id,
        c.title as course_title,
        c.code as course_code,
        sce.enrolled_at,
        sr.id as roadmap_id,
        sr.title as roadmap_title,
        sr.status as roadmap_status,
        (SELECT score FROM exam_sessions WHERE student_id = u.id AND type = 'entrance' ORDER BY completed_at DESC LIMIT 1) as entrance_score,
        (SELECT COUNT(*) FROM student_module_progress WHERE student_id = u.id AND is_completed = 1) as completed_modules,
        (SELECT COUNT(*) FROM user_login_logs WHERE user_id = u.id) as total_logins,
        (SELECT MAX(login_time) FROM user_login_logs WHERE user_id = u.id) as last_login_time
      FROM users u
      JOIN student_profiles sp ON u.id = sp.user_id
      LEFT JOIN student_course_enrollments sce ON u.id = sce.student_id AND sce.status = 'active'
      LEFT JOIN courses c ON sce.course_id = c.id
      LEFT JOIN student_roadmaps sr ON u.id = sr.student_id AND (c.id IS NULL OR sr.course_id = c.id)
      WHERE sce.faculty_id = $1 OR sp.assigned_faculty_id = $1
      ORDER BY u.first_name ASC
    `;

    const result = await pool.query(query, [facultyId]);

    const formatted = result.rows.map((s) => ({
      ...s,
      id: s.student_id,
      entrance_completed: Boolean(s.entrance_completed),
      entrance_score: s.entrance_score != null ? parseFloat(s.entrance_score).toFixed(1) : null,
      roadmap_status: s.roadmap_status || 'not_generated',
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      students: formatted,
    });
  } catch (err) {
    console.error('Error in getMyStudents:', err);
    return res.status(500).json({ error: 'Failed to fetch assigned students.' });
  }
};

/**
 * 2. GET /api/v1/faculty/student/:id/logins
 * View day-to-day login records and timeline for an assigned student
 */
export const getStudentLogins = async (req, res) => {
  const studentId = req.params.id;

  try {
    const studentRes = await pool.query(`SELECT id, first_name, last_name, email FROM users WHERE id = $1`, [studentId]);
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const logsRes = await pool.query(
      `SELECT id, login_time, ip_address, device_info
       FROM user_login_logs
       WHERE user_id = $1
       ORDER BY login_time DESC
       LIMIT 50`,
      [studentId]
    );

    return res.status(200).json({
      success: true,
      student: studentRes.rows[0],
      totalLogins: logsRes.rows.length,
      logs: logsRes.rows.map((l) => ({
        ...l,
        formattedDate: new Date(l.login_time).toLocaleDateString(undefined, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
        formattedTime: new Date(l.login_time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      })),
    });
  } catch (err) {
    console.error('Error fetching student login logs:', err);
    return res.status(500).json({ error: 'Failed to fetch student login history.' });
  }
};

/**
 * 3. GET /api/v1/faculty/student/:id/roadmap
 * Fetch a student's AI-generated roadmap for review and modification
 */
export const getStudentRoadmap = async (req, res) => {
  const studentId = req.params.id;

  try {
    const roadmapRes = await pool.query(
      `SELECT sr.*, c.title as course_title, c.code as course_code,
              u.first_name as student_first_name, u.last_name as student_last_name
       FROM student_roadmaps sr
       JOIN courses c ON sr.course_id = c.id
       JOIN users u ON sr.student_id = u.id
       WHERE sr.student_id = $1
       ORDER BY sr.created_at DESC
       LIMIT 1`,
      [studentId]
    );

    if (roadmapRes.rows.length === 0) {
      return res.status(404).json({ error: 'No roadmap generated yet for this student.' });
    }

    const row = roadmapRes.rows[0];
    let milestones = [];
    try {
      milestones = JSON.parse(row.milestones_json);
    } catch (e) {
      milestones = [];
    }

    return res.status(200).json({
      success: true,
      roadmap: {
        ...row,
        milestones,
      },
    });
  } catch (err) {
    console.error('Error fetching student roadmap:', err);
    return res.status(500).json({ error: 'Failed to fetch roadmap.' });
  }
};

/**
 * 4. PATCH /api/v1/faculty/roadmap/:id
 * Faculty updates/customizes milestones, adds professor notes, and approves the roadmap
 */
export const updateStudentRoadmap = async (req, res) => {
  const facultyId = req.user.id;
  const roadmapId = req.params.id;
  const { milestones, facultyNotes, status = 'approved' } = req.body;

  try {
    const existing = await pool.query(`SELECT id FROM student_roadmaps WHERE id = $1`, [roadmapId]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }

    const milestonesJson = typeof milestones === 'string' ? milestones : JSON.stringify(milestones);

    await pool.query(
      `UPDATE student_roadmaps
       SET milestones_json = $1, faculty_notes = $2, status = $3, faculty_id = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [milestonesJson, facultyNotes || null, status, facultyId, roadmapId]
    );

    return res.status(200).json({
      success: true,
      message: status === 'approved' ? 'Roadmap approved and released to student!' : 'Roadmap updated successfully.',
      status,
      roadmapId,
    });
  } catch (err) {
    console.error('Error updating roadmap:', err);
    return res.status(500).json({ error: 'Failed to update student roadmap.' });
  }
};

/**
 * 5. GET /api/v1/faculty/subjects & POST /api/v1/faculty/subjects
 * Manage faculty specialized subjects
 */
export const getFacultySubjects = async (req, res) => {
  const facultyId = req.user.id;
  try {
    const subjects = await pool.query(
      `SELECT * FROM faculty_subjects WHERE faculty_id = $1 ORDER BY created_at DESC`,
      [facultyId]
    );
    return res.status(200).json({ success: true, subjects: subjects.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch subjects.' });
  }
};

export const uploadFacultySubject = async (req, res) => {
  const facultyId = req.user.id;
  const { subjectName, category = 'Computer Science', description } = req.body;

  if (!subjectName) {
    return res.status(400).json({ error: 'Subject name is required.' });
  }

  try {
    const subjectId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO faculty_subjects (id, faculty_id, subject_name, category, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [subjectId, facultyId, subjectName.trim(), category.trim(), description || '']
    );

    return res.status(201).json({
      success: true,
      message: 'Specialized subject uploaded successfully.',
      subject: { id: subjectId, subjectName, category, description },
    });
  } catch (err) {
    console.error('Error uploading subject:', err);
    return res.status(500).json({ error: 'Failed to upload subject.' });
  }
};

/**
 * 6. GET /api/v1/faculty/requests & PATCH /api/v1/faculty/requests/:id
 * Weekly periodic test approvals
 */
export const getPendingRequests = async (req, res) => {
  const facultyId = req.user.id;

  try {
    const query = `
      SELECT
        tr.id as request_id,
        tr.student_id,
        u.first_name as student_first_name,
        u.last_name as student_last_name,
        u.email as student_email,
        sp.current_level as student_current_level,
        m.id as module_id,
        m.title as module_title,
        m.level as module_level,
        m.study_time_recommended,
        c.title as course_title,
        c.code as course_code,
        tr.status,
        tr.time_spent_minutes,
        tr.requested_at
      FROM test_requests tr
      JOIN users u ON tr.student_id = u.id
      JOIN student_profiles sp ON u.id = sp.user_id
      JOIN modules m ON tr.module_id = m.id
      JOIN courses c ON m.course_id = c.id
      LEFT JOIN student_course_enrollments sce ON u.id = sce.student_id AND sce.course_id = c.id
      WHERE tr.status = 'pending' AND (tr.reviewer_id = $1 OR sce.faculty_id = $1 OR sp.assigned_faculty_id = $1)
      ORDER BY tr.requested_at DESC
    `;

    const result = await pool.query(query, [facultyId]);

    const formatted = result.rows.map((r) => {
      const hours = Math.floor(r.time_spent_minutes / 60);
      const mins = r.time_spent_minutes % 60;
      const thresholdMet = r.time_spent_minutes >= (r.study_time_recommended || 60);

      return {
        ...r,
        formattedTimeSpent: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
        thresholdMet,
        thresholdLabel: thresholdMet ? 'Threshold Met' : `Below recommended ${Math.floor((r.study_time_recommended || 120) / 60)}h`,
      };
    });

    return res.status(200).json({ success: true, count: formatted.length, requests: formatted });
  } catch (err) {
    console.error('Error in getPendingRequests:', err);
    return res.status(500).json({ error: 'Failed to fetch test requests.' });
  }
};

export const reviewRequest = async (req, res) => {
  const facultyId = req.user.id;
  const requestId = req.params.id;
  const { status, rejectionReason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: "Status must be 'approved' or 'rejected'." });
  }

  try {
    await pool.query(
      `UPDATE test_requests
       SET status = $1, rejection_reason = $2, reviewer_id = $3, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, status === 'rejected' ? rejectionReason : null, facultyId, requestId]
    );

    return res.status(200).json({
      success: true,
      message: `Test request successfully ${status}.`,
      requestId,
      status,
    });
  } catch (err) {
    console.error('Error reviewing request:', err);
    return res.status(500).json({ error: 'Failed to review request.' });
  }
};

/**
 * 7. GET /api/v1/faculty/diagnostic-questions
 * Faculty views all questions in the question_bank (to review/edit)
 */
export const getDiagnosticQuestions = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, course_id, difficulty, question_text,
              option_a, option_b, option_c, option_d, correct_option, created_at
       FROM question_bank
       ORDER BY difficulty ASC, created_at DESC
       LIMIT 200`
    );
    return res.status(200).json({ success: true, questions: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Error fetching diagnostic questions:', err);
    return res.status(500).json({ error: 'Failed to fetch diagnostic questions.' });
  }
};

/**
 * 8. PATCH /api/v1/faculty/diagnostic-questions/:id
 * Faculty edits a specific question in the question_bank
 */
export const updateDiagnosticQuestion = async (req, res) => {
  const { id } = req.params;
  const { questionText, optionA, optionB, optionC, optionD, correctOption } = req.body;

  if (!questionText || !optionA || !optionB || !optionC || !optionD || !correctOption) {
    return res.status(400).json({ error: 'All question fields are required.' });
  }

  if (!['A', 'B', 'C', 'D'].includes(correctOption.toUpperCase())) {
    return res.status(400).json({ error: 'correctOption must be A, B, C, or D.' });
  }

  try {
    const existing = await pool.query(`SELECT id FROM question_bank WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found.' });
    }

    await pool.query(
      `UPDATE question_bank
       SET question_text = $1, option_a = $2, option_b = $3, option_c = $4, option_d = $5,
           correct_option = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [questionText.trim(), optionA.trim(), optionB.trim(), optionC.trim(), optionD.trim(),
       correctOption.toUpperCase(), id]
    );

    return res.status(200).json({
      success: true,
      message: 'Diagnostic question updated successfully.',
      questionId: id,
    });
  } catch (err) {
    console.error('Error updating diagnostic question:', err);
    return res.status(500).json({ error: 'Failed to update diagnostic question.' });
  }
};
