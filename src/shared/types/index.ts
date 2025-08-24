import { User, UserProfile, UserVerification, UserPreferences, Order, Transaction, UserBalance, PaymentMethod, TransactionHistory, Exchange, MarketPrice, ExchangeBalance, ExchangeCredentials, SupportedCryptocurrency } from '@prisma/client';

// Re-export Prisma types
export type {
  User,
  UserProfile,
  UserVerification,
  UserPreferences,
  Order,
  Transaction,
  UserBalance,
  PaymentMethod,
  TransactionHistory,
  Exchange,
  MarketPrice,
  ExchangeBalance,
  ExchangeCredentials,
  SupportedCryptocurrency
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request Types
export interface RegisterRequest {
  email: string;
  phone?: string;
  password: string;
  firstName: string;
  lastName: string;
  referralCode?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'passwordHash'> & {
    profile?: UserProfile;
    verification?: UserVerification;
    preferences?: UserPreferences;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  status: string;
  iat?: number;
  exp?: number;
}

// Error Types
export class APIError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Order Types
export interface CreateOrderRequest {
  orderType: 'BUY' | 'SELL' | 'LIMIT_BUY' | 'LIMIT_SELL';
  cryptoSymbol: string;
  fiatSymbol?: string;
  amount: number;
  price?: number;
  paymentMethod?: string;
}

export interface UpdateOrderRequest {
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  externalOrderId?: string;
  completedAt?: Date;
}

// User Types
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  parish?: string;
  postalCode?: string;
  country?: string;
  occupation?: string;
}

export interface UpdatePreferencesRequest {
  notificationEmail?: boolean;
  notificationSms?: boolean;
  notificationPush?: boolean;
  tradingLimitDaily?: number;
  tradingLimitMonthly?: number;
  twoFactorEnabled?: boolean;
  preferredCurrency?: string;
}

// Payment Method Types
export interface CreatePaymentMethodRequest {
  methodType: 'BANK_ACCOUNT' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'MOBILE_PAYMENT';
  bankName?: string;
  accountNumberLast4?: string;
  cardLast4?: string;
  cardBrand?: string;
  isPrimary?: boolean;
}

// Market Data Types
export interface MarketPriceResponse {
  symbol: string;
  baseSymbol: string;
  exchangeId: string;
  bidPrice: number;
  askPrice: number;
  lastPrice?: number;
  volume24h?: number;
  change24h?: number;
  timestamp: Date;
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    responseTime?: number;
  };
  services: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
    };
  };
}