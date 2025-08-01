import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente apenas em desenvolvimento
// Em produção, o Render fornece as variáveis de ambiente diretamente
if (process.env.NODE_ENV !== 'production') {
    const envPath = path.resolve(__dirname, '../.env.development');
    dotenv.config({ path: envPath });
}
import fs from 'fs';
import healthRoutes from './routes/health';
import dashboardRoutes from './routes/dashboard';
import inspectionsRouter from './routes/inspections';
import { setupSwagger } from './config/swagger';
import propertiesRoutes from './routes/properties';
import syncRoutes from './routes/sync';
import usersRoutes from './routes/users';
import companiesRoutes from './routes/companies';
import contestationRoutes from './routes/contestation';

import authRoutes from './routes/auth';
import notificationsRoutes from './routes/notifications';
import uploadsRoutes from './routes/uploads';
import exportsRoutes from './routes/exports';
import reportsRoutes from './routes/reports';
import { authenticateToken, corsOptions } from './config/security';
import logger from './config/logger';
import { initializeFirebase } from './config/firebase';
import { initializeDatabase } from './config/database';
import { initializePortal } from './config/portal';

// Criar diretório de logs se não existir
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3006;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Simple health check for Render (antes dos middlewares de segurança)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração do CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// Middleware de logging para requisições HTTP
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`);
  logger.debug(`Headers: ${JSON.stringify(req.headers)}`);
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Legacy routes for mobile app compatibility (without /v1 prefix)
const apiLegacy = express.Router();

// Rotas públicas (não precisam de autenticação)
app.use('/api/auth', authRoutes);
// Rotas públicas (não precisam de autenticação)
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// A partir daqui, todas as rotas são protegidas
app.use(authenticateToken);

apiLegacy.use('/dashboard', dashboardRoutes);
apiLegacy.use('/inspections', inspectionsRouter);
apiLegacy.use('/properties', propertiesRoutes);
apiLegacy.use('/sync', syncRoutes);
apiLegacy.use('/users', usersRoutes);
apiLegacy.use('/empresas', companiesRoutes);
apiLegacy.use('/contestations', contestationRoutes);
apiLegacy.use('/notifications', notificationsRoutes);
apiLegacy.use('/uploads', uploadsRoutes);
apiLegacy.use('/exports', exportsRoutes);
apiLegacy.use('/reports', reportsRoutes);


app.use('/api', apiLegacy);

// As rotas legadas e v1 já estarão protegidas pelo middleware global
// Não é necessário aplicar novamente
const apiV1 = express.Router();

apiV1.use('/dashboard', dashboardRoutes);
apiV1.use('/inspections', inspectionsRouter);
apiV1.use('/properties', propertiesRoutes);
apiV1.use('/sync', syncRoutes);
apiV1.use('/users', usersRoutes);
apiV1.use('/empresas', companiesRoutes);
apiV1.use('/contestations', contestationRoutes);
apiV1.use('/notifications', notificationsRoutes);
apiV1.use('/uploads', uploadsRoutes);
apiV1.use('/exports', exportsRoutes);
apiV1.use('/reports', reportsRoutes);


app.use('/api/v1', apiV1);

// Setup Swagger
setupSwagger(app);

const startServer = async () => {
  try {
    logger.info('Initializing Database...');
    await initializeDatabase();
    logger.info('Database initialized.');

    logger.info('Initializing Portal...');
    await initializePortal();
    logger.info('Portal initialized.');

    logger.info('Initializing Firebase...');
    await initializeFirebase();
    logger.info('Firebase initialized successfully.');

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${NODE_ENV}`);
      logger.info(`CORS Origin: ${CORS_ORIGIN}`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


// Rota raiz com informações da API
app.get('/', (req, res) => {
  res.json({
    message: 'Grifo API Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      public: [
        '/api/health'
      ],
      legacy: [
        '/api/dashboard',
        '/api/inspections',
        '/api/properties',
        '/api/sync',
        '/api/contestations',
        '/api/users',
        '/api/empresas',
        '/api/notifications',
        '/api/uploads',
        '/api/exports',
        '/api/reports'
      ],
      v1: [
        '/api/v1/dashboard',
        '/api/v1/inspections',
        '/api/v1/properties',
        '/api/v1/sync',
        '/api/v1/contestations',
        '/api/v1/users',
        '/api/v1/empresas',
        '/api/v1/notifications',
        '/api/v1/uploads',
        '/api/v1/exports',
        '/api/v1/reports'
      ]
    },
    authentication: {
      required: 'Firebase Auth Token',
      header: 'Authorization: Bearer <token>',
      note: 'All protected endpoints require authentication'
    },
    compatibility: {
      mobile: 'Uses /api/* endpoints (legacy)',
      portal: 'Uses /api/v1/* endpoints (versioned)'
    },
    documentation: '/api-docs'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Erro: ${err.message}`);
  logger.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: NODE_ENV === 'production' ? 'Erro interno do servidor' : err.message
  });
});

// Handle 404 routes - garantir resposta JSON
app.use((req, res) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: 'Recurso não encontrado',
    message: `Endpoint ${req.method} ${req.url} não existe`,
    timestamp: new Date().toISOString()
  });
});

// Firebase já foi inicializado na primeira função startServer

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Exceção não tratada:');
  logger.error(error.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Rejeição de promessa não tratada:');
  logger.error(`Promessa: ${promise}, Razão: ${reason}`);
});