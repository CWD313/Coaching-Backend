import express from 'express';
import { signup, login, getProfile, updateProfile, changePassword } from '../controllers/authController.js';
// -------------------------------------------------------------------------------------
// ✅ FIX: Named Import { authMiddleware } को Default Import authMiddleware में बदला गया
// -------------------------------------------------------------------------------------
import authMiddleware from '../middlewares/authMiddleware.js'; 
import { validateSignup, validateLogin, validateChangePassword } from '../middlewares/validationMiddleware.js';

const router = express.Router();

/**
 * Public Routes
 */

// POST /api/auth/signup - Coach registration with invite code
router.post('/signup', validateSignup, signup);

// POST /api/auth/login - Coach login with mobile and password
router.post('/login', validateLogin, login);

/**
 * Protected Routes (require JWT token)
 */

// GET /api/auth/profile - Get current coach profile
router.get('/profile', authMiddleware, getProfile);

// PUT /api/auth/profile - Update coach profile
router.put('/profile', authMiddleware, updateProfile);

// PUT /api/auth/change-password - Change password
router.put('/change-password', authMiddleware, validateChangePassword, changePassword);

export default router;
