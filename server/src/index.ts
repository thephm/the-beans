console.log('=== The Beans server entrypoint starting ===');
// Log uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bigintSerializer from './middleware/bigintSerializer';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';

// Import routes

import authRoutes from './routes/auth';
import analyticsRouter from './routes/analytics';
import analyticsAdminRouter from './routes/analyticsAdmin';
import userRoutes from './routes/users';
import roasterRoutes from './routes/roasters';
import peopleRoutes from './routes/people';
import reviewRoutes from './routes/reviews';
import searchRoutes from './routes/search';
import auditLogRoutes from './routes/auditLogs';
import adminUsersRoutes from './routes/adminUsers';
import regionRoutes from './routes/regions';
import countryRoutes from './routes/countries';
import specialtyRoutes from './routes/specialties';
import contactRouter from './routes/contact'; // Import contact router
import favouritesRoutes from './routes/favourites';
import suggestionsRoutes from './routes/suggestions';
import backupRoutes from './routes/backup';
import redditRoutes from './routes/reddit';
import oauthRoutes from './routes/oauth';
import oauthNewRoutes from './routes/oauthNew';
import postsRoutes from './routes/posts';

import forgotPasswordRoutes from './routes/forgotPassword';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// Trust proxy - Required when behind Render's load balancer or any reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin requests for static files
}));

// Configure CORS origins based on environment
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',')
  : [
      'http://localhost:3000', 
      'http://localhost:5000',
      'https://the-beans-frontend.onrender.com', // Render frontend
      'https://thebeans.ca' // Production custom domain
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Convert BigInt values returned by raw SQL queries to safe JSON types
app.use(bigintSerializer);
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'The Beans API',
      version: '1.0.0',
      description: 'API for The Beans coffee roaster discovery app',
      contact: {
        name: 'The Beans Team',
        email: 'api@the-beans.app',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5000',
        description: 'Development server',
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
  apis: ['./src/routes/*.ts', './src/models/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .scheme-container { background: linear-gradient(135deg, #f3edff 0%, #e9dfff 50%, #d7c5ff 100%); }
  `,
  customSiteTitle: 'The Beans API Documentation',
}));

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Import prisma client
    const { prisma } = await import('./lib/prisma');
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      error: error?.message || 'Unknown error',
    });
  }
});


// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roasters', roasterRoutes);
app.use('/api/people', peopleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/countries', countryRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/contact', contactRouter);
app.use('/api/favourites', favouritesRoutes);
app.use('/api/suggestions', suggestionsRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/reddit', redditRoutes);
app.use('/api/oauth', oauthRoutes); // Legacy Reddit OAuth
app.use('/api/auth/oauth', oauthNewRoutes); // New OAuth 2.0 system
app.use('/api/posts', postsRoutes);
app.use('/api', forgotPasswordRoutes);
app.use('/api/admin', auditLogRoutes); // Admin audit log routes
// Analytics event capture route
app.use('/api/analytics', analyticsRouter);
// Analytics admin stats route
app.use('/api/admin/analytics', analyticsAdminRouter);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found on this server.',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/api-docs`);
});

