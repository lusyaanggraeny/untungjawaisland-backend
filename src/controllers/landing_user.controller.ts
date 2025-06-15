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

interface ProfileUpdateInput {
  name?: string;
  last_name?: string;
  phone_number?: string;
  passport?: string;
  country?: string;
  address?: string;
}

interface PasswordChangeInput {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

interface NotificationPreferences {
  email_bookings: boolean;
  email_promotions: boolean;
  email_reminders: boolean;
  sms_bookings: boolean;
  sms_reminders: boolean;
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

// Update user profile information
export const updateUserProfile = async (
  req: Request<{}, {}, ProfileUpdateInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next(new AppError('Not authenticated', 401));
    }

    const {
      name,
      last_name,
      phone_number,
      passport,
      country,
      address
    } = req.body;

    // Validate required fields
    if (!name || !last_name || !phone_number) {
      return next(new AppError('Name, last name, and phone number are required', 400));
    }

    // Get current user data to check if phone number is changing
    const { rows: currentUserRows } = await pool.query(
      'SELECT phone_number FROM "landing_page_user" WHERE id = $1',
      [userId]
    );

    if (currentUserRows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    const currentUser = currentUserRows[0];

    // Only validate phone number uniqueness if it's being changed
    if (phone_number && phone_number !== currentUser.phone_number) {
      const { rows: existingPhone } = await pool.query(
        'SELECT id FROM "landing_page_user" WHERE phone_number = $1 AND id != $2',
        [phone_number, userId]
      );

      if (existingPhone.length > 0) {
        return next(new AppError('Phone number is already registered to another account', 400));
      }
    }

    // Update user profile
    const { rows: [updatedUser] } = await pool.query(
      `UPDATE "landing_page_user" 
       SET name = $1, last_name = $2, phone_number = $3, passport = $4, 
           country = $5, address = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, email, name, last_name, phone_number, type, passport, country, address, is_verified, created_at, updated_at`,
      [name, last_name, phone_number, passport, country, address, userId]
    );

    if (!updatedUser) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// Change user password
export const changePassword = async (
  req: Request<{}, {}, PasswordChangeInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next(new AppError('Not authenticated', 401));
    }

    const {
      current_password,
      new_password,
      confirm_password
    } = req.body;

    // Validate required fields
    if (!current_password || !new_password || !confirm_password) {
      return next(new AppError('Current password, new password, and confirmation are required', 400));
    }

    // Check if new passwords match
    if (new_password !== confirm_password) {
      return next(new AppError('New password and confirmation do not match', 400));
    }

    // Validate new password strength
    if (new_password.length < 6) {
      return next(new AppError('New password must be at least 6 characters long', 400));
    }

    // Get current user with password
    const { rows } = await pool.query(
      'SELECT password, auth_method FROM "landing_page_user" WHERE id = $1',
      [userId]
    );

    if (rows.length === 0) {
      return next(new AppError('User not found', 404));
    }

    const user = rows[0];

    // Check if user uses password authentication (not OAuth-only)
    if (user.auth_method === 'google') {
      return next(new AppError('Cannot change password for Google-only accounts. Please set up email authentication first.', 400));
    }

    // Verify current password
    if (user.password) {
      const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password);
      if (!isCurrentPasswordValid) {
        return next(new AppError('Current password is incorrect', 400));
      }
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(new_password, salt);

    // Update password in database
    await pool.query(
      `UPDATE "landing_page_user" 
       SET password = $1, auth_method = CASE 
         WHEN auth_method = 'google' THEN 'both'
         ELSE 'email'
       END, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedNewPassword, userId]
    );

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get user notification preferences
export const getNotificationPreferences = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next(new AppError('Not authenticated', 401));
    }

    // Try to get existing preferences
    let { rows } = await pool.query(
      'SELECT * FROM "user_notification_preferences" WHERE user_id = $1',
      [userId]
    );

    let preferences: NotificationPreferences;

    if (rows.length === 0) {
      // Create default preferences if none exist
      preferences = {
        email_bookings: true,
        email_promotions: false,
        email_reminders: true,
        sms_bookings: false,
        sms_reminders: false
      };

      await pool.query(
        `INSERT INTO "user_notification_preferences" 
         (user_id, email_bookings, email_promotions, email_reminders, sms_bookings, sms_reminders)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, preferences.email_bookings, preferences.email_promotions, 
         preferences.email_reminders, preferences.sms_bookings, preferences.sms_reminders]
      );
    } else {
      const pref = rows[0];
      preferences = {
        email_bookings: pref.email_bookings,
        email_promotions: pref.email_promotions,
        email_reminders: pref.email_reminders,
        sms_bookings: pref.sms_bookings,
        sms_reminders: pref.sms_reminders
      };
    }

    res.json({
      status: 'success',
      data: {
        preferences
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update user notification preferences
export const updateNotificationPreferences = async (
  req: Request<{}, {}, NotificationPreferences>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return next(new AppError('Not authenticated', 401));
    }

    const {
      email_bookings = true,
      email_promotions = false,
      email_reminders = true,
      sms_bookings = false,
      sms_reminders = false
    } = req.body;

    // Update or insert preferences
    await pool.query(
      `INSERT INTO "user_notification_preferences" 
       (user_id, email_bookings, email_promotions, email_reminders, sms_bookings, sms_reminders)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         email_bookings = EXCLUDED.email_bookings,
         email_promotions = EXCLUDED.email_promotions,
         email_reminders = EXCLUDED.email_reminders,
         sms_bookings = EXCLUDED.sms_bookings,
         sms_reminders = EXCLUDED.sms_reminders,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, email_bookings, email_promotions, email_reminders, sms_bookings, sms_reminders]
    );

    res.json({
      status: 'success',
      message: 'Notification preferences updated successfully',
      data: {
        preferences: {
          email_bookings,
          email_promotions,
          email_reminders,
          sms_bookings,
          sms_reminders
        }
      }
    });
  } catch (error) {
    next(error);
  }
}; 