import { Router } from 'express';
import {
  initiateGoogleAuth,
  handleGoogleCallback,
  linkGoogleAccount,
  unlinkGoogleAccount,
  getGoogleAuthUrl,
  getOAuthStatus
} from '../controllers/oauth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public OAuth routes - no authentication required
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);
router.get('/google/url', getGoogleAuthUrl);

// Protected OAuth routes - authentication required
router.get('/status', authenticateToken, getOAuthStatus);
router.post('/google/link', authenticateToken, linkGoogleAccount);
router.delete('/google/unlink', authenticateToken, unlinkGoogleAccount);

export const oauthRoutes = router; 