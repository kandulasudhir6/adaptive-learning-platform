import express from 'express';
import {
  getPendingRequests,
  reviewRequest,
  getStudentRoster,
  getQuestionBankOverview,
} from '../controllers/mentorController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('mentor', 'faculty', 'admin'));

router.get('/requests', getPendingRequests);
router.patch('/requests/:id', reviewRequest);
router.get('/students', getStudentRoster);
router.get('/question-bank', getQuestionBankOverview);

export default router;
