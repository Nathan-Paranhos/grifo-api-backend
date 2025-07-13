import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import healthRoutes from './routes/health';
import dashboardRoutes from './routes/dashboard';
import inspectionsRoutes from './routes/inspections';
import propertiesRoutes from './routes/properties';
import syncRoutes from './routes/sync';
import contestationRoutes from './routes/contestation';
import { configureSecurityMiddleware } from './config/security';
import logger from './config/logger';

// Criar diretório de logs se não existir
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const app = express();
const PORT = process.env.PORT || 3000;
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

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inspections', inspectionsRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/contestations', contestationRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Grifo API Backend',
    version: '1.0.0',
    environment: NODE_ENV,
    endpoints: [
      '/api/health',
      '/api/dashboard',
      '/api/inspections',
      '/api/properties',
      '/api/sync',
      '/api/contestations'
    ]
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
app.listen(PORT, () => {
  logger.info(`Servidor iniciado no ambiente ${NODE_ENV}`);
  logger.info(`Servidor rodando na porta ${PORT}`);
});

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