import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Carregar variáveis de ambiente apenas em desenvolvimento
// Em produção, o Render fornece as variáveis de ambiente diretamente
if (process.env.NODE_ENV !== 'production') {
    const envPath = path.resolve(__dirname, '../.env.development');
    dotenv.config({ path: envPath });
}

// Importar configurações
import { corsOptions } from './config/security';
import logger from './config/logger';
import { initializeDatabase } from './config/database';
import { initializeFirebase } from './config/firebase';
import { setupSwagger } from './config/swagger';

// Importar middlewares
import { generalLimiter } from './middlewares/rateLimiter';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';



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

// Middlewares básicos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configuração do CORS
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// Rate limiting global
app.use(generalLimiter);

// Middleware de logging
app.use(requestLogger);

const startServer = async () => {
  try {
    // Inicializar Firebase primeiro
    logger.info('Initializing Firebase...');
    await initializeFirebase();
    logger.info('Firebase initialized successfully.');

    // Inicializar banco de dados PostgreSQL
    logger.info('Attempting to initialize Database...');
    await initializeDatabase();
    logger.info('Database initialized successfully.');

    // Importar rotas após inicialização do Firebase
    const apiRoutes = (await import('./routes')).default;
    
    // Configurar rotas
    app.use('/api', apiRoutes);
    
    // Middleware para rotas não encontradas
    app.use(notFoundHandler);
    
    // Middleware global de tratamento de erros
    app.use(errorHandler);
    
    // Setup Swagger
    setupSwagger(app);

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
app.use((err: Error, req: express.Request, res: express.Response) => {
  logger.error(`Erro: ${err.message}`);
  logger.error(err.stack);
  
  res.status((err as any).status || 500).json({
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