import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';
import { contestationService } from '../services/ContestationService';

class ContestationController {
  private static instance: ContestationController;

  public async create(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      
      if (!empresaId) {
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }
      
      const contestation = await contestationService.create({ ...req.body, empresaId });
      return sendSuccess(res, contestation, 'Contestação registrada com sucesso');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as Error & {statusCode: number}).statusCode : 500;
      logger.error(`Erro ao criar contestação: ${errorMessage}`);
      return sendError(res, errorMessage, statusCode);
    }
  }

  public async list(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      
      if (!empresaId) {
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }
      
      const contestations = await contestationService.list(empresaId, req.query);
      return sendSuccess(res, contestations);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as Error & {statusCode: number}).statusCode : 500;
      logger.error(`Erro ao listar contestações: ${errorMessage}`);
      return sendError(res, errorMessage, statusCode);
    }
  }

  public async getById(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;
      
      if (!empresaId) {
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }
      
      const contestation = await contestationService.getById(id, empresaId);
      return sendSuccess(res, contestation);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as Error & {statusCode: number}).statusCode : 500;
      logger.error(`Erro ao buscar contestação: ${errorMessage}`);
      return sendError(res, errorMessage, statusCode);
    }
  }

  public async updateStatus(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;
      
      if (!empresaId) {
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }
      
      const { status, resposta } = req.body;
      const contestation = await contestationService.updateStatus(id, empresaId, status, resposta);
      return sendSuccess(res, contestation, 'Status da contestação atualizado com sucesso');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as Error & {statusCode: number}).statusCode : 500;
      logger.error(`Erro ao atualizar status da contestação: ${errorMessage}`);
      return sendError(res, errorMessage, statusCode);
    }
  }

  public async getStats(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      
      if (!empresaId) {
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }
      
      const stats = await contestationService.getStats(empresaId);
      return sendSuccess(res, stats);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as Error & {statusCode: number}).statusCode : 500;
      logger.error(`Erro ao buscar estatísticas de contestações: ${errorMessage}`);
      return sendError(res, errorMessage, statusCode);
    }
  }
  public static getInstance(): ContestationController {
    if (!ContestationController.instance) {
      ContestationController.instance = new ContestationController();
    }
    return ContestationController.instance;
  }
}

export { ContestationController };
export const contestationController = ContestationController.getInstance();