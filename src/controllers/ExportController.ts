import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { sendError } from '../utils/response';
import logger from '../config/logger';
import { exportService } from '../services/ExportService';

class ExportController {
  private static instance: ExportController;

  public async exportInspections(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { empresaId } = req.user!;
      
      if (!empresaId) {
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }
      
      const query = req.query;
      const filePath = await exportService.exportInspections(empresaId, query);
      res.download(filePath);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as Error & {statusCode: number}).statusCode : 500;
      logger.error(`Erro ao exportar vistorias: ${errorMessage}`);
      sendError(res, errorMessage, statusCode);
    }
  }

  public async exportProperties(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { empresaId } = req.user!;
      
      if (!empresaId) {
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }
      
      const query = req.query;
      const filePath = await exportService.exportProperties(empresaId, query);
      res.download(filePath);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as Error & {statusCode: number}).statusCode : 500;
      logger.error(`Erro ao exportar imóveis: ${errorMessage}`);
      sendError(res, errorMessage, statusCode);
    }
  }

  public async exportUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { empresaId } = req.user!;
      
      if (!empresaId) {
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }
      
      const query = req.query;
      const filePath = await exportService.exportUsers(empresaId, query);
      res.download(filePath);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as Error & {statusCode: number}).statusCode : 500;
      logger.error(`Erro ao exportar usuários: ${errorMessage}`);
      sendError(res, errorMessage, statusCode);
    }
  }
  public static getInstance(): ExportController {
    if (!ExportController.instance) {
      ExportController.instance = new ExportController();
    }
    return ExportController.instance;
  }
}

export { ExportController };
export const exportController = ExportController.getInstance();