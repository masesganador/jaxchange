const { Pool } = require('pg');

// Database configuration
const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'jaxchange',
  user: process.env.DATABASE_USER || 'jaxchange_user',
  password: process.env.DATABASE_PASSWORD || 'secure_password',
};

async function seedDatabase() {
  const pool = new Pool(config);
  
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if data already exists
    const { rows: existingExchanges } = await pool.query('SELECT COUNT(*) as count FROM exchanges');
    
    if (parseInt(existingExchanges[0].count) > 0) {
      console.log('⏭️  Database already seeded, skipping...');
      return;
    }
    
    // Seed exchanges
    console.log('📊 Seeding exchanges...');
    await pool.query(`
      INSERT INTO exchanges (exchange_id, name, api_endpoint, supported_pairs, trading_fees, priority) VALUES
      ('binance', 'Binance', 'https://api.binance.com', ARRAY['BTC-USDT', 'ETH-USDT', 'XRP-USDT', 'LTC-USDT'], 0.001, 1),
      ('kraken', 'Kraken', 'https://api.kraken.com', ARRAY['BTC-USD', 'ETH-USD', 'XRP-USD', 'LTC-USD'], 0.0016, 2)
      ON CONFLICT (exchange_id) DO NOTHING;
    `);
    
    // Seed supported cryptocurrencies
    console.log('🪙 Seeding cryptocurrencies...');
    await pool.query(`
      INSERT INTO supported_cryptocurrencies (crypto_id, name, symbol, decimals, min_purchase_amount, max_purchase_amount, description) VALUES
      ('BTC', 'Bitcoin', 'BTC', 8, 10, 25000, 'The first and most well-known cryptocurrency'),
      ('ETH', 'Ethereum', 'ETH', 18, 10, 25000, 'A decentralized platform for smart contracts'),
      ('XRP', 'XRP', 'XRP', 6, 10, 25000, 'A digital asset for cross-border payments'),
      ('LTC', 'Litecoin', 'LTC', 8, 10, 25000, 'A peer-to-peer cryptocurrency based on Bitcoin')
      ON CONFLICT (crypto_id) DO NOTHING;
    `);
    
    // Create a test admin user (for development)
    if (process.env.NODE_ENV === 'development') {
      console.log('👤 Creating test admin user...');
      const bcrypt = require('bcryptjs');
      const { v4: uuidv4 } = require('uuid');
      
      const adminUserId = uuidv4();
      const passwordHash = await bcrypt.hash('admin123', 12);
      
      await pool.query(`
        INSERT INTO users (user_id, email, password_hash, status, referral_code, email_verified, phone_verified) VALUES
        ($1, 'admin@jaxchange.com', $2, 'active', 'ADMIN001', true, true)
        ON CONFLICT (email) DO NOTHING;
      `, [adminUserId, passwordHash]);
      
      await pool.query(`
        INSERT INTO user_profiles (user_id, first_name, last_name, country) VALUES
        ($1, 'Admin', 'User', 'JAM')
        ON CONFLICT (user_id) DO NOTHING;
      `, [adminUserId]);
      
      await pool.query(`
        INSERT INTO user_verification (user_id, kyc_status, verification_level) VALUES
        ($1, 'approved', 3)
        ON CONFLICT (user_id) DO NOTHING;
      `, [adminUserId]);
      
      await pool.query(`
        INSERT INTO user_preferences (user_id, trading_limit_daily, trading_limit_monthly) VALUES
        ($1, 10000, 50000)
        ON CONFLICT (user_id) DO NOTHING;
      `, [adminUserId]);
      
      console.log('✅ Test admin user created: admin@jaxchange.com / admin123');
    }
    
    console.log('🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run seeding if this script is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
