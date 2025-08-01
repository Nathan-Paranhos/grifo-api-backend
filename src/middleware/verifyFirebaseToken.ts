import { Request, Response, NextFunction } from 'express';
import { admin } from '../config/firebase';
import logger from '../config/logger';

// Extend the Express Request interface to include user property
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    empresaId?: string;
    role?: string;
    [key: string]: any;
  };
}

export const verifyFirebaseToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      error: 'Token de autenticação ausente' 
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    if (!decodedToken.empresaId) {
      return res.status(403).json({ 
        success: false,
        error: 'Usuário sem empresa associada' 
      });
    }

    logger.debug(`Token verificado para usuário: ${decodedToken.uid}, empresa: ${decodedToken.empresaId}`);
    next();
  } catch (error: any) {
    logger.error('Erro ao verificar token Firebase:', error.message);
    return res.status(403).json({ 
      success: false,
      error: 'Token inválido ou expirado' 
    });
  }
};