import { Router, Response } from 'express';
const { body, validationResult } = require('express-validator');
import { generateTokenPair, verifyRefreshToken, generateJWT, authenticateToken, Request } from '../config/security';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';
import * as admin from 'firebase-admin';



const router = Router();

/**
 * POST /api/auth/login
 * Endpoint para login com Firebase e geração de JWT
 */
router.post('/login',
  [
    body('firebaseToken').notEmpty().withMessage('Token Firebase é obrigatório'),
    body('empresaId').optional().isString().withMessage('ID da empresa deve ser uma string')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 'Dados de entrada inválidos', 400);
      }

      const { firebaseToken, empresaId } = req.body;

      // Verificar token Firebase
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      
      if (!decodedToken) {
        return sendError(res, 'Token Firebase inválido', 401);
      }

      // Buscar dados adicionais do usuário no Firebase
      const userRecord = await admin.auth().getUser(decodedToken.uid);
      
      // Determinar role (pode ser customizado conforme sua lógica)
      const role = userRecord.customClaims?.role || 'user';
      const userEmpresaId = userRecord.customClaims?.empresaId || empresaId || 'default';

      // Gerar par de tokens JWT
      const tokens = generateTokenPair({
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: role,
        empresaId: userEmpresaId
      });

      logger.info(`Login realizado com sucesso para usuário ${decodedToken.uid}`);

      return sendSuccess(res, {
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: role,
          empresaId: userEmpresaId
        },
        tokens
      }, 200, { message: 'Login realizado com sucesso' });

    } catch (error: any) {
      logger.error('Erro durante login:', error);
      
      if (error.code === 'auth/id-token-expired') {
        return sendError(res, 'Token Firebase expirado', 401);
      }
      
      if (error.code === 'auth/id-token-revoked') {
        return sendError(res, 'Token Firebase revogado', 401);
      }

      return sendError(res, 'Erro interno do servidor durante login', 500);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Endpoint para renovar token usando refresh token
 */
router.post('/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token é obrigatório')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return sendError(res, 'Dados de entrada inválidos', 400);
      }

      const { refreshToken } = req.body;

      // Verificar refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return sendError(res, 'Refresh token inválido ou expirado', 401);
      }

      // Buscar dados do usuário no Firebase
      const userRecord = await admin.auth().getUser(decoded.uid);
      
      const role = userRecord.customClaims?.role || 'user';
      const empresaId = userRecord.customClaims?.empresaId || 'default';

      // Gerar novo par de tokens
      const tokens = generateTokenPair({
        uid: decoded.uid,
        email: userRecord.email,
        role: role,
        empresaId: empresaId
      });

      logger.info(`Token renovado com sucesso para usuário ${decoded.uid}`);

      return sendSuccess(res, { tokens }, 200, { message: 'Token renovado com sucesso' });

    } catch (error: any) {
      logger.error('Erro durante renovação de token:', error);
      return sendError(res, 'Erro interno do servidor durante renovação', 500);
    }
  }
);

/**
 * POST /api/auth/logout
 * Endpoint para logout (invalidar tokens)
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Em uma implementação completa, você manteria uma blacklist de tokens
    // Por enquanto, apenas retornamos sucesso
    
    logger.info('Logout realizado');
    return sendSuccess(res, {}, 200, { message: 'Logout realizado com sucesso' });

  } catch (error: any) {
    logger.error('Erro durante logout:', error);
    return sendError(res, 'Erro interno do servidor durante logout', 500);
  }
});

/**
 * GET /api/auth/me
 * Endpoint para obter informações do usuário autenticado
 */
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    // O middleware de autenticação já anexou os dados do usuário
    const user = req.user;
    
    if (!user) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    return sendSuccess(res, {
      user: {
        id: user.id,
        role: user.role,
        empresaId: user.empresaId
      }
    }, 200, { message: 'Dados do usuário obtidos com sucesso' });

  } catch (error: any) {
    logger.error('Erro ao obter dados do usuário:', error);
    return sendError(res, 'Erro interno do servidor', 500);
  }
});

/**
 * GET /api/auth/validate
 * Endpoint para validar se o token atual é válido
 */
router.get('/validate', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Se chegou até aqui, o token é válido (passou pelo middleware)
    return sendSuccess(res, {
      valid: true,
      user: req.user
    }, 200, { message: 'Token válido' });

  } catch (error: any) {
    logger.error('Erro durante validação:', error);
    return sendError(res, 'Erro interno do servidor', 500);
  }
});

export default router;