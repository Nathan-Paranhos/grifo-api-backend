import { Router } from 'express';
import { exportController } from '../controllers/ExportController';
import { requireEmpresa } from '../middlewares/auth';
import { validateRequest } from '../validators';
import { exportQuerySchema } from '../validators/export.schema';

const router = Router();

router.get('/inspections/export',
  requireEmpresa,
  validateRequest({ query: exportQuerySchema }),
  exportController.exportInspections
);

router.get('/properties/export',
  requireEmpresa,
  validateRequest({ query: exportQuerySchema }),
  exportController.exportProperties
);

router.get('/users/export',
  requireEmpresa,
  validateRequest({ query: exportQuerySchema }),
  exportController.exportUsers
);

export default router;