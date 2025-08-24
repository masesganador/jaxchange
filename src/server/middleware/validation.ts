import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { APIError } from '../../shared/types';

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      next(new APIError(`Validation error: ${errorMessage}`, 400));
      return;
    }

    req.body = value;
    next();
  };
};

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      next(new APIError(`Query validation error: ${errorMessage}`, 400));
      return;
    }

    req.query = value;
    next();
  };
};

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      next(new APIError(`Parameter validation error: ${errorMessage}`, 400));
      return;
    }

    req.params = value;
    next();
  };
};

// Validation Schemas
export const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    referralCode: Joi.string().optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    dateOfBirth: Joi.date().iso().optional(),
    addressLine1: Joi.string().max(100).optional(),
    addressLine2: Joi.string().max(100).optional(),
    city: Joi.string().max(50).optional(),
    parish: Joi.string().max(50).optional(),
    postalCode: Joi.string().max(10).optional(),
    country: Joi.string().length(3).optional(),
    occupation: Joi.string().max(100).optional()
  }),

  updatePreferences: Joi.object({
    notificationEmail: Joi.boolean().optional(),
    notificationSms: Joi.boolean().optional(),
    notificationPush: Joi.boolean().optional(),
    tradingLimitDaily: Joi.number().min(0).max(100000).optional(),
    tradingLimitMonthly: Joi.number().min(0).max(1000000).optional(),
    twoFactorEnabled: Joi.boolean().optional(),
    preferredCurrency: Joi.string().length(3).optional()
  })
};

export const orderSchemas = {
  createOrder: Joi.object({
    orderType: Joi.string().valid('BUY', 'SELL', 'LIMIT_BUY', 'LIMIT_SELL').required(),
    cryptoSymbol: Joi.string().required(),
    fiatSymbol: Joi.string().length(3).default('USD'),
    amount: Joi.number().positive().required(),
    price: Joi.number().positive().optional(),
    paymentMethod: Joi.string().optional()
  }),

  updateOrder: Joi.object({
    status: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED').optional(),
    externalOrderId: Joi.string().optional(),
    completedAt: Joi.date().iso().optional()
  })
};

export const paymentMethodSchemas = {
  createPaymentMethod: Joi.object({
    methodType: Joi.string().valid('BANK_ACCOUNT', 'CREDIT_CARD', 'DEBIT_CARD', 'MOBILE_PAYMENT').required(),
    bankName: Joi.string().max(100).optional(),
    accountNumberLast4: Joi.string().length(4).pattern(/^\d{4}$/).optional(),
    cardLast4: Joi.string().length(4).pattern(/^\d{4}$/).optional(),
    cardBrand: Joi.string().max(20).optional(),
    isPrimary: Joi.boolean().optional()
  })
};

export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});
