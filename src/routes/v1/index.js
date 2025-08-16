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
import notificationRoutes from './notifications.js';
import settingsRoutes from './settings.js';

// Import middlewares
import { authSupabase } from '../../middleware/auth.js';
import { resolveTenant, requireTenantAccess } from '../../middleware/tenant.js';

const router = express.Router();

// API Info endpoint (público)
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Grifo Vistorias API v1',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      // Rotas públicas
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      
      // Rotas administrativas (sem tenant)
      tenants: '/api/v1/tenants',
      
      // Rotas por tenant
      companies: '/api/v1/tenants/{tenant}/companies',
      users: '/api/v1/tenants/{tenant}/users', 
      properties: '/api/v1/tenants/{tenant}/properties',
      inspections: '/api/v1/tenants/{tenant}/inspections',
      contestacoes: '/api/v1/tenants/{tenant}/contestacoes',
      uploads: '/api/v1/tenants/{tenant}/uploads',
      reports: '/api/v1/tenants/{tenant}/reports',
      notifications: '/api/v1/tenants/{tenant}/notifications',
      settings: '/api/v1/tenants/{tenant}/settings'
    },
    documentation: '/api/docs'
  });
});

// ============================================================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================================================

// Health check
router.use('/health', healthRoutes);

// Autenticação (login, registro, etc.)
router.use('/auth', authRoutes);

// ============================================================================
// ROTAS ADMINISTRATIVAS (com autenticação, sem tenant)
// ============================================================================

// Gestão de tenants (apenas para admins globais)
router.use('/tenants', authSupabase, tenantRoutes);

// ============================================================================
// ROTAS POR TENANT (com autenticação + tenant)
// ============================================================================

// Middleware para todas as rotas de tenant
router.use('/tenants/:tenant/*', authSupabase, resolveTenant, requireTenantAccess);

// Rotas específicas por tenant
router.use('/tenants/:tenant/companies', companyRoutes);
router.use('/tenants/:tenant/users', userRoutes);
router.use('/tenants/:tenant/properties', propertyRoutes);
router.use('/tenants/:tenant/inspections', inspectionRoutes);
router.use('/tenants/:tenant/contestacoes', contestacaoRoutes);
router.use('/tenants/:tenant/uploads', uploadRoutes);
router.use('/tenants/:tenant/reports', reportRoutes);
router.use('/tenants/:tenant/notifications', notificationRoutes);
router.use('/tenants/:tenant/settings', settingsRoutes);

// ============================================================================
// ROTAS LEGACY (manter compatibilidade temporária)
// ============================================================================

// Redirecionar rotas antigas para novas (com warning)
const legacyRedirect = (newPath) => (req, res) => {
  const tenant = req.headers['x-tenant'] || req.query.tenant;
  if (!tenant) {
    return res.status(400).json({
      success: false,
      error: 'Esta rota foi movida. Use /api/v1/tenants/{tenant}' + newPath + ' ou adicione header X-Tenant',
      code: 'LEGACY_ROUTE_DEPRECATED'
    });
  }
  
  const newUrl = `/api/v1/tenants/${tenant}${newPath}`;
  res.status(301).json({
    success: false,
    error: 'Rota movida permanentemente',
    code: 'MOVED_PERMANENTLY',
    newUrl: newUrl,
    message: `Use ${newUrl} em vez desta rota`
  });
};

// Rotas legacy com redirecionamento
router.use('/companies', legacyRedirect('/companies'));
router.use('/users', legacyRedirect('/users'));
router.use('/properties', legacyRedirect('/properties'));
router.use('/inspections', legacyRedirect('/inspections'));
router.use('/contestacoes', legacyRedirect('/contestacoes'));
router.use('/uploads', legacyRedirect('/uploads'));
router.use('/reports', legacyRedirect('/reports'));

export default router;
