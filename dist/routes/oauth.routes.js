"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthRoutes = void 0;
const express_1 = require("express");
const oauth_controller_1 = require("../controllers/oauth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public OAuth routes - no authentication required
router.get('/google', oauth_controller_1.initiateGoogleAuth);
router.get('/google/callback', oauth_controller_1.handleGoogleCallback);
router.get('/google/url', oauth_controller_1.getGoogleAuthUrl);
// Protected OAuth routes - authentication required
router.get('/status', auth_middleware_1.authenticateToken, oauth_controller_1.getOAuthStatus);
router.post('/google/link', auth_middleware_1.authenticateToken, oauth_controller_1.linkGoogleAccount);
router.delete('/google/unlink', auth_middleware_1.authenticateToken, oauth_controller_1.unlinkGoogleAccount);
exports.oauthRoutes = router;
