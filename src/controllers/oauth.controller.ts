import { Request, Response, NextFunction } from 'express';
import { oauthService } from '../services/oauth.service';
import { AppError } from '../middleware/error.middleware';

/**
 * Initiate Google OAuth for landing page users
 */
export const initiateGoogleAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userType = req.query.type === 'admin' ? 'admin' : 'landing';
    const authUrl = oauthService.getGoogleAuthUrl(userType);
    
    // Redirect to Google OAuth
    res.redirect(authUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Google OAuth callback
 */
export const handleGoogleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, state, error: oauthError } = req.query;

    // Handle OAuth errors
    if (oauthError) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=oauth_cancelled`);
    }

    if (!code || !state) {
      return next(new AppError('Missing authorization code or state', 400));
    }

    // Process the OAuth callback
    const result = await oauthService.handleGoogleCallback(
      code as string, 
      state as string
    );

    // Determine redirect URL based on user type
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    let redirectUrl = frontendUrl;

    if (result.userType === 'admin_user') {
      redirectUrl = `${frontendUrl}/admin/dashboard`;
    } else {
      redirectUrl = `${frontendUrl}/dashboard`;
    }

    // Add success parameters
    const params = new URLSearchParams({
      token: result.token,
      user_type: result.userType,
      is_new: result.isNewUser.toString()
    });

    res.redirect(`${redirectUrl}?${params.toString()}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    
    // Redirect to frontend with error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const errorType = error instanceof AppError ? 'oauth_error' : 'oauth_failed';
    res.redirect(`${frontendUrl}/login?error=${errorType}`);
  }
};

/**
 * Link Google account to existing authenticated user
 */
export const linkGoogleAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as any;
    if (!user || !user.id) {
      return next(new AppError('User not authenticated', 401));
    }

    const { code, state } = req.body;
    if (!code || !state) {
      return next(new AppError('Missing authorization code or state', 400));
    }

    // Determine user type
    const userType = user.user_type === 'admin' ? 'admin_user' : 'landing_user';

    const result = await oauthService.linkGoogleAccount(
      user.id,
      userType,
      code,
      state
    );

    res.status(200).json({
      status: 'success',
      message: 'Google account linked successfully',
      data: {
        linked: true,
        google_profile: {
          name: result.googleProfile.name,
          email: result.googleProfile.email,
          picture: result.googleProfile.picture
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unlink Google account from authenticated user
 */
export const unlinkGoogleAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as any;
    if (!user || !user.id) {
      return next(new AppError('User not authenticated', 401));
    }

    // Determine user type
    const userType = user.user_type === 'admin' ? 'admin_user' : 'landing_user';

    await oauthService.unlinkGoogleAccount(user.id, userType);

    res.status(200).json({
      status: 'success',
      message: 'Google account unlinked successfully',
      data: {
        unlinked: true
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Google OAuth URL for frontend (AJAX request)
 */
export const getGoogleAuthUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userType = req.query.type === 'admin' ? 'admin' : 'landing';
    const authUrl = oauthService.getGoogleAuthUrl(userType);
    
    res.status(200).json({
      status: 'success',
      data: {
        auth_url: authUrl,
        user_type: userType
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has Google account linked
 */
export const getOAuthStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as any;
    if (!user || !user.id) {
      return next(new AppError('User not authenticated', 401));
    }

    // This would be populated by auth middleware if we extend it
    // For now, we'll query the database
    const userType = user.user_type === 'admin' ? 'admin_users' : 'landing_page_user';
    const { pool } = require('../config/database');
    
    const { rows } = await pool.query(
      `SELECT google_id, oauth_provider, oauth_picture, auth_method 
       FROM "${userType}" WHERE id = $1`,
      [user.id]
    );

    if (rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    const userData = rows[0];
    
    res.status(200).json({
      status: 'success',
      data: {
        user_id: user.id,
        email: user.email,
        has_google_linked: !!userData.google_id,
        oauth_provider: userData.oauth_provider,
        oauth_picture: userData.oauth_picture,
        auth_method: userData.auth_method,
        can_unlink_google: !!userData.google_id && userData.auth_method === 'both'
      }
    });
  } catch (error) {
    next(error);
  }
}; 