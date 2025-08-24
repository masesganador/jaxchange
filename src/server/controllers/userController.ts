import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import DatabaseService from '../services/database';
import { generateTokens } from '../middleware/auth';
import { AuthenticatedRequest } from '../middleware/auth';
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse, 
  UpdateProfileRequest, 
  UpdatePreferencesRequest,
  ApiResponse 
} from '../../shared/types';

const prisma = DatabaseService.getInstance().getClient();

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, phone, password, firstName, lastName, referralCode }: RegisterRequest = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email or phone already exists',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate referral code if not provided
    const userReferralCode = referralCode || `REF${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        phone: phone || null,
        passwordHash,
        referralCode: userReferralCode,
        profile: {
          create: {
            firstName,
            lastName
          }
        },
        verification: {
          create: {
            kycStatus: 'NONE',
            verificationLevel: 0
          }
        },
        preferences: {
          create: {
            notificationEmail: true,
            notificationSms: true,
            notificationPush: true,
            tradingLimitDaily: 500.00,
            tradingLimitMonthly: 2000.00,
            twoFactorEnabled: false,
            preferredCurrency: 'USD'
          }
        }
      },
      include: {
        profile: true,
        verification: true,
        preferences: true
      }
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      status: user.status
    });

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          status: user.status,
          referralCode: user.referralCode,
          referredBy: user.referredBy,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          profile: user.profile || undefined,
          verification: user.verification || undefined,
          preferences: user.preferences || undefined
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      },
      message: 'User registered successfully',
      timestamp: new Date().toISOString()
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        verification: true,
        preferences: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid email or password',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: 'Account is not active',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      status: user.status
    });

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          status: user.status,
          referralCode: user.referralCode,
          referredBy: user.referredBy,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLogin: user.lastLogin,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          profile: user.profile || undefined,
          verification: user.verification || undefined,
          preferences: user.preferences || undefined
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn
      },
      message: 'Login successful',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        verification: true,
        preferences: true,
        balances: true,
        paymentMethods: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        status: user.status,
        referralCode: user.referralCode,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLogin: user.lastLogin,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        profile: user.profile,
        verification: user.verification,
        preferences: user.preferences,
        balances: user.balances,
        paymentMethods: user.paymentMethods
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const updateData: UpdateProfileRequest = req.body;

    const updatedProfile = await prisma.userProfile.update({
      where: { userId },
      data: updateData
    });

    const response: ApiResponse = {
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const updateData: UpdatePreferencesRequest = req.body;

    const updatedPreferences = await prisma.userPreferences.update({
      where: { userId },
      data: updateData
    });

    const response: ApiResponse = {
      success: true,
      data: updatedPreferences,
      message: 'Preferences updated successfully',
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
