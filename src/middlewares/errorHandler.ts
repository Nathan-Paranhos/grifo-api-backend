import { Request, Response } from 'express';
import logger from '../config/logger';
import { sendError } from '../utils/response';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Middleware global de tratamento de erros
 */
export const errorHandler = (
  error: Error | CustomError,
  req: Request,
  res: Response
) => {
  let statusCode = (error as CustomError).statusCode || 500;
  let message = error.message;

  // Log do erro
  logger.error('Error Handler:', {
    error: message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Erros específicos do Firebase
  if (error.message.includes('auth/')) {
    statusCode = 401;
    message = 'Erro de autenticação';
  }

  // Erros de validação
  if (error.message.includes('validation')) {
    statusCode = 400;
  }

  // Erros do Firestore
  if (error.message.includes('firestore')) {
    statusCode = 500;
    message = 'Erro interno do servidor';
  }

  // Em produção, não expor detalhes internos
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Erro interno do servidor';
  }

  return sendError(res, message, statusCode);
};

/**
 * Middleware para capturar rotas não encontradas
 */
export const notFoundHandler = (req: Request, res: Response) => {
  logger.warn(`Rota não encontrada: ${req.method} ${req.url}`);
  return sendError(res, `Rota ${req.url} não encontrada`, 404);
};

/**
 * Classe para criar erros customizados
 */
export class CustomError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Função helper para criar erros de validação
 */
export const createValidationError = (message: string) => {
  return new CustomError(message, 400);
};

/**
 * Função helper para criar erros de autorização
 */
export const createAuthError = (message: string = 'Não autorizado') => {
  return new CustomError(message, 401);
};

/**
 * Função helper para criar erros de permissão
 */
export const createForbiddenError = (message: string = 'Acesso negado') => {
  return new CustomError(message, 403);
};

/**
 * Função helper para criar erros de não encontrado
 */
export const createNotFoundError = (message: string = 'Recurso não encontrado') => {
  return new CustomError(message, 404);
};