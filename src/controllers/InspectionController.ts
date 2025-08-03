import { Response, NextFunction } from 'express';
import { InspectionService, CreateInspectionData, UpdateInspectionData, InspectionFilters } from '../services/InspectionService';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middlewares/auth';
import logger from '../config/logger';
import { createForbiddenError } from '../middlewares/errorHandler';
import { listInspectionsQuerySchema } from '../validators/inspections/listInspections.schema';
import { addPhotoSchema } from '../validators/inspections/addPhoto.schema';
import { addContestationSchema } from '../validators/inspections/addContestation.schema';
import { paginationSchema } from '../validators/common.schema';



export class InspectionController {
  private static instance: InspectionController;

  private inspectionService: InspectionService | null = null;

  private getInspectionService(): InspectionService {
    if (!this.inspectionService) {
      this.inspectionService = new InspectionService();
    }
    return this.inspectionService;
  }

  /**
   * Criar nova vistoria
   */
  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid } = req.user!;
      const data: CreateInspectionData = req.body;

      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }

      data.vistoriadorId = data.vistoriadorId || uid;

      const inspection = await this.getInspectionService().createInspection(empresaId, data);
      
      logger.info(`Vistoria criada:`, { id: inspection.id, empresaId, createdBy: uid });
      
      return sendSuccess(res, inspection, 'Vistoria criada com sucesso', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar vistoria por ID
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;
      
      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }
      
      if (!id) {
        throw new Error('ID da vistoria é obrigatório');
      }

      const inspection = await this.getInspectionService().getInspectionById(id, empresaId);
      
      return sendSuccess(res, inspection, 'Vistoria encontrada');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Listar vistorias com filtros
   */
  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      
      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }
      
      const queryParams = listInspectionsQuerySchema.parse(req.query);

      const filters: InspectionFilters = {
        ...queryParams,
      };

      // Se não é admin, só pode ver suas próprias vistorias
      if (papel !== 'admin') {
        filters.vistoriadorId = uid;
      } 

      const inspections = await this.getInspectionService().listInspections(empresaId, filters);
      
      return sendSuccess(res, inspections, 'Vistorias listadas com sucesso');
    } catch (error) {
      next(error);
    }
  };



  /**
   * Atualizar vistoria
   */
  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;
      const data: UpdateInspectionData = req.body;
      
      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }
      
      if (!id) {
        throw new Error('ID da vistoria é obrigatório');
      }

      // Verificar se o usuário pode editar esta vistoria
      const existingInspection = await this.getInspectionService().getInspectionById(id, empresaId);
      
      if (papel !== 'admin' && existingInspection.vistoriadorId !== uid) {
        throw createForbiddenError('Você só pode editar suas próprias vistorias');
      }

      const inspection = await this.getInspectionService().updateInspection(id, empresaId, data);
      
      logger.info(`Vistoria atualizada:`, { id, empresaId, updatedBy: uid });
      
      return sendSuccess(res, inspection, 'Vistoria atualizada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Adicionar foto à vistoria
   */
  addPhoto = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;
      
      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }
      
      if (!id) {
        throw new Error('ID da vistoria é obrigatório');
      }
      
      const validatedData = addPhotoSchema.parse({ body: req.body });
      const { url, comentario, categoria } = validatedData.body;

      // Verificar se o usuário pode editar esta vistoria
      const existingInspection = await this.getInspectionService().getInspectionById(id, empresaId);
      
      if (papel !== 'admin' && existingInspection.vistoriadorId !== uid) {
        throw createForbiddenError('Você só pode adicionar fotos às suas próprias vistorias');
      }

      const photoData = {
        url,
        descricao: comentario,
        categoria: categoria || 'geral',
      };

      const inspection = await this.getInspectionService().addPhoto(id, empresaId, photoData);
      
      logger.info(`Foto adicionada à vistoria:`, { vistoriaId: id, empresaId, uploadedBy: uid });
      
      return sendSuccess(res, inspection, 'Foto adicionada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remover foto da vistoria
   */
  removePhoto = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id, photoId } = req.params;
      
      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }
      
      if (!id) {
        throw new Error('ID da vistoria é obrigatório');
      }
      
      if (!photoId) {
        throw new Error('ID da foto é obrigatório');
      }

      // Verificar se o usuário pode editar esta vistoria
      const existingInspection = await this.getInspectionService().getInspectionById(id, empresaId);
      
      if (papel !== 'admin' && existingInspection.vistoriadorId !== uid) {
        throw createForbiddenError('Você só pode remover fotos das suas próprias vistorias');
      }

      const inspection = await this.getInspectionService().removePhoto(id, empresaId, photoId);
      
      logger.info(`Foto removida da vistoria:`, { vistoriaId: id, photoId, empresaId, removedBy: uid });
      
      return sendSuccess(res, inspection, 'Foto removida com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Adicionar contestação
   */
  addContestation = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { empresaId, uid } = req.user!;
      const { id } = req.params;
      
      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }
      
      if (!id) {
        throw new Error('ID da vistoria é obrigatório');
      }
      
      const validatedData = addContestationSchema.parse({ body: req.body });
      const { motivo, descricao } = validatedData.body;

      const contestationData: { motivo: string; detalhes: string; } = {
        motivo,
        detalhes: descricao,
      };

      const inspection = await this.getInspectionService().addContestation(id, empresaId, contestationData);
      
      logger.info(`Contestação adicionada à vistoria:`, { vistoriaId: id, empresaId, contestadoPor: uid });
      
      return sendSuccess(res, inspection, 'Contestação enviada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletar vistoria (soft delete)
   */
  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;

      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }

      if (!id) {
        throw new Error('ID da vistoria é obrigatório');
      }

      // Verificar se o usuário pode deletar esta vistoria
      const existingInspection = await this.getInspectionService().getInspectionById(id, empresaId);
      
      if (papel !== 'admin' && existingInspection.vistoriadorId !== uid) {
        throw createForbiddenError('Você só pode deletar suas próprias vistorias');
      }

      await this.getInspectionService().deleteInspection(id, empresaId);
      
      logger.info(`Vistoria deletada:`, { id, empresaId, deletedBy: uid });
      
      return sendSuccess(res, null, 'Vistoria deletada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar vistorias por vistoriador
   */
  getByVistoriador = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { vistoriadorId } = req.params;
      const { limit, offset } = paginationSchema.parse(req.query as { limit: string; offset: string });

      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }

      // Se não é admin, só pode ver suas próprias vistorias
      const targetVistoriadorId = papel === 'admin' ? vistoriadorId : uid;

      const inspections = await this.getInspectionService().getInspectionsByVistoriador(
        empresaId,
        targetVistoriadorId,
        { limit, offset }
      );
      
      return sendSuccess(res, inspections, 'Vistorias do vistoriador listadas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar vistorias por imóvel
   */
  getByImovel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { empresaId } = req.user!;
      const { imovelId } = req.params;
      const { limit, offset } = paginationSchema.parse(req.query as { limit: string; offset: string });

      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }

      const inspections = await this.getInspectionService().getInspectionsByImovel(
        empresaId,
        imovelId,
        { limit, offset }
      );
      
      return sendSuccess(res, inspections, 'Vistorias do imóvel listadas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obter estatísticas de vistorias
   */
  getStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { vistoriadorId } = req.query;

      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }

      // Se não é admin, só pode ver suas próprias estatísticas
      const targetVistoriadorId = papel === 'admin' && vistoriadorId ? vistoriadorId as string : uid;

      const stats = await this.getInspectionService().getStats(empresaId);
      
      return sendSuccess(res, stats, 'Estatísticas obtidas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Atualizar status da vistoria
   */
  updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;
      const { status } = req.body as { status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada' };

      if (!id) {
        throw new Error('ID da vistoria é obrigatório');
      }

      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }

      const inspectionId = id as string;

      // Verificar se o usuário pode editar esta vistoria
      const existingInspection = await this.getInspectionService().getInspectionById(inspectionId, empresaId);
      
      if (papel !== 'admin' && existingInspection.vistoriadorId !== uid) {
        throw createForbiddenError('Você só pode alterar o status das suas próprias vistorias');
      }

      const inspection = await this.getInspectionService().updateInspection(
        inspectionId,
        empresaId,
        { status }
      );
      
      logger.info(`Status da vistoria atualizado:`, { id, status, empresaId, updatedBy: uid });
      
      return sendSuccess(res, inspection, 'Status atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  public static getInstance(): InspectionController {
    if (!InspectionController.instance) {
      InspectionController.instance = new InspectionController();
    }
    return InspectionController.instance;
  }
}

export const inspectionController = InspectionController.getInstance();