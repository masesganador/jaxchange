import app from '../dist/index.js';

// Initialize database connections for serverless
let dbInitialized = false;

const initializeDatabase = async (): Promise<void> => {
  if (dbInitialized) return;
  
  try {
    console.log('🔄 Initializing database connections for serverless function...');
    
    const { db } = await import('../dist/shared/database/connection.js');
    
    try {
      await db.initializePostgreSQL();
    } catch (error) {
      console.warn('⚠️  PostgreSQL initialization failed, continuing without database...');
    }
    
    try {
      await db.initializeRedis();
    } catch (error) {
      console.warn('⚠️  Redis initialization failed, continuing without Redis...');
    }
    
    dbInitialized = true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
};

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  try {
    // Initialize database on first request
    await initializeDatabase();
    
    // Handle the request using the Express app
    return new Promise((resolve, reject) => {
      app(req, res, (err: any) => {
        if (err) {
          console.error('❌ Request handling error:', err);
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (error) {
    console.error('❌ Serverless function error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred'
    });
    return Promise.resolve();
  }
}
