import { Router } from 'express';
import { 
  registerUser, 
  loginUser, 
  getUserProfile,
  updateUserProfile,
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences
} from '../controllers/landing_user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', authenticateToken, getUserProfile);
router.put('/profile', authenticateToken, updateUserProfile);
router.put('/change-password', authenticateToken, changePassword);
router.get('/notification-preferences', authenticateToken, getNotificationPreferences);
router.put('/notification-preferences', authenticateToken, updateNotificationPreferences);

export const landingUserRoutes = router; 