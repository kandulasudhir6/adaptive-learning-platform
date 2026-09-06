import express from 'express';
import { register, login, getMe, getDemoAccounts } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.get('/demo-accounts', getDemoAccounts);

export default router;
