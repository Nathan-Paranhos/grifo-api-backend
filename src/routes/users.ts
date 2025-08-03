import { Router } from 'express';
import { userController } from '../controllers';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { generalLimiter, createLimiter, authLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../validators';
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  changeRoleSchema,
  resetPasswordSchema
} from '../validators/users';

const router = Router();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

/**
 * GET /api/users
 * Lista todos os usuários da empresa
 */
router.get('/', 
  generalLimiter,
  requireRole(['admin', 'gerente']),
  userController.list
);

/**
 * GET /api/users/profile
 * Retorna o perfil do usuário logado
 */
router.get('/profile',
  generalLimiter,
  userController.getProfile
);

/**
 * PUT /api/users/profile
 * Atualiza o perfil do usuário logado
 */
router.put('/profile',
  generalLimiter,
  validateRequest({ body: updateProfileSchema.shape.body }),
  userController.updateProfile
);

/**
 * GET /api/users/:id
 * Retorna dados de um usuário específico
 */
router.get('/:id',
  generalLimiter,
  requireRole(['admin', 'gerente']),
  userController.getById
);

/**
 * POST /api/users
 * Cria um novo usuário
 */
router.post('/',
  createLimiter,
  requireRole(['admin']),
  validateRequest({ body: createUserSchema.shape.body }),
  userController.create
);

/**
 * PUT /api/users/:id
 * Atualiza um usuário existente
 */
router.put('/:id',
  generalLimiter,
  requireRole(['admin', 'gerente']),
  validateRequest({ body: updateUserSchema.shape.body }),
  userController.update
);

/**
 * PUT /api/users/:id/role
 * Altera o papel de um usuário
 */
router.put('/:id/role',
  generalLimiter,
  requireRole(['admin']),
  validateRequest({ body: changeRoleSchema.shape.body }),
  userController.changeRole
);

/**
 * DELETE /api/users/:id
 * Remove um usuário
 */
router.delete('/:id',
  generalLimiter,
  requireRole(['admin']),
  userController.remove
);

/**
  * POST /api/users/reset-password
  * Solicita reset de senha
  */
 router.post('/reset-password',
  authLimiter,
  validateRequest({ body: resetPasswordSchema.shape.body }),
  userController.resetPassword
);

 /**
  * PATCH /api/users/:id/deactivate
  * Desativa um usuário
  */
 router.patch('/:id/deactivate',
   generalLimiter,
   requireRole(['admin']),
   userController.deactivate
 );

 /**
  * PATCH /api/users/:id/reactivate
  * Reativa um usuário
  */
 router.patch('/:id/reactivate',
   generalLimiter,
   requireRole(['admin']),
   userController.reactivate
 );

 /**
  * GET /api/users/stats
  * Obtém estatísticas de usuários
  */
 router.get('/stats',
   generalLimiter,
   requireRole(['admin', 'gerente']),
   userController.getStats
 );

 export default router;