import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import config from '@/config';
import { db } from '@/shared/database/connection';
import { AuthenticatedRequest } from '@/shared/middleware/auth';
import { APIError, ApiResponse, RegisterRequest, LoginRequest, AuthResponse, JWTPayload, User } from '@/shared/types';

// Generate JWT tokens
const generateTokens = (user: Omit<User, 'password_hash'>): { token: string; refresh_token: string } => {
  const payload: JWTPayload = {
    user_id: user.user_id,
    email: user.email,
    verification_level: 0, // Will be updated based on KYC status
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
  };

  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiry });
  const refresh_token = jwt.sign(
    { user_id: user.user_id, type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );

  return { token, refresh_token };
};

// Generate unique referral code
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password, first_name, last_name, phone, referral_code } = req.body as RegisterRequest;
  
  const pgPool = db.getPostgreSQLPool();
  const client = await pgPool.connect();

  try {
    await client.query('BEGIN');

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      const error: APIError = new Error('User already exists') as APIError;
      error.status = 409;
      throw error;
    }

    // Validate referral code if provided
    let referredBy = null;
    if (referral_code) {
      const referrer = await client.query(
        'SELECT user_id FROM users WHERE referral_code = $1',
        [referral_code]
      );
      
      if (referrer.rows.length === 0) {
        const error: APIError = new Error('Invalid referral code') as APIError;
        error.status = 400;
        throw error;
      }
      
      referredBy = referrer.rows[0].user_id;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);
    
    // Generate unique referral code for new user
    let newReferralCode: string;
    let isUnique = false;
    do {
      newReferralCode = generateReferralCode();
      const existing = await client.query(
        'SELECT user_id FROM users WHERE referral_code = $1',
        [newReferralCode]
      );
      isUnique = existing.rows.length === 0;
    } while (!isUnique);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, phone, referral_code, referred_by, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, email, phone, status, referral_code, created_at, email_verified, phone_verified`,
      [email, passwordHash, phone, newReferralCode, referredBy, 'pending']
    );

    const user = userResult.rows[0];

    // Create user profile
    await client.query(
      `INSERT INTO user_profiles (user_id, first_name, last_name, country)
       VALUES ($1, $2, $3, $4)`,
      [user.user_id, first_name, last_name, 'JAM']
    );

    // Create user verification record
    await client.query(
      `INSERT INTO user_verification (user_id, kyc_status, verification_level)
       VALUES ($1, $2, $3)`,
      [user.user_id, 'none', 0]
    );

    // Create user preferences
    await client.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)`,
      [user.user_id]
    );

    await client.query('COMMIT');

    // Generate tokens
    const { token, refresh_token } = generateTokens(user);

    // Store refresh token in Redis
    const redis = db.getRedisClient();
    await redis.setex(`refresh_token:${user.user_id}`, 7 * 24 * 60 * 60, refresh_token); // 7 days

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: {
          ...user,
          password_hash: undefined
        },
        token,
        refresh_token
      }
    };

    res.status(201).json(response);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as LoginRequest;
  
  const pgPool = db.getPostgreSQLPool();

  try {
    // Get user with password
    const userResult = await pgPool.query(
      `SELECT u.*, p.first_name, p.last_name, v.verification_level
       FROM users u
       LEFT JOIN user_profiles p ON u.user_id = p.user_id
       LEFT JOIN user_verification v ON u.user_id = v.user_id
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      const error: APIError = new Error('Invalid email or password') as APIError;
      error.status = 401;
      throw error;
    }

    const user = userResult.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      const error: APIError = new Error('Invalid email or password') as APIError;
      error.status = 401;
      throw error;
    }

    // Check if user is active
    if (user.status !== 'active' && user.status !== 'pending') {
      const error: APIError = new Error('Account is suspended or closed') as APIError;
      error.status = 403;
      throw error;
    }

    // Update last login
    await pgPool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    // Generate tokens
    const userWithoutPassword = { ...user };
    delete userWithoutPassword.password_hash;
    
    const { token, refresh_token } = generateTokens(userWithoutPassword);

    // Store refresh token in Redis
    const redis = db.getRedisClient();
    await redis.setex(`refresh_token:${user.user_id}`, 7 * 24 * 60 * 60, refresh_token);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: userWithoutPassword,
        token,
        refresh_token
      }
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    const error: APIError = new Error('Refresh token required') as APIError;
    error.status = 400;
    throw error;
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refresh_token, config.jwt.refreshSecret) as any;
    
    if (decoded.type !== 'refresh') {
      const error: APIError = new Error('Invalid token type') as APIError;
      error.status = 401;
      throw error;
    }

    // Check if refresh token exists in Redis
    const redis = db.getRedisClient();
    const storedToken = await redis.get(`refresh_token:${decoded.user_id}`);
    
    if (storedToken !== refresh_token) {
      const error: APIError = new Error('Invalid refresh token') as APIError;
      error.status = 401;
      throw error;
    }

    // Get user data
    const pgPool = db.getPostgreSQLPool();
    const userResult = await pgPool.query(
      `SELECT u.*, v.verification_level
       FROM users u
       LEFT JOIN user_verification v ON u.user_id = v.user_id
       WHERE u.user_id = $1`,
      [decoded.user_id]
    );

    if (userResult.rows.length === 0) {
      const error: APIError = new Error('User not found') as APIError;
      error.status = 404;
      throw error;
    }

    const user = userResult.rows[0];
    delete user.password_hash;

    // Generate new tokens
    const { token, refresh_token: new_refresh_token } = generateTokens(user);

    // Update refresh token in Redis
    await redis.setex(`refresh_token:${user.user_id}`, 7 * 24 * 60 * 60, new_refresh_token);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user,
        token,
        refresh_token: new_refresh_token
      }
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    
    // Remove refresh token from Redis
    const redis = db.getRedisClient();
    await redis.del(`refresh_token:${userId}`);

    const response: ApiResponse = {
      success: true,
      message: 'Logged out successfully'
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    
    const pgPool = db.getPostgreSQLPool();
    const profileResult = await pgPool.query(
      `SELECT u.user_id, u.email, u.phone, u.status, u.referral_code, u.created_at, 
              u.email_verified, u.phone_verified,
              p.first_name, p.last_name, p.date_of_birth, p.address_line1, p.address_line2,
              p.city, p.parish, p.postal_code, p.country, p.occupation,
              v.kyc_status, v.verification_level,
              pref.notification_email, pref.notification_sms, pref.notification_push,
              pref.trading_limit_daily, pref.trading_limit_monthly, pref.two_factor_enabled
       FROM users u
       LEFT JOIN user_profiles p ON u.user_id = p.user_id
       LEFT JOIN user_verification v ON u.user_id = v.user_id
       LEFT JOIN user_preferences pref ON u.user_id = pref.user_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      const error: APIError = new Error('User not found') as APIError;
      error.status = 404;
      throw error;
    }

    const response: ApiResponse = {
      success: true,
      data: profileResult.rows[0]
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const updates = req.body;
    
    if (Object.keys(updates).length === 0) {
      const error: APIError = new Error('No update data provided') as APIError;
      error.status = 400;
      throw error;
    }

    const pgPool = db.getPostgreSQLPool();
    
    // Build dynamic update query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const values = [userId, ...Object.values(updates)];
    
    const updateResult = await pgPool.query(
      `UPDATE user_profiles 
       SET ${setClause}, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      values
    );

    if (updateResult.rows.length === 0) {
      const error: APIError = new Error('Profile not found') as APIError;
      error.status = 404;
      throw error;
    }

    const response: ApiResponse = {
      success: true,
      data: updateResult.rows[0],
      message: 'Profile updated successfully'
    };

    res.json(response);
  } catch (error) {
    throw error;
  }
};