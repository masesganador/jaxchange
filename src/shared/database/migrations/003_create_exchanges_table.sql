-- Exchanges table
CREATE TABLE IF NOT EXISTS exchanges (
    exchange_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    api_endpoint VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    supported_pairs TEXT[], -- Array of trading pairs like ['BTC-USD', 'ETH-USD']
    trading_fees DECIMAL(5,4) DEFAULT 0.001, -- Default trading fee percentage
    withdrawal_fees JSONB, -- JSON object with withdrawal fees per asset
    min_trade_amounts JSONB, -- JSON object with minimum trade amounts per pair
    max_trade_amounts JSONB, -- JSON object with maximum trade amounts per pair
    priority INTEGER DEFAULT 1, -- Priority for order routing (1 = highest)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Market prices table (for caching real-time prices)
CREATE TABLE IF NOT EXISTS market_prices (
    price_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(10) NOT NULL, -- e.g., 'BTC', 'ETH'
    base_symbol VARCHAR(10) NOT NULL, -- e.g., 'USD', 'USDT'
    exchange_id VARCHAR(50) NOT NULL REFERENCES exchanges(exchange_id),
    bid_price DECIMAL(15,8) NOT NULL,
    ask_price DECIMAL(15,8) NOT NULL,
    last_price DECIMAL(15,8),
    volume_24h DECIMAL(20,8),
    change_24h DECIMAL(10,6),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, base_symbol, exchange_id)
);

-- Exchange balances (for tracking platform funds on exchanges)
CREATE TABLE IF NOT EXISTS exchange_balances (
    exchange_id VARCHAR(50) NOT NULL REFERENCES exchanges(exchange_id),
    crypto_symbol VARCHAR(10) NOT NULL,
    available_balance DECIMAL(20,8) DEFAULT 0 CHECK (available_balance >= 0),
    reserved_balance DECIMAL(20,8) DEFAULT 0 CHECK (reserved_balance >= 0),
    total_balance DECIMAL(20,8) GENERATED ALWAYS AS (available_balance + reserved_balance) STORED,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (exchange_id, crypto_symbol)
);

-- Exchange API credentials (encrypted storage)
CREATE TABLE IF NOT EXISTS exchange_credentials (
    exchange_id VARCHAR(50) PRIMARY KEY REFERENCES exchanges(exchange_id),
    api_key_encrypted TEXT NOT NULL,
    secret_key_encrypted TEXT NOT NULL,
    passphrase_encrypted TEXT,
    is_testnet BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supported cryptocurrencies
CREATE TABLE IF NOT EXISTS supported_cryptocurrencies (
    crypto_id VARCHAR(10) PRIMARY KEY, -- e.g., 'BTC', 'ETH'
    name VARCHAR(100) NOT NULL, -- e.g., 'Bitcoin', 'Ethereum'
    symbol VARCHAR(10) NOT NULL, -- Same as crypto_id for consistency
    decimals INTEGER NOT NULL DEFAULT 8,
    is_active BOOLEAN DEFAULT TRUE,
    min_purchase_amount DECIMAL(15,2) DEFAULT 10,
    max_purchase_amount DECIMAL(15,2) DEFAULT 25000,
    icon_url VARCHAR(255),
    description TEXT,
    blockchain_network VARCHAR(50),
    contract_address VARCHAR(255), -- For ERC-20 tokens
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial exchange data
INSERT INTO exchanges (exchange_id, name, api_endpoint, supported_pairs, trading_fees, priority) VALUES
('binance', 'Binance', 'https://api.binance.com', ARRAY['BTC-USDT', 'ETH-USDT', 'XRP-USDT', 'LTC-USDT'], 0.001, 1),
('kraken', 'Kraken', 'https://api.kraken.com', ARRAY['BTC-USD', 'ETH-USD', 'XRP-USD', 'LTC-USD'], 0.0016, 2)
ON CONFLICT (exchange_id) DO NOTHING;

-- Insert supported cryptocurrencies
INSERT INTO supported_cryptocurrencies (crypto_id, name, symbol, decimals, min_purchase_amount, max_purchase_amount, description) VALUES
('BTC', 'Bitcoin', 'BTC', 8, 10, 25000, 'The first and most well-known cryptocurrency'),
('ETH', 'Ethereum', 'ETH', 18, 10, 25000, 'A decentralized platform for smart contracts'),
('XRP', 'XRP', 'XRP', 6, 10, 25000, 'A digital asset for cross-border payments'),
('LTC', 'Litecoin', 'LTC', 8, 10, 25000, 'A peer-to-peer cryptocurrency based on Bitcoin')
ON CONFLICT (crypto_id) DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_market_prices_symbol ON market_prices(symbol, base_symbol);
CREATE INDEX IF NOT EXISTS idx_market_prices_exchange ON market_prices(exchange_id);
CREATE INDEX IF NOT EXISTS idx_market_prices_timestamp ON market_prices(timestamp);
CREATE INDEX IF NOT EXISTS idx_exchange_balances_exchange ON exchange_balances(exchange_id);
CREATE INDEX IF NOT EXISTS idx_supported_crypto_active ON supported_cryptocurrencies(is_active) WHERE is_active = TRUE;

-- Update triggers
CREATE TRIGGER update_exchanges_updated_at BEFORE UPDATE ON exchanges FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_exchange_credentials_updated_at BEFORE UPDATE ON exchange_credentials FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_supported_cryptocurrencies_updated_at BEFORE UPDATE ON supported_cryptocurrencies FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Update trigger for exchange_balances
CREATE TRIGGER update_exchange_balances_last_updated 
BEFORE UPDATE ON exchange_balances 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();