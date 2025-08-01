import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './verifyFirebaseToken';

export const requireEmpresa = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.empresaId) {
    return res.status(403).json({ 
      success: false,
      error: 'Usuário sem empresa associada' 
    });
  }
  next();
};