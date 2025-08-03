import { Router } from 'express';
import { propertyController } from '../controllers';
import { authenticateToken, requireRole } from '../middlewares';
import { validateRequest } from '../validators';
import { propertySchema } from '../validators/properties';
import { commonQuerySchema } from '../validators';

const router = Router();

/**
 * @route GET /api/properties
 * @desc Obtém lista de propriedades com filtros
 * @access Private
 */
router.get('/', 
  authenticateToken,
  validateRequest({ query: commonQuerySchema }),
  propertyController.list
);

/**
 * @route GET /api/properties/:id
 * @desc Obtém detalhes de uma propriedade específica
 * @access Private
 */
router.get('/:id', authenticateToken, propertyController.getById);

/**
 * @route POST /api/properties
 * @desc Cadastra uma nova propriedade
 * @access Private
 */
router.post('/', 
  authenticateToken, 
  requireRole(['admin', 'super']), 
  validateRequest({ body: propertySchema }), 
  propertyController.create
);

/**
 * @route PUT /api/properties/:id
 * @desc Atualiza uma propriedade existente
 * @access Private
 */
router.put('/:id', 
  authenticateToken, 
  requireRole(['admin', 'super']), 
  validateRequest({ body: propertySchema.partial() }), 
  propertyController.update
);

/**
 * @route DELETE /api/properties/:id
 * @desc Remove uma propriedade
 * @access Private
 */
router.delete('/:id', 
  authenticateToken, 
  requireRole(['admin', 'super']), 
  propertyController.remove
);

export default router;