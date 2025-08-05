import { Router } from 'express';
import { exportController } from '../controllers/ExportController';
import { authenticateToken, requireEmpresa } from '../middlewares/auth';
import { validateRequest } from '../validators';
import { exportQuerySchema } from '../validators/export.schema';

const router = Router();

/**
 * @route GET /api/exports
 * @desc Lista as opções de exportação disponíveis
 * @access Private
 */
router.get('/',
  authenticateToken,
  requireEmpresa,
  (req, res) => {
    res.json({
      success: true,
      data: {
        availableExports: [
          {
            endpoint: '/api/exports/inspections/export',
            description: 'Exportar vistorias',
            method: 'GET'
          },
          {
            endpoint: '/api/exports/properties/export',
            description: 'Exportar propriedades',
            method: 'GET'
          },
          {
            endpoint: '/api/exports/users/export',
            description: 'Exportar usuários',
            method: 'GET'
          }
        ]
      },
      message: 'Opções de exportação disponíveis'
    });
  }
);

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