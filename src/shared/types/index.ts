// User Types
export interface User {
  user_id: string;
  email: string;
  phone?: string;
  password_hash: string;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  referral_code?: string;
  referred_by?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  email_verified: boolean;
  phone_verified: boolean;
}

export interface UserProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: Date;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  parish?: string; // Jamaica-specific
  postal_code?: string;
  country: string;
  occupation?: string;
}

export interface UserVerification {
  user_id: string;
  kyc_status: 'none' | 'pending' | 'in_review' | 'approved' | 'rejected';
  verification_level: 0 | 1 | 2 | 3;
  documents_uploaded_at?: Date;
  documents_verified_at?: Date;
  verification_notes?: string;
}

// Order and Transaction Types
export interface Order {
  order_id: string;
  user_id: string;
  order_type: 'buy' | 'sell' | 'limit_buy' | 'limit_sell';
  crypto_symbol: string;
  fiat_symbol: string;
  amount: number;
  price?: number;
  total_amount: number;
  platform_fee: number;
  payment_method_fee: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired';
  exchange_id?: string;
  external_order_id?: string;
  payment_method?: string;
  created_at: Date;
  expires_at?: Date;
  completed_at?: Date;
}

export interface Transaction {
  txn_id: string;
  order_id: string;
  txn_type: 'deposit' | 'withdrawal' | 'exchange' | 'fee' | 'refund';
  crypto_symbol?: string;
  fiat_symbol?: string;
  amount: number;
  fee: number;
  exchange_id?: string;
  external_txn_id?: string;
  blockchain_hash?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Balance Types
export interface UserBalance {
  user_id: string;
  crypto_symbol: string;
  available_balance: number;
  reserved_balance: number;
  total_balance: number;
}

// Exchange Types
export interface Exchange {
  exchange_id: string;
  name: string;
  api_endpoint: string;
  status: 'active' | 'inactive' | 'maintenance';
  supported_pairs: string[];
  trading_fees: number;
  priority: number;
}

export interface MarketPrice {
  price_id: string;
  symbol: string;
  base_symbol: string;
  exchange_id: string;
  bid_price: number;
  ask_price: number;
  last_price?: number;
  volume_24h?: number;
  change_24h?: number;
  timestamp: Date;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  referral_code?: string;
}

export interface BuyOrderRequest {
  crypto_symbol: string;
  fiat_amount: number;
  payment_method: string;
}

export interface SellOrderRequest {
  crypto_symbol: string;
  crypto_amount: number;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
  refresh_token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Error Types
export interface APIError extends Error {
  status: number;
  code?: string;
}

// JWT Payload
export interface JWTPayload {
  user_id: string;
  email: string;
  verification_level: number;
  iat: number;
  exp: number;
}

// Configuration Types
export interface ExchangeConfig {
  apiKey: string;
  secretKey: string;
  testnet: boolean;
}

// Fee Calculation Types
export interface FeeCalculation {
  platform_fee: number;
  payment_method_fee: number;
  total_fee: number;
  net_amount: number;
}

// Price Quote Types
export interface PriceQuote {
  crypto_symbol: string;
  fiat_symbol: string;
  price: number;
  amount: number;
  total: number;
  fees: FeeCalculation;
  expires_at: Date;
  exchange: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}