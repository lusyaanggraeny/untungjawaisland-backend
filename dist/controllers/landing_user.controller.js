"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const error_middleware_1 = require("../middleware/error.middleware");
const user_types_1 = require("../types/user.types");
const jwt_utils_1 = require("../utils/jwt.utils");
const registerUser = async (req, res, next) => {
    try {
        const { email, password, name, last_name, phone_number, type = user_types_1.LandingUserType.USER, passport, country, address } = req.body;
        // Validate required fields
        if (!email || !password || !name || !last_name || !phone_number) {
            return next(new error_middleware_1.AppError('Email, password, name, last name, and phone number are required', 400));
        }
        // Check if email already exists
        const { rows: existingUsers } = await database_1.pool.query('SELECT id FROM "landing_page_user" WHERE email = $1', [email]);
        if (existingUsers.length > 0) {
            return next(new error_middleware_1.AppError('Email already registered', 400));
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Insert new user
        const { rows: [newUser] } = await database_1.pool.query(`INSERT INTO "landing_page_user" (
        email, password, name, last_name, phone_number, type, passport, country, address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, name, last_name, phone_number, type, country, address, is_verified, created_at, updated_at`, [email, hashedPassword, name, last_name, phone_number, type, passport, country, address]);
        // Generate token
        const token = (0, jwt_utils_1.generateUserToken)({
            id: newUser.id,
            email: newUser.email,
            type: newUser.type
        });
        res.status(201).json({
            status: 'success',
            data: {
                token,
                user: newUser
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(new error_middleware_1.AppError('Please provide email and password', 400));
        }
        // Get user by email
        const { rows } = await database_1.pool.query('SELECT * FROM "landing_page_user" WHERE email = $1', [email]);
        if (rows.length === 0) {
            return next(new error_middleware_1.AppError('Invalid credentials', 401));
        }
        const user = rows[0];
        // Verify password
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return next(new error_middleware_1.AppError('Invalid credentials', 401));
        }
        // Generate token
        const token = (0, jwt_utils_1.generateUserToken)({
            id: user.id,
            email: user.email,
            type: user.type
        });
        // Create user response without password
        const { password: _ } = user, userResponse = __rest(user, ["password"]);
        res.json({
            status: 'success',
            data: {
                token,
                user: userResponse
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.loginUser = loginUser;
const getUserProfile = async (req, res, next) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId) {
            return next(new error_middleware_1.AppError('Not authenticated', 401));
        }
        const { rows } = await database_1.pool.query('SELECT id, email, name, last_name, phone_number, type, passport, country, address, is_verified, created_at, updated_at FROM "landing_page_user" WHERE id = $1', [userId]);
        if (rows.length === 0) {
            return next(new error_middleware_1.AppError('User not found', 404));
        }
        res.json({
            status: 'success',
            data: {
                user: rows[0]
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserProfile = getUserProfile;
