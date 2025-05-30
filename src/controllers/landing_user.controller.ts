import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { LandingPageUser, LandingUserType, LandingUserJwtPayload } from '../types/user.types';
import { generateUserToken } from '../utils/jwt.utils';

interface LandingUserRegisterInput {
  email: string;
  password: string;
  name: string;
  last_name: string;
  phone_number: string;
  type?: LandingUserType;
  passport?: string;
  country?: string;
  address?: string;
}

interface LandingUserLoginInput {
  email: string;
  password: string;
}

export const registerUser = async (
  req: Request<{}, {}, LandingUserRegisterInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      email,
      password,
      name,
      last_name,
      phone_number,
      type = LandingUserType.USER,
      passport,
      country,
      address
    } = req.body;

    // Validate required fields
    if (!email || !password || !name || !last_name || !phone_number) {
      return next(new AppError('Email, password, name, last name, and phone number are required', 400));
    }

    // Check if email already exists
    const { rows: existingUsers } = await pool.query(
      'SELECT id FROM "landing_page_user" WHERE email = $1',
      [email]
    );

    if (existingUsers.length > 0) {
      return next(new AppError('Email already registered', 400));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const { rows: [newUser] } = await pool.query(
      `INSERT INTO "landing_page_user" (
        email, password, name, last_name, phone_number, type, passport, country, address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, name, last_name, phone_number, type, country, address, is_verified, created_at, updated_at`,
      [email, hashedPassword, name, last_name, phone_number, type, passport, country, address]
    );

    // Generate token
    const token = generateUserToken({
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
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request<{}, {}, LandingUserLoginInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    // Get user by email
    const { rows } = await pool.query(
      'SELECT * FROM "landing_page_user" WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      return next(new AppError('Invalid credentials', 401));
    }

    const user = rows[0] as LandingPageUser & { password: string };

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Generate token
    const token = generateUserToken({
      id: user.id,
      email: user.email,
      type: user.type
    });

    // Create user response without password
    const { password: _, ...userResponse } = user;

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

export const getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next(new AppError('Not authenticated', 401));
    }

    const { rows } = await pool.query(
      'SELECT id, email, name, last_name, phone_number, type, passport, country, address, is_verified, created_at, updated_at FROM "landing_page_user" WHERE id = $1',
      [userId]
    );

    if (rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      status: 'success',
      data: {
        user: rows[0]
      }
    });
  } catch (error) {
    next(error);
  }
}; 