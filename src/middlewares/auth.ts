import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import logger from '../config/logger';
import { sendError } from '../utils/response';
import { isFirebaseInitialized } from '../config/firebase';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    empresaId?: string;
    papel?: string;
    claims?: Record<string, unknown>;
  };
}

/**
 * Middleware para verificar token Firebase
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Token não fornecido');
      return sendError(res, 'Token de acesso requerido', 401);
    }

    // Verificar se o Firebase foi inicializado
    if (!isFirebaseInitialized()) {
      logger.error('Firebase não inicializado - configuração obrigatória para produção');
      return res.status(500).json({
        success: false,
        error: 'Serviço de autenticação indisponível'
      });
    }

    // Verificar token com Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Extrair claims customizados do token
    const empresaId = decodedToken.empresaId || decodedToken.custom_claims?.empresaId;
    const papel = decodedToken.papel || decodedToken.custom_claims?.papel || 'leitor';
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      empresaId,
      papel,
      claims: decodedToken
    };

    logger.info(`Usuário autenticado: ${decodedToken.uid} - Empresa: ${empresaId}`);
    next();
  } catch (error) {
    logger.error('Erro na autenticação:', error);
    return sendError(res, 'Token inválido', 401);
  }
};

/**
 * Middleware para verificar se o usuário tem empresaId
 */
export const requireEmpresa = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.empresaId) {
    logger.warn(`Usuário ${req.user?.uid} sem empresaId`);
    return sendError(res, 'Usuário deve estar associado a uma empresa', 403);
  }
  next();
};

/**
 * Middleware para verificar papel do usuário
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user?.papel || !roles.includes(req.user.papel)) {
      logger.warn(`Usuário ${req.user?.uid} sem permissão. Papel: ${req.user?.papel}`);
      return sendError(res, 'Permissão insuficiente', 403);
    }
    next();
  };
};

/**
 * Middleware para verificar se é admin
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Middleware para verificar se é admin ou gerente
 */
export const requireManager = requireRole(['admin', 'gerente']);