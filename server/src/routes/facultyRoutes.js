import express from 'express';
import {
  getMyStudents,
  getStudentLogins,
  getStudentRoadmap,
  updateStudentRoadmap,
  getFacultySubjects,
  uploadFacultySubject,
  getPendingRequests,
  reviewRequest,
  getDiagnosticQuestions,
  updateDiagnosticQuestion,
} from '../controllers/facultyController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('faculty', 'admin'));

// Assigned Mentees & Day-to-Day Logins
router.get('/my-students', getMyStudents);
router.get('/students', getMyStudents);
router.get('/student/:id/logins', getStudentLogins);
router.get('/students/:id/logins', getStudentLogins);

// Student Personalized Roadmap Customization & Approval
router.get('/student/:id/roadmap', getStudentRoadmap);
router.get('/students/:id/roadmap', getStudentRoadmap);
router.patch('/roadmap/:id', updateStudentRoadmap);
router.patch('/roadmaps/:id', updateStudentRoadmap);

// Specialized Subjects Upload
router.get('/subjects', getFacultySubjects);
router.post('/subjects', uploadFacultySubject);

// Weekly Periodic Test Approval Queue
router.get('/requests', getPendingRequests);
router.patch('/requests/:id', reviewRequest);

// Diagnostic Exam Question Bank (Faculty Edit)
router.get('/diagnostic-questions', getDiagnosticQuestions);
router.patch('/diagnostic-questions/:id', updateDiagnosticQuestion);

export default router;
