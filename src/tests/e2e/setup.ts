// End-to-end test setup
import app from '../../index';
import { DatabaseConnection } from '@/shared/database/connection';
import { Server } from 'http';

let server: Server;

// Setup test server
beforeAll(async () => {
  // Use test database
  process.env.DATABASE_NAME = 'jaxchange_e2e_test';
  process.env.REDIS_DB = '2'; // Use different Redis DB for e2e tests
  process.env.PORT = '0'; // Use random available port
  
  try {
    // Initialize database connections
    await DatabaseConnection.initializePostgreSQL();
    await DatabaseConnection.initializeRedis();
    
    // Start test server
    server = app.listen(0, () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 3000;
      process.env.TEST_SERVER_URL = `http://localhost:${port}`;
      console.log(`Test server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start test server:', error);
    throw error;
  }
}, 30000);

// Cleanup after all tests
afterAll(async () => {
  try {
    if (server) {
      server.close();
    }
    await DatabaseConnection.closeConnections();
    console.log('Test server and database connections closed');
  } catch (error) {
    console.error('Failed to close test server:', error);
  }
});

// Reset data before each test
beforeEach(async () => {
  try {
    const db = DatabaseConnection.getPostgreSQLPool();
    const redis = DatabaseConnection.getRedisClient();
    
    // Clear Redis
    await redis.flushdb();
    
    // Clear PostgreSQL tables
    await db.query('TRUNCATE transaction_history, transactions, orders, user_balances, payment_methods CASCADE');
    await db.query('TRUNCATE user_preferences, user_verification, user_profiles, users CASCADE');
    await db.query('TRUNCATE market_prices, exchange_balances CASCADE');
  } catch (error) {
    console.error('Failed to clear test data:', error);
  }
});