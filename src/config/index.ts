import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const config = {
  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiVersion: process.env.API_VERSION || 'v1',
  },

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://jaxchange_user:secure_password@localhost:5432/jaxchange',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    name: process.env.DATABASE_NAME || 'jaxchange',
    user: process.env.DATABASE_USER || 'jaxchange_user',
    password: process.env.DATABASE_PASSWORD || 'secure_password',
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_jwt_key_here',
    expiry: process.env.JWT_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Exchange Configuration
  exchanges: {
    binance: {
      apiKey: process.env.BINANCE_API_KEY || '',
      secretKey: process.env.BINANCE_SECRET_KEY || '',
      testnet: process.env.BINANCE_TESTNET === 'true',
    },
    kraken: {
      apiKey: process.env.KRAKEN_API_KEY || '',
      secretKey: process.env.KRAKEN_SECRET_KEY || '',
      testnet: process.env.KRAKEN_TESTNET === 'true',
    },
  },

  // Payment Processing
  payments: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publicKey: process.env.STRIPE_PUBLIC_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
  },

  // Communication Services
  communication: {
    email: {
      from: process.env.EMAIL_FROM || 'noreply@jaxchange.com',
      sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    },
    sms: {
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
      twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
  },

  // KYC Verification
  kyc: {
    jumio: {
      apiKey: process.env.JUMIO_API_KEY || '',
      secret: process.env.JUMIO_SECRET || '',
      datacenter: process.env.JUMIO_DATACENTER || 'us',
    },
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // Monitoring
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    sentryDsn: process.env.SENTRY_DSN || '',
  },

  // Feature Flags
  features: {
    enableSignup: process.env.ENABLE_SIGNUP === 'true',
    enableKyc: process.env.ENABLE_KYC === 'true',
    enableTrading: process.env.ENABLE_TRADING === 'true',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
  },

  // Platform Settings
  platform: {
    feePercentage: parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '1.0'),
    minTransactionAmount: parseFloat(process.env.MIN_TRANSACTION_AMOUNT || '10'),
    maxTransactionAmount: parseFloat(process.env.MAX_TRANSACTION_AMOUNT || '25000'),
    supportedCryptocurrencies: (process.env.SUPPORTED_CRYPTOCURRENCIES || 'BTC,ETH,XRP,LTC').split(','),
  },
};

export default config;