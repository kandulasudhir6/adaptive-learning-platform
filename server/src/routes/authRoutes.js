import express from 'express';
import {
  register,
  login,
  getMe,
  getDemoAccounts,
  initiateFacultyQRSession,
  checkFacultyQRSessionStatus,
  verifyFacultyQRSession,
} from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public auth endpoints
router.post('/register', register);
router.post('/login', login);
router.get('/demo-accounts', getDemoAccounts);

// Faculty QR code authentication
router.post('/faculty-qr/initiate', initiateFacultyQRSession);
router.get('/faculty-qr/status/:token', checkFacultyQRSessionStatus);
router.post('/faculty-qr/verify', verifyFacultyQRSession);

// Protected profile
router.get('/me', authenticateToken, getMe);

export default router;
