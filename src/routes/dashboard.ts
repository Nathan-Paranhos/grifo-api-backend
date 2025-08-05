import { Router } from 'express';
import { dashboardController } from '../controllers';
import { authenticateToken } from '../middlewares';
import { validateRequest } from '../validators';
import { commonQuerySchema } from '../validators';

const router = Router();

/**
 * @route GET /api/dashboard
 * @desc Rota raiz do dashboard - redireciona para stats
 * @access Private
 */
router.get('/', 
  authenticateToken,
  validateRequest({ query: commonQuerySchema }),
  dashboardController.getStats
);

/**
 * @route GET /api/dashboard/stats
 * @desc Obtém estatísticas do dashboard
 * @access Private
 */
router.get('/stats', 
  authenticateToken,
  validateRequest({ query: commonQuerySchema }),
  dashboardController.getStats
);

export default router;