import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

// Import config and other modules
import config from '../src/config';
import { db } from '../src/shared/database/connection';
import { errorHandler, notFoundHandler } from '../src/shared/middleware/error';
import userRoutes from '../src/services/user-management/routes';

// Initialize database connections for serverless
let dbInitialized = false;

const initializeDatabase = async (): Promise<void> => {
  if (dbInitialized) return;
  
  try {
    console.log('🔄 Initializing database connections for serverless function...');
    
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

// Create Express app
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'JAXChange API is running',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: `/api/${config.server.apiVersion}`,
      docs: '/api-docs'
    }
  });
});

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
app.use(`/api/${config.server.apiVersion}/auth`, userRoutes);
app.use(`/api/${config.server.apiVersion}/users`, userRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

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
