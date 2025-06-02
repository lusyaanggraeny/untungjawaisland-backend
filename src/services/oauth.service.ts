import { google } from 'googleapis';
import { pool } from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { generateUserToken, generateToken } from '../utils/jwt.utils';
import { LandingUserType, AdminUserRole } from '../types/user.types';

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  verified_email?: boolean;
}

export interface OAuthResult {
  user: any;
  token: string;
  isNewUser: boolean;
  userType: 'landing_user' | 'admin_user';
}

class OAuthService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL
    );
  }

  /**
   * Generate Google OAuth URL
   */
  getGoogleAuthUrl(userType: 'landing' | 'admin' = 'landing'): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ];

    const state = Buffer.from(JSON.stringify({ 
      userType,
      timestamp: Date.now(),
      // Add random value for security
      nonce: Math.random().toString(36).substring(7)
    })).toString('base64');

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent' // Force consent screen to ensure refresh token
    });
  }

  /**
   * Exchange authorization code for tokens and user info
   */
  async handleGoogleCallback(code: string, state: string): Promise<OAuthResult> {
    try {
      // Verify and decode state
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      const { userType } = stateData;

      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get user profile from Google
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();
      
      const googleProfile: GoogleUserProfile = {
        id: data.id!,
        email: data.email!,
        name: data.name!,
        picture: data.picture,
        given_name: data.given_name,
        family_name: data.family_name,
        verified_email: data.verified_email
      };

      // Determine user type and handle accordingly
      if (userType === 'admin') {
        return await this.handleAdminOAuth(googleProfile, tokens);
      } else {
        return await this.handleLandingUserOAuth(googleProfile, tokens);
      }
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      throw new AppError('Failed to process Google authentication', 500);
    }
  }

  /**
   * Handle OAuth for landing page users
   */
  private async handleLandingUserOAuth(googleProfile: GoogleUserProfile, tokens: any): Promise<OAuthResult> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if user exists by Google ID
      let { rows: existingByGoogleId } = await client.query(
        'SELECT * FROM "landing_page_user" WHERE google_id = $1',
        [googleProfile.id]
      );

      if (existingByGoogleId.length > 0) {
        // User exists with Google ID - sign them in
        const user = existingByGoogleId[0];
        await this.updateOAuthSession(client, user.id, 'landing_user', googleProfile, tokens);
        
        const token = generateUserToken({
          id: user.id,
          email: user.email,
          type: user.type
        });

        await client.query('COMMIT');
        return { user: this.sanitizeUser(user), token, isNewUser: false, userType: 'landing_user' };
      }

      // Check if user exists by email
      let { rows: existingByEmail } = await client.query(
        'SELECT * FROM "landing_page_user" WHERE email = $1',
        [googleProfile.email]
      );

      if (existingByEmail.length > 0) {
        // Link Google account to existing email account
        const user = existingByEmail[0];
        
        await client.query(
          `UPDATE "landing_page_user" 
           SET google_id = $1, oauth_provider = $2, oauth_picture = $3, 
               auth_method = 'both', updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [googleProfile.id, 'google', googleProfile.picture, user.id]
        );

        await this.updateOAuthSession(client, user.id, 'landing_user', googleProfile, tokens);

        const token = generateUserToken({
          id: user.id,
          email: user.email,
          type: user.type
        });

        await client.query('COMMIT');
        return { user: this.sanitizeUser(user), token, isNewUser: false, userType: 'landing_user' };
      }

      // Create new user
      const { rows: [newUser] } = await client.query(
        `INSERT INTO "landing_page_user" (
          email, name, last_name, phone_number, type, google_id, 
          oauth_provider, oauth_picture, auth_method, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          googleProfile.email,
          googleProfile.given_name || googleProfile.name.split(' ')[0] || 'User',
          googleProfile.family_name || googleProfile.name.split(' ').slice(1).join(' ') || '',
          '', // Phone number can be added later
          LandingUserType.USER,
          googleProfile.id,
          'google',
          googleProfile.picture,
          'google',
          true // Google emails are verified
        ]
      );

      await this.updateOAuthSession(client, newUser.id, 'landing_user', googleProfile, tokens);

      const token = generateUserToken({
        id: newUser.id,
        email: newUser.email,
        type: newUser.type
      });

      await client.query('COMMIT');
      return { user: this.sanitizeUser(newUser), token, isNewUser: true, userType: 'landing_user' };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle OAuth for admin users
   */
  private async handleAdminOAuth(googleProfile: GoogleUserProfile, tokens: any): Promise<OAuthResult> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if admin exists by Google ID
      let { rows: existingByGoogleId } = await client.query(
        'SELECT * FROM "admin_users" WHERE google_id = $1',
        [googleProfile.id]
      );

      if (existingByGoogleId.length > 0) {
        const admin = existingByGoogleId[0];
        
        if (!admin.is_active) {
          throw new AppError('Admin account is inactive', 403);
        }

        await this.updateOAuthSession(client, admin.id, 'admin_user', googleProfile, tokens);
        
        const token = generateToken({
          id: admin.id,
          username: admin.username,
          role: admin.role
        });

        await client.query('COMMIT');
        return { user: this.sanitizeUser(admin), token, isNewUser: false, userType: 'admin_user' };
      }

      // Check if admin exists by email
      let { rows: existingByEmail } = await client.query(
        'SELECT * FROM "admin_users" WHERE email = $1',
        [googleProfile.email]
      );

      if (existingByEmail.length > 0) {
        const admin = existingByEmail[0];
        
        if (!admin.is_active) {
          throw new AppError('Admin account is inactive', 403);
        }

        // Link Google account to existing admin account
        await client.query(
          `UPDATE "admin_users" 
           SET google_id = $1, oauth_provider = $2, oauth_picture = $3, 
               auth_method = 'both', updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [googleProfile.id, 'google', googleProfile.picture, admin.id]
        );

        await this.updateOAuthSession(client, admin.id, 'admin_user', googleProfile, tokens);

        const token = generateToken({
          id: admin.id,
          username: admin.username,
          role: admin.role
        });

        await client.query('COMMIT');
        return { user: this.sanitizeUser(admin), token, isNewUser: false, userType: 'admin_user' };
      }

      // For new admin users, you might want to restrict this or require manual approval
      throw new AppError('Admin account not found. Please contact system administrator.', 404);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update OAuth session data
   */
  private async updateOAuthSession(client: any, userId: number, userType: string, googleProfile: GoogleUserProfile, tokens: any) {
    const expiresAt = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    await client.query(
      `INSERT INTO "oauth_sessions" (
        user_id, user_type, provider, provider_id, access_token, 
        refresh_token, token_expires_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (provider, provider_id) 
      DO UPDATE SET 
        access_token = $5, refresh_token = $6, token_expires_at = $7, updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        userType,
        'google',
        googleProfile.id,
        tokens.access_token,
        tokens.refresh_token,
        expiresAt
      ]
    );
  }

  /**
   * Link Google account to existing user (for authenticated users)
   */
  async linkGoogleAccount(userId: number, userType: 'landing_user' | 'admin_user', code: string, state: string) {
    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get user profile from Google
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();
      
      const googleProfile: GoogleUserProfile = {
        id: data.id!,
        email: data.email!,
        name: data.name!,
        picture: data.picture,
        given_name: data.given_name,
        family_name: data.family_name,
        verified_email: data.verified_email
      };

      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');

        const table = userType === 'landing_user' ? 'landing_page_user' : 'admin_users';
        
        // Update user with Google info
        await client.query(
          `UPDATE "${table}" 
           SET google_id = $1, oauth_provider = $2, oauth_picture = $3, 
               auth_method = 'both', updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [googleProfile.id, 'google', googleProfile.picture, userId]
        );

        await this.updateOAuthSession(client, userId, userType, googleProfile, tokens);
        
        await client.query('COMMIT');
        return { success: true, googleProfile };

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Link Google account error:', error);
      throw new AppError('Failed to link Google account', 500);
    }
  }

  /**
   * Unlink Google account
   */
  async unlinkGoogleAccount(userId: number, userType: 'landing_user' | 'admin_user') {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const table = userType === 'landing_user' ? 'landing_page_user' : 'admin_users';
      
      // Check if user has password (can't unlink if it's their only auth method)
      const { rows } = await client.query(
        `SELECT password FROM "${table}" WHERE id = $1`,
        [userId]
      );

      if (rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      if (!rows[0].password) {
        throw new AppError('Cannot unlink Google account. Please set a password first.', 400);
      }

      // Remove Google association
      await client.query(
        `UPDATE "${table}" 
         SET google_id = NULL, oauth_provider = NULL, oauth_picture = NULL, 
             auth_method = 'email', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [userId]
      );

      // Remove OAuth session
      await client.query(
        'DELETE FROM "oauth_sessions" WHERE user_id = $1 AND user_type = $2 AND provider = $3',
        [userId, userType, 'google']
      );

      await client.query('COMMIT');
      return { success: true };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove sensitive data from user object
   */
  private sanitizeUser(user: any) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

export const oauthService = new OAuthService(); 