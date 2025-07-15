import { Request as ExpressRequest, Response, NextFunction } from 'express';
import logger from '../config/logger';

// Extend the Express Request interface to include user property
interface Request extends ExpressRequest {
  user?: { 
    uid: string;
    email: string;
    name: string;
  };
}

/**
 * Middleware de autenticação para desenvolvimento
 * Permite usar tokens mock para facilitar testes
 */
export const devAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  // Se estiver em desenvolvimento e usar o token de dev
  if (process.env.NODE_ENV === 'development') {
    // Token de desenvolvimento
    if (token === process.env.DEV_TOKEN || token === 'dev-token-123') {
      req.user = {
        uid: '4YDC4naAFnWituMELMef0Sd',
        email: 'test@grifo.com',
        name: 'Usuário de Teste'
      };
      logger.info('🧪 Usando token de desenvolvimento para testes');
      return next();
    }
    
    // Se BYPASS_AUTH estiver habilitado, pular autenticação
    if (process.env.BYPASS_AUTH === 'true') {
      req.user = {
        uid: '4YDC4naAFnWituMELMef0Sd',
        email: 'test@grifo.com',
        name: 'Usuário de Teste (Bypass)'
      };
      logger.info('🔓 Autenticação bypassed para desenvolvimento');
      return next();
    }
  }
  
  // Se não for desenvolvimento ou não tiver token válido
  if (!token) {
    return res.status(401).json({
      error: 'Token de autorização necessário',
      message: 'Para desenvolvimento, use: Bearer dev-token-123'
    });
  }
  
  // Aqui você pode adicionar a validação real do Firebase se necessário
  // Por enquanto, vamos rejeitar tokens não reconhecidos
  return res.status(401).json({
    error: 'Token inválido',
    message: 'Para desenvolvimento, use: Bearer dev-token-123'
  });
};

/**
 * Middleware simplificado que sempre permite acesso em desenvolvimento
 */
export const simpleDevAuth = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      uid: '4YDC4naAFnWituMELMef0Sd',
      email: 'test@grifo.com',
      name: 'Usuário de Desenvolvimento'
    };
    return next();
  }
  
  // Em produção, você deve usar a autenticação real do Firebase
  return res.status(401).json({
    error: 'Autenticação necessária',
    message: 'Configure a autenticação do Firebase para produção'
  });
};