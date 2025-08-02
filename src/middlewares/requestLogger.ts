import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import { AuthenticatedRequest } from './auth';

/**
 * Middleware para logging de requisições
 */
export const requestLogger = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const userId = req.user?.uid || 'Anonymous';
  const empresaId = req.user?.empresaId || 'N/A';

  // Log da requisição inicial
  logger.info('Incoming request', {
    method,
    url,
    ip,
    userAgent,
    userId,
    empresaId,
    timestamp: new Date().toISOString()
  });

  // Interceptar a resposta para log do resultado
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    // Log da resposta
    logger.info('Request completed', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      userId,
      empresaId,
      responseSize: Buffer.byteLength(body, 'utf8')
    });

    // Log de erro se status >= 400
    if (statusCode >= 400) {
      logger.warn('Request error', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        userId,
        empresaId,
        error: body
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Middleware para logging de requisições sensíveis (auth, uploads, etc.)
 */
export const sensitiveRequestLogger = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const userId = req.user?.uid || 'Anonymous';
  const empresaId = req.user?.empresaId || 'N/A';

  // Log mais detalhado para operações sensíveis
  logger.info('Sensitive operation', {
    method,
    url,
    ip,
    userAgent,
    userId,
    empresaId,
    headers: {
      'content-type': req.get('Content-Type'),
      'content-length': req.get('Content-Length')
    },
    timestamp: new Date().toISOString()
  });

  // Interceptar a resposta
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    logger.info('Sensitive operation completed', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      userId,
      empresaId,
      success: statusCode < 400
    });

    return originalSend.call(this, body);
  };

  next();
};

/**
 * Middleware para skip de logging em rotas específicas
 */
export const skipLogging = (paths: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (paths.some(path => req.url.includes(path))) {
      return next();
    }
    return requestLogger(req as AuthenticatedRequest, res, next);
  };
};