"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const jwt_utils_1 = require("../utils/jwt.utils");
const error_middleware_1 = require("../middleware/error.middleware");
const register = async (req, res, next) => {
    try {
        const { username, password, email, name, role, is_active } = req.body;
        // --- BEGIN DEBUG LOG ---
        console.log('Received request body for registration:', req.body);
        console.log('Password received:', password);
        // --- END DEBUG LOG ---
        // Check if username or email already exists
        const { rows: existingUsers } = await database_1.pool.query('SELECT id FROM "admin_users" WHERE username = $1 OR email = $2', [username, email]);
        if (existingUsers.length > 0) {
            return next(new error_middleware_1.AppError('Username or email already registered', 400));
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        // Ensure password is a string before hashing
        if (typeof password !== 'string') {
            return next(new error_middleware_1.AppError('Password must be a string and is required.', 400));
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Insert new admin user
        const { rows: [newAdminUser] } = await database_1.pool.query(`INSERT INTO "admin_users" (username, password, email, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, name, role, is_active, created_at, updated_at`, [username, hashedPassword, email, name, role, is_active !== null && is_active !== void 0 ? is_active : true]);
        // Generate token
        const token = (0, jwt_utils_1.generateToken)({
            id: newAdminUser.id,
            username: newAdminUser.username,
            role: newAdminUser.role // Ensure role is typed correctly for JWT
        });
        const userResponse = Object.assign({}, newAdminUser);
        delete userResponse.password; // Ensure password is not sent in response
        res.status(201).json({
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
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        if (!password || (!email && !username)) {
            return next(new error_middleware_1.AppError('Please provide email or username, and password', 400));
        }
        let adminUser;
        if (email) {
            const { rows } = await database_1.pool.query('SELECT * FROM "admin_users" WHERE email = $1', [email]);
            if (rows.length > 0)
                adminUser = rows[0];
        }
        else if (username) {
            const { rows } = await database_1.pool.query('SELECT * FROM "admin_users" WHERE username = $1', [username]);
            if (rows.length > 0)
                adminUser = rows[0];
        }
        if (!adminUser) {
            return next(new error_middleware_1.AppError('Invalid credentials', 401));
        }
        if (!adminUser.is_active) {
            return next(new error_middleware_1.AppError('Account is inactive. Please contact administrator.', 403));
        }
        // Verify password
        // adminUser.password will be the hashed password from the DB
        const isPasswordValid = await bcryptjs_1.default.compare(password, adminUser.password);
        if (!isPasswordValid) {
            return next(new error_middleware_1.AppError('Invalid credentials', 401));
        }
        // Update last_login timestamp
        await database_1.pool.query('UPDATE "admin_users" SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [adminUser.id]);
        // Generate token
        const token = (0, jwt_utils_1.generateToken)({
            id: adminUser.id,
            username: adminUser.username,
            role: adminUser.role
        });
        const userResponse = Object.assign({}, adminUser);
        delete userResponse.password; // Ensure password is not sent in response
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
exports.login = login;
