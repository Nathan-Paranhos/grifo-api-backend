import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { propertyService } from '../services';
import { sendSuccess, sendError } from '../utils/response';

class PropertyController {
  private static instance: PropertyController;

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const { search, limit } = req.query;
      const empresaId = req.user?.empresaId as string;
      const properties = await propertyService.list({ 
        empresaId,
        search: search as string,
        limit: limit ? parseInt(limit as string) : 10
      });
      sendSuccess(res, properties.data, undefined, 200);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as { statusCode: number }).statusCode : 500;
      sendError(res, errorMessage, statusCode);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const empresaId = req.user?.empresaId as string;
      const property = await propertyService.getById(id, empresaId);
      sendSuccess(res, property, undefined, 200);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as { statusCode: number }).statusCode : 500;
      sendError(res, errorMessage, statusCode);
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const empresaId = req.user?.empresaId as string;
      const property = await propertyService.create(req.body, empresaId);
      sendSuccess(res, property, undefined, 201);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as { statusCode: number }).statusCode : 500;
      sendError(res, errorMessage, statusCode);
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const empresaId = req.user?.empresaId as string;
      const property = await propertyService.update(id, req.body, empresaId);
      sendSuccess(res, property);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as { statusCode: number }).statusCode : 500;
      sendError(res, errorMessage, statusCode);
    }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const empresaId = req.user?.empresaId as string;
      await propertyService.remove(id, empresaId);
      sendSuccess(res, { message: 'Propriedade removida com sucesso' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      const statusCode = error instanceof Error && 'statusCode' in error ? (error as { statusCode: number }).statusCode : 500;
      sendError(res, errorMessage, statusCode);
    }
  }
  public static getInstance(): PropertyController {
    if (!PropertyController.instance) {
      PropertyController.instance = new PropertyController();
    }
    return PropertyController.instance;
  }
}

export { PropertyController };
export const propertyController = PropertyController.getInstance();