"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticateToken = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const error_middleware_1 = require("./error.middleware");
const authenticateToken = (req, res, next) => {
    console.log('🔐 [AUTH DEBUG] Auth middleware triggered for:', req.method, req.path);
    console.log('🔐 [AUTH DEBUG] Authorization header:', req.headers.authorization ? 'Present' : 'Missing');
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('🔐 [AUTH DEBUG] Extracted token:', token ? `${token.substring(0, 20)}...` : 'None');
    if (!token) {
        console.log('❌ [AUTH DEBUG] No token provided');
        return next(new error_middleware_1.AppError('No token provided', 401));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        console.log('✅ [AUTH DEBUG] JWT verification successful');
        console.log('🔐 [AUTH DEBUG] Token payload:', {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            type: decoded.type,
            user_type: decoded.user_type,
            exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'No expiration'
        });
        req.user = decoded;
        console.log('✅ [AUTH DEBUG] User attached to request:', decoded.id);
        next();
    }
    catch (error) {
        console.log('❌ [AUTH DEBUG] JWT verification failed:', error.message);
        console.log('❌ [AUTH DEBUG] JWT error details:', error);
        return next(new error_middleware_1.AppError('Invalid token', 401));
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuthenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        // No token provided, continue without user info
        req.user = undefined;
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
        req.user = decoded;
        next();
    }
    catch (error) {
        // Invalid token, continue without user info
        req.user = undefined;
        next();
    }
};
exports.optionalAuthenticateToken = optionalAuthenticateToken;
