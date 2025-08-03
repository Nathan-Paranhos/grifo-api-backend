import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';
import { dashboardService } from '../services/DashboardService';

class DashboardController {
  private static instance: DashboardController;

  public async getStats(req: AuthenticatedRequest, res: Response): Promise<Response | void> {
    try {
      const { empresaId } = req.user!;
      
      if (!empresaId) {
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }
      
      const { vistoriadorId } = req.query;
      const stats = await dashboardService.getStats(empresaId, vistoriadorId as string | undefined);
      return sendSuccess(res, stats);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as Error & {statusCode: number}).statusCode : 500;
      logger.error(`Erro ao obter estatísticas do dashboard: ${errorMessage}`);
      return sendError(res, errorMessage, statusCode);
    }
  }
  public static getInstance(): DashboardController {
    if (!DashboardController.instance) {
      DashboardController.instance = new DashboardController();
    }
    return DashboardController.instance;
  }
}

export { DashboardController };
export const dashboardController = DashboardController.getInstance();