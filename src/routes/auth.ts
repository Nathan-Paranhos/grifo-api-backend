import { Router } from 'express';
import { authController } from '../controllers';
import { authenticateToken } from '../middlewares/auth';
import { authLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../validators';
import { z } from 'zod';

const router = Router();

// Schemas de validação
const verifyTokenSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório')
});

const passwordResetSchema = z.object({
  email: z.string().email('Email inválido')
});

const loginSchema = z.object({
  firebaseToken: z.string().min(1, 'Token Firebase é obrigatório')
});

const updateAuthSettingsSchema = z.object({
  configuracoes: z.object({
    notificacoes: z.boolean().optional(),
    tema: z.enum(['light', 'dark']).optional(),
    idioma: z.string().optional()
  })
});

// Rotas públicas (sem autenticação)
router.post('/verify-token',
  authLimiter,
  validateRequest({ body: verifyTokenSchema }),
  authController.verifyToken
);

router.post('/login',
  authLimiter,
  validateRequest({ body: loginSchema }),
  authController.verifyToken
);

router.post('/reset-password',
  authLimiter,
  validateRequest({ body: passwordResetSchema }),
  authController.requestPasswordReset
);

// Rotas protegidas (com autenticação)
router.get('/me',
  authenticateToken,
  authController.getMe
);

router.post('/refresh',
  authenticateToken,
  authController.refreshToken
);

router.post('/logout',
  authenticateToken,
  authController.logout
);

router.get('/validate-session',
  authenticateToken,
  authController.validateSession
);

router.get('/check-permission',
  authenticateToken,
  authController.checkPermission
);

router.get('/company-info',
  authenticateToken,
  authController.getCompanyInfo
);

router.patch('/settings',
  authenticateToken,
  validateRequest({ body: updateAuthSettingsSchema }),
  authController.updateAuthSettings
);

export default router;