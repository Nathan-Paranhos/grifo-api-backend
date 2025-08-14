import express from 'express';
import tenantRoutes from './tenants.js';
import authRoutes from './auth.js';
import companyRoutes from './companies.js';
import userRoutes from './users.js';
import propertyRoutes from './properties.js';
import inspectionRoutes from './inspections.js';
import contestacaoRoutes from './contestacoes.js';
import uploadRoutes from './uploads.js';
import reportRoutes from './reports.js';
import healthRoutes from './health.js';

const router = express.Router();

// API Info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Grifo Vistorias API v1',
    version: '1.0.0',
    endpoints: {
      tenants: '/api/v1/tenants',
      auth: '/api/v1/auth',
      companies: '/api/v1/companies',
      users: '/api/v1/users',
      properties: '/api/v1/properties',
      inspections: '/api/v1/inspections',
      contestacoes: '/api/v1/contestacoes',
      uploads: '/api/v1/uploads',
      reports: '/api/v1/reports',
      health: '/api/v1/health'
    },
    documentation: '/api/docs'
  });
});

// Mount routes
router.use('/tenants', tenantRoutes);
router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/users', userRoutes);
router.use('/properties', propertyRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/contestacoes', contestacaoRoutes);
router.use('/uploads', uploadRoutes);
router.use('/reports', reportRoutes);
router.use('/health', healthRoutes);

export default router;
