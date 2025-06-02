"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.landingUserRoutes = void 0;
const express_1 = require("express");
const landing_user_controller_1 = require("../controllers/landing_user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.post('/register', landing_user_controller_1.registerUser);
router.post('/login', landing_user_controller_1.loginUser);
// Protected routes
router.get('/profile', auth_middleware_1.authenticateToken, landing_user_controller_1.getUserProfile);
exports.landingUserRoutes = router;
