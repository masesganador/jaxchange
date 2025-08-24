import { Pool, PoolConfig } from 'pg';
import Redis from 'ioredis';
import config from '@/config';

export class DatabaseConnection {
  private static pgPool: Pool;
  private static redisClient: Redis;

  static async initializePostgreSQL(): Promise<Pool> {
    if (!this.pgPool) {
      const poolConfig: PoolConfig = config.database.url 
        ? {
            connectionString: config.database.url,
            ssl: config.server.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
            max: config.server.nodeEnv === 'production' ? 5 : 20, // Smaller pool for serverless
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          }
        : {
            host: config.database.host,
            port: config.database.port,
            database: config.database.name,
            user: config.database.user,
            password: config.database.password,
            max: config.server.nodeEnv === 'production' ? 5 : 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
          };

      this.pgPool = new Pool(poolConfig);

      // Test connection
      try {
        const client = await this.pgPool.connect();
        console.log('✅ PostgreSQL connected successfully');
        client.release();
      } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error);
        throw error;
      }
    }

    return this.pgPool;
  }

  static async initializeRedis(): Promise<Redis> {
    if (!this.redisClient) {
      const redisConfig = config.redis.url
        ? {
            url: config.redis.url,
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
          }
        : {
            host: config.redis.host,
            port: config.redis.port,
            password: config.redis.password || undefined,
            retryDelayOnFailover: 100,
            enableReadyCheck: false,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
          };

      this.redisClient = new Redis(redisConfig);

      // Test connection
      try {
        await this.redisClient.connect();
        console.log('✅ Redis connected successfully');
      } catch (error) {
        console.error('❌ Redis connection failed:', error);
        throw error;
      }
    }

    return this.redisClient;
  }

  static getPostgreSQLPool(): Pool {
    if (!this.pgPool) {
      throw new Error('PostgreSQL not initialized. Call initializePostgreSQL first.');
    }
    return this.pgPool;
  }

  static getRedisClient(): Redis {
    if (!this.redisClient) {
      throw new Error('Redis not initialized. Call initializeRedis first.');
    }
    return this.redisClient;
  }

  static async closeConnections(): Promise<void> {
    if (this.pgPool) {
      await this.pgPool.end();
      console.log('PostgreSQL connection closed');
    }

    if (this.redisClient) {
      this.redisClient.disconnect();
      console.log('Redis connection closed');
    }
  }
}

export const db = DatabaseConnection;