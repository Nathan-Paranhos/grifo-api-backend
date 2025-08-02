import { Router } from 'express';
import { userController } from '../controllers';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { generalLimiter, createLimiter, authLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../validators';
import { z } from 'zod';

const router = Router();

// Schemas de validação
const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    nome: z.string().min(1, 'Nome é obrigatório'),
    papel: z.enum(['admin', 'gerente', 'vistoriador', 'proprietario'], {
      errorMap: () => ({ message: 'Papel deve ser: admin, gerente, vistoriador ou proprietario' })
    }),
    telefone: z.string().optional(),
    senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional()
  })
});

const updateUserSchema = z.object({
  body: z.object({
    nome: z.string().min(1).optional(),
    email: z.string().email().optional(),
    telefone: z.string().optional(),
    papel: z.enum(['admin', 'gerente', 'vistoriador', 'proprietario']).optional()
  })
});

const updateProfileSchema = z.object({
  body: z.object({
    nome: z.string().min(1).optional(),
    telefone: z.string().optional()
  })
});

const changeRoleSchema = z.object({
  body: z.object({
    papel: z.enum(['admin', 'gerente', 'vistoriador', 'proprietario'])
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido')
  })
});

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
  validateRequest(updateProfileSchema),
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
  validateRequest(createUserSchema),
  userController.create
);

/**
 * PUT /api/users/:id
 * Atualiza um usuário existente
 */
router.put('/:id',
  generalLimiter,
  requireRole(['admin', 'gerente']),
  validateRequest(updateUserSchema),
  userController.update
);

/**
 * PUT /api/users/:id/role
 * Altera o papel de um usuário
 */
router.put('/:id/role',
  generalLimiter,
  requireRole(['admin']),
  validateRequest(changeRoleSchema),
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
   validateRequest(resetPasswordSchema),
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