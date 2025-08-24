import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

import config from './config';
import { db } from './shared/database/connection';
import { errorHandler, notFoundHandler } from './shared/middleware/error';

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://jaxchange.com', 'https://www.jaxchange.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindow,
  max: config.security.rateLimitMax,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(config.server.nodeEnv === 'production' ? 'combined' : 'dev'));

// Swagger API documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JAXChange API',
      version: '1.0.0',
      description: 'Jamaican Cryptocurrency Purchase Platform API',
      contact: {
        name: 'JAXChange Support',
        email: 'support@jaxchange.com',
      },
    },
    servers: [
      {
        url: config.server.nodeEnv === 'production' 
          ? 'https://api.jaxchange.com' 
          : `http://localhost:${config.server.port}`,
        description: config.server.nodeEnv === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/**/*.ts'], // Path to the API files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'JAXChange API Documentation',
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'JAXChange API is running',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    version: '1.0.0',
  });
});

// API version endpoint
app.get(`/api/${config.server.apiVersion}`, (req, res) => {
  res.json({
    success: true,
    message: `JAXChange API ${config.server.apiVersion}`,
    documentation: '/api-docs',
  });
});

// Service routes
import userRoutes from './services/user-management/routes';
app.use(`/api/${config.server.apiVersion}/auth`, userRoutes);
app.use(`/api/${config.server.apiVersion}/users`, userRoutes);
// app.use(`/api/${config.server.apiVersion}/trading`, tradingRoutes);
// app.use(`/api/${config.server.apiVersion}/payments`, paymentRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Initialize database connections (only for serverless)
let dbInitialized = false;

const initializeDatabase = async (): Promise<void> => {
  if (dbInitialized) return;
  
  try {
    console.log('🔄 Initializing database connections...');
    
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

// Server startup (only for development)
const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();

    // Start the server
    app.listen(config.server.port, () => {
      console.log(`🚀 JAXChange API server running on port ${config.server.port}`);
      console.log(`📝 Environment: ${config.server.nodeEnv}`);
      console.log(`📖 API Documentation: http://localhost:${config.server.port}/api-docs`);
      console.log(`❤️  Health Check: http://localhost:${config.server.port}/health`);
    });

    // Graceful shutdown handlers
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = async (): Promise<void> => {
  console.log('\n🔄 Received shutdown signal, closing server gracefully...');
  
  try {
    await db.closeConnections();
    console.log('✅ Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV !== 'production') {
    gracefulShutdown();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception thrown:', error);
  if (process.env.NODE_ENV !== 'production') {
    gracefulShutdown();
  }
});

// Start the server only in development
if (require.main === module && process.env.NODE_ENV !== 'production') {
  startServer();
}

export default app;