import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import logger from '../config/logger';
import { sendError } from '../utils/response';

/**
 * Rate limiter geral para todas as rotas
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP por janela
  message: {
    success: false,
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit excedido para IP: ${req.ip}`);
    return sendError(res, 'Muitas requisições. Tente novamente em 15 minutos.', 429);
  }
});

/**
 * Rate limiter para rotas de autenticação
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP por janela
  message: {
    success: false,
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit de auth excedido para IP: ${req.ip}`);
    return sendError(res, 'Muitas tentativas de login. Tente novamente em 15 minutos.', 429);
  }
});

/**
 * Rate limiter para uploads
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 uploads por IP por minuto
  message: {
    success: false,
    error: 'Muitos uploads. Tente novamente em 1 minuto.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit de upload excedido para IP: ${req.ip}`);
    return sendError(res, 'Muitos uploads. Tente novamente em 1 minuto.', 429);
  }
});

/**
 * Rate limiter para criação de recursos
 */
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // máximo 20 criações por IP por minuto
  message: {
    success: false,
    error: 'Muitas criações. Tente novamente em 1 minuto.',
    data: null
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.warn(`Rate limit de criação excedido para IP: ${req.ip}`);
    return sendError(res, 'Muitas criações. Tente novamente em 1 minuto.', 429);
  }
});