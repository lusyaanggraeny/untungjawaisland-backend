import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import {
  AdminUserCreateInput,
  AdminUserLoginInput,
  AdminUserRole,
  AdminUser
} from '../types/user.types';
import { generateToken } from '../utils/jwt.utils';
import { AppError } from '../middleware/error.middleware';

export const register = async (
  req: Request<{}, {}, AdminUserCreateInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, password, email, name, role, is_active } = req.body;

    // --- BEGIN DEBUG LOG ---
    console.log('Received request body for registration:', req.body);
    console.log('Password received:', password);
    // --- END DEBUG LOG ---

    // Check if username or email already exists
    const { rows: existingUsers } = await pool.query(
      'SELECT id FROM "admin_users" WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return next(new AppError('Username or email already registered', 400));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    // Ensure password is a string before hashing
    if (typeof password !== 'string') {
      return next(new AppError('Password must be a string and is required.', 400));
    }
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new admin user
    const { rows: [newAdminUser] } = await pool.query(
      `INSERT INTO "admin_users" (username, password, email, name, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, username, email, name, role, is_active, created_at, updated_at`,
      [username, hashedPassword, email, name, role, is_active ?? true]
    );

    // Generate token
    const token = generateToken({
      id: newAdminUser.id,
      username: newAdminUser.username,
      role: newAdminUser.role as AdminUserRole // Ensure role is typed correctly for JWT
    });
    
    const userResponse: Partial<AdminUser> = { ...newAdminUser };
    delete userResponse.password; // Ensure password is not sent in response

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: userResponse
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, AdminUserLoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, username, password } = req.body;

    if (!password || (!email && !username)) {
      return next(new AppError('Please provide email or username, and password', 400));
    }

    let adminUser: AdminUser | undefined;

    if (email) {
      const { rows } = await pool.query(
        'SELECT * FROM "admin_users" WHERE email = $1',
      [email]
    );
      if (rows.length > 0) adminUser = rows[0] as AdminUser;
    } else if (username) {
      const { rows } = await pool.query(
        'SELECT * FROM "admin_users" WHERE username = $1',
        [username]
      );
      if (rows.length > 0) adminUser = rows[0] as AdminUser;
    }

    if (!adminUser) {
      return next(new AppError('Invalid credentials', 401));
    }

    if (!adminUser.is_active) {
        return next(new AppError('Account is inactive. Please contact administrator.', 403));
    }

    // Verify password
    // adminUser.password will be the hashed password from the DB
    const isPasswordValid = await bcrypt.compare(password, adminUser.password!);
    if (!isPasswordValid) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Update last_login timestamp
    await pool.query(
      'UPDATE "admin_users" SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [adminUser.id]
    );

    // Generate token
    const token = generateToken({
      id: adminUser.id,
      username: adminUser.username,
      role: adminUser.role as AdminUserRole
    });

    const userResponse: Partial<AdminUser> = { ...adminUser };
    delete userResponse.password; // Ensure password is not sent in response

    res.json({
      status: 'success',
      data: {
        token,
        user: userResponse
      }
    });
  } catch (error) {
    next(error);
  }
}; 