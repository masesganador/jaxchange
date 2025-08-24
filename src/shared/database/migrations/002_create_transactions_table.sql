-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('buy', 'sell', 'limit_buy', 'limit_sell')),
    crypto_symbol VARCHAR(10) NOT NULL,
    fiat_symbol VARCHAR(3) DEFAULT 'USD',
    amount DECIMAL(20,8) NOT NULL CHECK (amount > 0),
    price DECIMAL(15,2),
    total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount > 0),
    platform_fee DECIMAL(15,2) DEFAULT 0,
    payment_method_fee DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'expired')),
    exchange_id VARCHAR(50),
    external_order_id VARCHAR(255),
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Transactions table (for tracking individual transaction steps)
CREATE TABLE IF NOT EXISTS transactions (
    txn_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    txn_type VARCHAR(50) NOT NULL CHECK (txn_type IN ('deposit', 'withdrawal', 'exchange', 'fee', 'refund')),
    crypto_symbol VARCHAR(10),
    fiat_symbol VARCHAR(3),
    amount DECIMAL(20,8) NOT NULL,
    fee DECIMAL(15,2) DEFAULT 0,
    exchange_id VARCHAR(50),
    external_txn_id VARCHAR(255),
    blockchain_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- User balances table
CREATE TABLE IF NOT EXISTS user_balances (
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    crypto_symbol VARCHAR(10) NOT NULL,
    available_balance DECIMAL(20,8) DEFAULT 0 CHECK (available_balance >= 0),
    reserved_balance DECIMAL(20,8) DEFAULT 0 CHECK (reserved_balance >= 0),
    total_balance DECIMAL(20,8) GENERATED ALWAYS AS (available_balance + reserved_balance) STORED,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, crypto_symbol)
);

-- Transaction history (for user-facing transaction display)
CREATE TABLE IF NOT EXISTS transaction_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(order_id),
    txn_type VARCHAR(50) NOT NULL CHECK (txn_type IN ('buy', 'sell', 'deposit', 'withdrawal', 'fee', 'refund', 'referral_bonus')),
    crypto_symbol VARCHAR(10),
    fiat_symbol VARCHAR(3),
    crypto_amount DECIMAL(20,8),
    fiat_amount DECIMAL(15,2),
    fee_amount DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(50) NOT NULL CHECK (status IN ('completed', 'failed', 'pending')),
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods table
CREATE TABLE IF NOT EXISTS payment_methods (
    payment_method_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL CHECK (method_type IN ('bank_account', 'credit_card', 'debit_card', 'mobile_payment')),
    bank_name VARCHAR(100),
    account_number_last4 VARCHAR(4),
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_crypto_symbol ON orders(crypto_symbol);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_crypto_symbol ON transactions(crypto_symbol);

CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_balances_crypto_symbol ON user_balances(crypto_symbol);

CREATE INDEX IF NOT EXISTS idx_transaction_history_user_id ON transaction_history(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_history_timestamp ON transaction_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_transaction_history_status ON transaction_history(status);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_primary ON payment_methods(user_id, is_primary) WHERE is_primary = TRUE;

-- Update triggers for updated_at columns
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_balances_updated_at BEFORE UPDATE ON user_balances FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();