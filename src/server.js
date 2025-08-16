// Load environment variables FIRST
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from api root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Debug: Log environment variables loading
// Environment variables loaded (debug info removed)

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

// Import configurations
import { logger } from './config/logger.js';
import { swaggerSpec, swaggerUi } from './config/swagger.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { securityHeaders } from './middleware/security.js';
import { authSupabase } from './middleware/auth.js';
import { resolveTenant } from './middleware/tenant.js';
// Auth middlewares are imported in route files as needed

// Import routes
import v1Routes from './routes/v1/index.js';
import dashboardRoutes from './routes/dashboard.js';
import syncRoutes from './routes/sync.js';
import healthRoutes from './routes/health.js';
// import notificationsRoutes from './routes/notifications.js'; // File not found

const app = express();
const PORT = process.env.PORT || 1000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Security middleware with comprehensive headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", 'https://api.grifo.com', 'https://*.supabase.co']
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' },
    noSniff: true,
    xssFilter: true
  })
);

// Configuração de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['https://grifo-portal.vercel.app'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Basic middleware
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(limiter);

// Additional security headers
app.use(securityHeaders);

// Logging middleware
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim())
    }
  })
);

// Health check endpoint (before auth middleware)
app.use('/api/health', healthRoutes);

// API Documentation
app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Grifo API Documentation'
  })
);

// API Routes
app.use('/api/v1', v1Routes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sync', syncRoutes);
// app.use('/api/notifications', notificationsRoutes); // File not found

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Grifo API Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
      v1: '/api/v1',
      dashboard: '/api/dashboard',
      sync: '/api/sync'
      // notifications: '/api/notifications' // File not found
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Grifo API Server running on port ${PORT}`);
  logger.info(`📚 API Documentation: https://grifo-api.onrender.com/api/docs`);
  logger.info(`🏥 Health Check: https://grifo-api.onrender.com/api/health`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
