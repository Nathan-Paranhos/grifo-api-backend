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

/**
 * Função helper para criar erros de conflito
 */
export const createConflictError = (message: string = 'Conflito de dados') => {
  return new CustomError(message, 409);
};

/**
 * Função helper para criar erros de servidor
 */
export const createServerError = (message: string = 'Erro interno do servidor') => {
  return new CustomError(message, 500);
};