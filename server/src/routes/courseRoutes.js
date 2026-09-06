import express from 'express';
import {
  getCourses,
  getCourseContent,
  getModuleDetails,
  updateStudyProgress,
} from '../controllers/courseController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getCourses);
router.get('/:id/content', getCourseContent);
router.get('/modules/:id', getModuleDetails);
router.post('/modules/:id/progress', updateStudyProgress);

export default router;
