import { Router } from 'express';
import { requestLogger } from '../middlewares/requestLogger';
import { errorHandler, notFoundHandler } from '../middlewares/errorHandler';

// Importar todas as rotas
import authRoutes from './auth';
import inspectionRoutes from './inspections';
import companyRoutes from './companies';
import userRoutes from './users';

const router = Router();

// Aplicar middleware de logging a todas as rotas
router.use(requestLogger);

// Definir todas as rotas da API
router.use('/auth', authRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/companies', companyRoutes);
router.use('/users', userRoutes);

// Rota de health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API Grifo Vistorias está funcionando',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Middleware para rotas não encontradas
router.use(notFoundHandler);

// Middleware global de tratamento de erros
router.use(errorHandler);

export default router;