"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOAuthStatus = exports.getGoogleAuthUrl = exports.unlinkGoogleAccount = exports.linkGoogleAccount = exports.handleGoogleCallback = exports.initiateGoogleAuth = void 0;
const oauth_service_1 = require("../services/oauth.service");
const error_middleware_1 = require("../middleware/error.middleware");
/**
 * Initiate Google OAuth for landing page users
 */
const initiateGoogleAuth = async (req, res, next) => {
    try {
        const userType = req.query.type === 'admin' ? 'admin' : 'landing';
        const authUrl = oauth_service_1.oauthService.getGoogleAuthUrl(userType);
        // Redirect to Google OAuth
        res.redirect(authUrl);
    }
    catch (error) {
        next(error);
    }
};
exports.initiateGoogleAuth = initiateGoogleAuth;
/**
 * Handle Google OAuth callback
 */
const handleGoogleCallback = async (req, res, next) => {
    try {
        const { code, state, error: oauthError } = req.query;
        // Handle OAuth errors
        if (oauthError) {
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            return res.redirect(`${frontendUrl}/login?error=oauth_cancelled`);
        }
        if (!code || !state) {
            return next(new error_middleware_1.AppError('Missing authorization code or state', 400));
        }
        // Process the OAuth callback
        const result = await oauth_service_1.oauthService.handleGoogleCallback(code, state);
        // Determine redirect URL based on user type
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        let redirectUrl = frontendUrl;
        if (result.userType === 'admin_user') {
            redirectUrl = `${frontendUrl}/admin/dashboard`;
        }
        else {
            redirectUrl = `${frontendUrl}/dashboard`;
        }
        // Add success parameters
        const params = new URLSearchParams({
            token: result.token,
            user_type: result.userType,
            is_new: result.isNewUser.toString()
        });
        res.redirect(`${redirectUrl}?${params.toString()}`);
    }
    catch (error) {
        console.error('OAuth callback error:', error);
        // Redirect to frontend with error
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const errorType = error instanceof error_middleware_1.AppError ? 'oauth_error' : 'oauth_failed';
        res.redirect(`${frontendUrl}/login?error=${errorType}`);
    }
};
exports.handleGoogleCallback = handleGoogleCallback;
/**
 * Link Google account to existing authenticated user
 */
const linkGoogleAccount = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            return next(new error_middleware_1.AppError('User not authenticated', 401));
        }
        const { code, state } = req.body;
        if (!code || !state) {
            return next(new error_middleware_1.AppError('Missing authorization code or state', 400));
        }
        // Determine user type
        const userType = user.user_type === 'admin' ? 'admin_user' : 'landing_user';
        const result = await oauth_service_1.oauthService.linkGoogleAccount(user.id, userType, code, state);
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
    }
    catch (error) {
        next(error);
    }
};
exports.linkGoogleAccount = linkGoogleAccount;
/**
 * Unlink Google account from authenticated user
 */
const unlinkGoogleAccount = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            return next(new error_middleware_1.AppError('User not authenticated', 401));
        }
        // Determine user type
        const userType = user.user_type === 'admin' ? 'admin_user' : 'landing_user';
        await oauth_service_1.oauthService.unlinkGoogleAccount(user.id, userType);
        res.status(200).json({
            status: 'success',
            message: 'Google account unlinked successfully',
            data: {
                unlinked: true
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.unlinkGoogleAccount = unlinkGoogleAccount;
/**
 * Get Google OAuth URL for frontend (AJAX request)
 */
const getGoogleAuthUrl = async (req, res, next) => {
    try {
        const userType = req.query.type === 'admin' ? 'admin' : 'landing';
        const authUrl = oauth_service_1.oauthService.getGoogleAuthUrl(userType);
        res.status(200).json({
            status: 'success',
            data: {
                auth_url: authUrl,
                user_type: userType
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getGoogleAuthUrl = getGoogleAuthUrl;
/**
 * Check if user has Google account linked
 */
const getOAuthStatus = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user || !user.id) {
            return next(new error_middleware_1.AppError('User not authenticated', 401));
        }
        // This would be populated by auth middleware if we extend it
        // For now, we'll query the database
        const userType = user.user_type === 'admin' ? 'admin_users' : 'landing_page_user';
        const { pool } = require('../config/database');
        const { rows } = await pool.query(`SELECT google_id, oauth_provider, oauth_picture, auth_method 
       FROM "${userType}" WHERE id = $1`, [user.id]);
        if (rows.length === 0) {
            return next(new error_middleware_1.AppError('User not found', 404));
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
    }
    catch (error) {
        next(error);
    }
};
exports.getOAuthStatus = getOAuthStatus;
