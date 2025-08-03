import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export * from './common.schema';
export * from './inspections';
export * from './properties';
export * from './users';
export * from './contestations';
export * from './sync';













// Middleware para validar requisições
export const validateRequest = ({
  body,
  query,
  params
}: {
  body?: z.ZodType<unknown>;
  query?: z.ZodType<unknown>;
  params?: z.ZodType<unknown>;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar corpo da requisição se schema fornecido
      if (body) {
        const validatedBody = body.parse(req.body);
        req.body = validatedBody;
      }
      
      // Validar parâmetros de consulta se schema fornecido
      if (query) {
        const validatedQuery = query.parse(req.query);
        req.query = validatedQuery as typeof req.query;
      }
      
      // Validar parâmetros de rota se schema fornecido
      if (params) {
        const validatedParams = params.parse(req.params);
        req.params = validatedParams as typeof req.params;
      }
      
      next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError;
        logger.warn(`Validação falhou: ${JSON.stringify(zodError.errors)}`);
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: zodError.errors.map((e: z.ZodIssue) => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      logger.error(`Erro de validação: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor durante validação'
      });
    }
  };
};