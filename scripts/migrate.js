const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Database configuration
const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  database: process.env.DATABASE_NAME || 'jaxchange',
  user: process.env.DATABASE_USER || 'jaxchange_user',
  password: process.env.DATABASE_PASSWORD || 'secure_password',
};

async function runMigrations() {
  const pool = new Pool(config);
  
  try {
    console.log('🔄 Starting database migrations...');
    
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get list of migration files
    const migrationsDir = path.join(__dirname, '..', 'src', 'shared', 'database', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort to ensure order
    
    console.log(`📁 Found ${migrationFiles.length} migration files`);
    
    // Get already executed migrations
    const { rows: executedMigrations } = await pool.query(
      'SELECT filename FROM migrations ORDER BY id'
    );
    const executedFiles = executedMigrations.map(row => row.filename);
    
    // Run pending migrations
    for (const filename of migrationFiles) {
      if (!executedFiles.includes(filename)) {
        console.log(`🔄 Running migration: ${filename}`);
        
        const filePath = path.join(migrationsDir, filename);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Execute migration
        await pool.query(sql);
        
        // Record migration as executed
        await pool.query(
          'INSERT INTO migrations (filename) VALUES ($1)',
          [filename]
        );
        
        console.log(`✅ Completed migration: ${filename}`);
      } else {
        console.log(`⏭️  Skipping already executed migration: ${filename}`);
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
