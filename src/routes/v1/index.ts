import { Router } from 'express';
import { requestLogger } from '../../middlewares/requestLogger';
import { errorHandler, notFoundHandler } from '../../middlewares/errorHandler';

// Importar todas as rotas existentes
import authRoutes from '../auth';
import inspectionRoutes from '../inspections';
import companyRoutes from '../companies';
import userRoutes from '../users';
import dashboardRoutes from '../dashboard';
import propertiesRoutes from '../properties';
import syncRoutes from '../sync';
import contestationRoutes from '../contestation';
import notificationsRoutes from '../notifications';
import uploadsRoutes from '../uploads';
import exportsRoutes from '../exports';
import reportsRoutes from '../reports';
import healthRoutes from '../health';

const router = Router();

// Aplicar middleware de logging a todas as rotas v1
router.use(requestLogger);

// Definir todas as rotas da API v1 (aliases das rotas existentes)
router.use('/auth', authRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/companies', companyRoutes);
router.use('/empresas', companyRoutes); // Alias para compatibilidade
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/properties', propertiesRoutes);
router.use('/sync', syncRoutes);
router.use('/contestations', contestationRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/exports', exportsRoutes);
router.use('/reports', reportsRoutes);
router.use('/health', healthRoutes);

// Middleware para rotas não encontradas
router.use(notFoundHandler);

// Middleware global de tratamento de erros
router.use(errorHandler);

export default router;