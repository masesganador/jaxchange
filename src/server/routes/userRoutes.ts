import { Router } from 'express';
import { validateRequest, userSchemas } from '../middleware/validation';
import { authenticateToken, requireActiveUser } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import {
  register,
  login,
  getProfile,
  updateProfile,
  updatePreferences
} from '../controllers/userController';

const router = Router();

// Public routes
router.post('/register', validateRequest(userSchemas.register), asyncHandler(register));
router.post('/login', validateRequest(userSchemas.login), asyncHandler(login));

// Protected routes
router.get('/profile', authenticateToken, requireActiveUser, asyncHandler(getProfile));
router.put('/profile', authenticateToken, requireActiveUser, validateRequest(userSchemas.updateProfile), asyncHandler(updateProfile));
router.put('/preferences', authenticateToken, requireActiveUser, validateRequest(userSchemas.updatePreferences), asyncHandler(updatePreferences));

export default router;
