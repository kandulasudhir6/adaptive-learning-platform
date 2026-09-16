import express from 'express';
import {
  getCourses,
  getCourseContent,
  getModuleDetails,
  updateStudyProgress,
  getFaculties,
  enrollCourseWithFaculty,
  getMyRoadmap,
} from '../controllers/courseController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Faculty mentor selection endpoints
router.get('/faculties', getFaculties);

// Course browsing and content
router.get('/', getCourses);
router.get('/:id/content', getCourseContent);
router.post('/:id/enroll', enrollCourseWithFaculty);
router.get('/:id/roadmap', getMyRoadmap);

// Module details & study tracker
router.get('/modules/:id', getModuleDetails);
router.post('/modules/:id/progress', updateStudyProgress);

export default router;
