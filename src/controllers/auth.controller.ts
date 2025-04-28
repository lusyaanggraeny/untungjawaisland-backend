import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { UserCreateInput, UserLoginInput, UserRole } from '../types/user.types';
import { generateToken } from '../utils/jwt.utils';
import { AppError } from '../middleware/error.middleware';

export const register = async (
  req: Request<{}, {}, UserCreateInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, role = UserRole.TOURIST } = req.body;

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (Array.isArray(existingUsers) && existingUsers.length > 0) {
      return next(new AppError('Email already registered', 400));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const [result] = await pool.query(
      'INSERT INTO users (id, name, email, password, role) VALUES (UUID(), ?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    );

    // Generate token
    const token = generateToken({
      id: (result as any).insertId,
      role
    });

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: {
          name,
          email,
          role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request<{}, {}, UserLoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Find user
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!Array.isArray(users) || users.length === 0) {
      return next(new AppError('Invalid email or password', 401));
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid email or password', 401));
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      role: user.role
    });

    res.json({
      status: 'success',
      data: {
        token,
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
}; 