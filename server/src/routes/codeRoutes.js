import express from 'express';
import { runCode } from '../controllers/codeExecutionController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);
router.post('/run', runCode);

export default router;
