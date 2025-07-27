import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente com base no NODE_ENV
const envPath = process.env.NODE_ENV === 'production' 
    ? path.resolve(__dirname, '../.env.production') 
    : path.resolve(__dirname, '../.env.development');

dotenv.config({ path: envPath });
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
import { configureSecurityMiddleware } from './config/security';
import logger from './config/logger';
// Importar Firebase Admin SDK para inicialização
import { initializeFirebase } from './config/firebase';

// Criar diretório de logs se não existir
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3006;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurar middlewares de segurança
configureSecurityMiddleware(app);

// Middleware de logging para requisições HTTP
app.use((req, res, next) => {
  logger.http(`${req.method} ${req.url}`);
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`);
  });
  
  next();
});

// Simple health check for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Legacy routes for mobile app compatibility (without /v1 prefix)
const apiLegacy = express.Router();

// Apply auth middleware to all legacy routes
import { authMiddleware } from './config/security';
apiLegacy.use(authMiddleware);

apiLegacy.use('/dashboard', dashboardRoutes);
apiLegacy.use('/inspections', inspectionsRouter);
apiLegacy.use('/properties', propertiesRoutes);
apiLegacy.use('/sync', syncRoutes);
apiLegacy.use('/users', usersRoutes);
apiLegacy.use('/empresas', companiesRoutes);
apiLegacy.use('/contestations', contestationRoutes);


app.use('/api', apiLegacy);

// Version 1 Routes (for future use and portal)
const apiV1 = express.Router();
apiV1.use(authMiddleware);

apiV1.use('/dashboard', dashboardRoutes);
apiV1.use('/inspections', inspectionsRouter);
apiV1.use('/properties', propertiesRoutes);
apiV1.use('/sync', syncRoutes);
apiV1.use('/users', usersRoutes);
apiV1.use('/empresas', companiesRoutes);
apiV1.use('/contestations', contestationRoutes);


app.use('/api/v1', apiV1);

// Setup Swagger
setupSwagger(app);


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
        '/api/empresas'
      ],
      v1: [
        '/api/v1/dashboard',
        '/api/v1/inspections',
        '/api/v1/properties',
        '/api/v1/sync',
        '/api/v1/contestations',
        '/api/v1/users',
        '/api/v1/empresas'
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

// Handle 404 routes
app.use((req, res) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada'
  });
});

// Start server
const startServer = async () => {
  try {
    const firebaseDb = await initializeFirebase();
    if (firebaseDb) {
      logger.info('Firebase inicializado com sucesso');
    } else {
      logger.warn('Servidor iniciando sem Firebase (modo desenvolvimento)');
    }
    
    app.listen(PORT, () => {
      logger.info(`Servidor iniciado no ambiente ${NODE_ENV}`);
      logger.info(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    logger.error('Falha ao iniciar o servidor:', error);
    process.exit(1);
  }
};

startServer();

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