import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';

// Import config and other modules from the new server structure
import config from '../src/server/config';
import DatabaseService from '../src/server/services/database';
import { errorHandler, notFoundHandler } from '../src/server/middleware/error';
import userRoutes from '../src/server/routes/userRoutes';

// Initialize database connections for serverless
let dbInitialized = false;

const initializeDatabase = async (): Promise<void> => {
  if (dbInitialized) return;

  try {
    console.log('🔄 Initializing database connections for serverless function...');

    const dbService = DatabaseService.getInstance();
    await dbService.connect();

    dbInitialized = true;
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    // Continue without database for now
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

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later',
    timestamp: new Date().toISOString()
  }
});
app.use('/api/', limiter);

// Compression
app.use(compression());

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'JAXChange API',
      version: '1.0.0',
      description: 'Jamaican Cryptocurrency Purchase Platform API',
      contact: {
        name: 'JAXChange Support',
        email: 'support@jaxchange.com'
      }
    },
    servers: [
      {
        url: 'https://jaxchange.vercel.app',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/server/routes/*.ts', './src/server/controllers/*.ts']
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: '1.0.0'
    }
  });
});

// API routes
app.use(`/api/${config.apiVersion}/users`, userRoutes);

// Root API endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      message: 'Welcome to JAXChange API',
      version: '1.0.0',
      documentation: '/api-docs',
      health: '/health',
      timestamp: new Date().toISOString()
    }
  });
});

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  // Check if the request is for an API route
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      timestamp: new Date().toISOString()
    });
  }

  // Serve the React app for all other routes
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  try {
    // Initialize database on first request
    await initializeDatabase();

    // Handle the request using the Express app
    return new Promise<void>((resolve, reject) => {
      app(req, res, (err: any) => {
        if (err) {
          console.error('❌ Request handling error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('❌ Serverless function error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    });
    return Promise.resolve();
  }
}
