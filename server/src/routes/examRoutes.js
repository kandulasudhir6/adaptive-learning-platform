import express from 'express';
import { generateEntranceExam, submitEntranceExam } from '../controllers/entranceExamController.js';
import {
  requestTestAccess,
  startPeriodicExam,
  submitPeriodicExam,
} from '../controllers/periodicTestController.js';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('student'));

// Diagnostic Entrance Exam Routes (MAPS)
router.post('/entrance/generate', generateEntranceExam);
router.post('/entrance/submit', submitEntranceExam);

// Periodic Test Routes
router.post('/periodic/start', startPeriodicExam);
router.post('/periodic/submit', submitPeriodicExam);
router.post('/request-access', requestTestAccess);

export default router;
