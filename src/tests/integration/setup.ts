// Integration test setup
import { DatabaseConnection } from '@/shared/database/connection';

// Test database setup
beforeAll(async () => {
  // Set test environment
  process.env.DATABASE_NAME = 'jaxchange_test';
  process.env.REDIS_DB = '1'; // Use different Redis DB for tests
  
  try {
    // Initialize test database connections
    await DatabaseConnection.initializePostgreSQL();
    await DatabaseConnection.initializeRedis();
    
    console.log('Test database connections initialized');
  } catch (error) {
    console.error('Failed to initialize test database:', error);
    throw error;
  }
});

// Clean up after all tests
afterAll(async () => {
  try {
    await DatabaseConnection.closeConnections();
    console.log('Test database connections closed');
  } catch (error) {
    console.error('Failed to close test database connections:', error);
  }
});

// Clear data before each test
beforeEach(async () => {
  try {
    const db = DatabaseConnection.getPostgreSQLPool();
    const redis = DatabaseConnection.getRedisClient();
    
    // Clear Redis
    await redis.flushdb();
    
    // Clear PostgreSQL tables (in reverse dependency order)
    await db.query('TRUNCATE transaction_history, transactions, orders, user_balances, payment_methods CASCADE');
    await db.query('TRUNCATE user_preferences, user_verification, user_profiles, users CASCADE');
    await db.query('TRUNCATE market_prices, exchange_balances CASCADE');
    
    console.log('Test data cleared');
  } catch (error) {
    console.error('Failed to clear test data:', error);
  }
});