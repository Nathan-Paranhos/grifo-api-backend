import { Router } from 'express';
import { exportController } from '../controllers/ExportController';
import { authenticateToken, requireEmpresa } from '../middlewares/auth';
import { validateRequest } from '../validators';
import { exportQuerySchema } from '../validators/export.schema';

const router = Router();

router.get('/inspections/export',
  authenticateToken,
  requireEmpresa,
  validateRequest({ query: exportQuerySchema }),
  exportController.exportInspections
);

router.get('/properties/export',
  authenticateToken,
  requireEmpresa,
  validateRequest({ query: exportQuerySchema }),
  exportController.exportProperties
);

router.get('/users/export',
  authenticateToken,
  requireEmpresa,
  validateRequest({ query: exportQuerySchema }),
  exportController.exportUsers
);

export default router;