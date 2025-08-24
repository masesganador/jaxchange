import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { APIError } from '../types';

export const validateRequest = (schema: {
  body?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    // Validate body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate params
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    // Validate query
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
      }
    }

    if (errors.length > 0) {
      const error = new APIError(errors.join('; '), 400);
      (error as any).code = 'VALIDATION_ERROR';
      return next(error);
    }

    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  uuid: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(
    new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]')
  ).required().messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  }),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  cryptoSymbol: Joi.string().valid('BTC', 'ETH', 'XRP', 'LTC').required(),
  fiatSymbol: Joi.string().valid('USD', 'JMD').default('USD'),
  amount: Joi.number().positive().precision(8).required(),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort_by: Joi.string().optional(),
    sort_order: Joi.string().valid('asc', 'desc').default('desc'),
  },
};

// User validation schemas
export const userSchemas = {
  register: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    first_name: Joi.string().min(1).max(100).required(),
    last_name: Joi.string().min(1).max(100).required(),
    phone: commonSchemas.phone,
    referral_code: Joi.string().alphanum().length(8).optional(),
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    first_name: Joi.string().min(1).max(100).optional(),
    last_name: Joi.string().min(1).max(100).optional(),
    date_of_birth: Joi.date().max('now').optional(),
    address_line1: Joi.string().max(255).optional(),
    address_line2: Joi.string().max(255).optional(),
    city: Joi.string().max(100).optional(),
    parish: Joi.string().max(100).optional(),
    postal_code: Joi.string().max(20).optional(),
    occupation: Joi.string().max(100).optional(),
  }),
};

// Trading validation schemas
export const tradingSchemas = {
  buyOrder: Joi.object({
    crypto_symbol: commonSchemas.cryptoSymbol,
    fiat_amount: Joi.number().positive().min(10).max(25000).required(),
    payment_method: Joi.string().valid('bank_account', 'credit_card', 'debit_card').required(),
  }),

  sellOrder: Joi.object({
    crypto_symbol: commonSchemas.cryptoSymbol,
    crypto_amount: commonSchemas.amount,
  }),

  getPrice: Joi.object({
    crypto_symbol: commonSchemas.cryptoSymbol,
    fiat_symbol: commonSchemas.fiatSymbol,
    amount: commonSchemas.amount,
    side: Joi.string().valid('buy', 'sell').required(),
  }),
};