import { Request, Response, NextFunction } from 'express';
import { InspectionService, CreateInspectionData, UpdateInspectionData, InspectionFilters } from '../services/InspectionService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middlewares/auth';
import logger from '../config/logger';
import { CustomError, createValidationError, createForbiddenError } from '../middlewares/errorHandler';

export class InspectionController {
  private inspectionService: InspectionService;

  constructor() {
    this.inspectionService = new InspectionService();
  }

  /**
   * Criar nova vistoria
   */
  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid } = req.user!;
      const data: CreateInspectionData = req.body;

      // Garantir que a vistoria seja criada para a empresa do usuário
      data.empresaId = empresaId;
      data.vistoriadorId = data.vistoriadorId || uid;

      const inspection = await this.inspectionService.createInspection(data);
      
      logger.info(`Vistoria criada:`, { id: inspection.id, empresaId, createdBy: uid });
      
      return sendSuccess(res, inspection, 'Vistoria criada com sucesso', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar vistoria por ID
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId } = req.user!;
      const { id } = req.params;

      const inspection = await this.inspectionService.getInspectionById(id, empresaId);
      
      return sendSuccess(res, inspection, 'Vistoria encontrada');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Listar vistorias com filtros
   */
  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const {
        vistoriadorId,
        status,
        tipo,
        imovelId,
        dataInicio,
        dataFim,
        limit = '20',
        offset = '0'
      } = req.query;

      const filters: InspectionFilters = {
        empresaId,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      // Se não é admin, só pode ver suas próprias vistorias
      if (papel !== 'admin') {
        filters.vistoriadorId = uid;
      } else if (vistoriadorId) {
        filters.vistoriadorId = vistoriadorId as string;
      }

      if (status) filters.status = status as any;
      if (tipo) filters.tipo = tipo as any;
      if (imovelId) filters.imovelId = imovelId as string;
      if (dataInicio) filters.dataInicio = new Date(dataInicio as string);
      if (dataFim) filters.dataFim = new Date(dataFim as string);

      const inspections = await this.inspectionService.listInspections(filters);
      
      return sendSuccess(res, inspections, 'Vistorias listadas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Atualizar vistoria
   */
  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;
      const data: UpdateInspectionData = req.body;

      // Verificar se o usuário pode editar esta vistoria
      const existingInspection = await this.inspectionService.getInspectionById(id, empresaId);
      
      if (papel !== 'admin' && existingInspection.vistoriadorId !== uid) {
        throw createForbiddenError('Você só pode editar suas próprias vistorias');
      }

      const inspection = await this.inspectionService.updateInspection(id, data, empresaId);
      
      logger.info(`Vistoria atualizada:`, { id, empresaId, updatedBy: uid });
      
      return sendSuccess(res, inspection, 'Vistoria atualizada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Adicionar foto à vistoria
   */
  addPhoto = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;
      const { url, comentario, categoria } = req.body;

      if (!url) {
        throw createValidationError('URL da foto é obrigatória');
      }

      // Verificar se o usuário pode editar esta vistoria
      const existingInspection = await this.inspectionService.getInspectionById(id, empresaId);
      
      if (papel !== 'admin' && existingInspection.vistoriadorId !== uid) {
        throw createForbiddenError('Você só pode adicionar fotos às suas próprias vistorias');
      }

      const photoData = {
        url,
        comentario,
        categoria: categoria || 'geral',
        uploadedBy: uid,
        uploadedAt: new Date()
      };

      const inspection = await this.inspectionService.addPhoto(id, photoData, empresaId);
      
      logger.info(`Foto adicionada à vistoria:`, { vistoriaId: id, empresaId, uploadedBy: uid });
      
      return sendSuccess(res, inspection, 'Foto adicionada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remover foto da vistoria
   */
  removePhoto = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id, photoId } = req.params;

      // Verificar se o usuário pode editar esta vistoria
      const existingInspection = await this.inspectionService.getInspectionById(id, empresaId);
      
      if (papel !== 'admin' && existingInspection.vistoriadorId !== uid) {
        throw createForbiddenError('Você só pode remover fotos das suas próprias vistorias');
      }

      const inspection = await this.inspectionService.removePhoto(id, photoId, empresaId);
      
      logger.info(`Foto removida da vistoria:`, { vistoriaId: id, photoId, empresaId, removedBy: uid });
      
      return sendSuccess(res, inspection, 'Foto removida com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Adicionar contestação
   */
  addContestation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid } = req.user!;
      const { id } = req.params;
      const { motivo, descricao } = req.body;

      if (!motivo || !descricao) {
        throw createValidationError('Motivo e descrição são obrigatórios');
      }

      const contestationData = {
        motivo,
        descricao,
        contestadoPor: uid,
        dataContestacao: new Date(),
        status: 'pendente' as const
      };

      const inspection = await this.inspectionService.addContestation(id, contestationData, empresaId);
      
      logger.info(`Contestação adicionada à vistoria:`, { vistoriaId: id, empresaId, contestadoPor: uid });
      
      return sendSuccess(res, inspection, 'Contestação enviada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletar vistoria (soft delete)
   */
  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;

      // Verificar se o usuário pode deletar esta vistoria
      const existingInspection = await this.inspectionService.getInspectionById(id, empresaId);
      
      if (papel !== 'admin' && existingInspection.vistoriadorId !== uid) {
        throw createForbiddenError('Você só pode deletar suas próprias vistorias');
      }

      await this.inspectionService.deleteInspection(id, empresaId);
      
      logger.info(`Vistoria deletada:`, { id, empresaId, deletedBy: uid });
      
      return sendSuccess(res, null, 'Vistoria deletada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar vistorias por vistoriador
   */
  getByVistoriador = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { vistoriadorId } = req.params;
      const { limit = '20', offset = '0' } = req.query;

      // Se não é admin, só pode ver suas próprias vistorias
      const targetVistoriadorId = papel === 'admin' ? vistoriadorId : uid;

      const inspections = await this.inspectionService.getInspectionsByVistoriador(
        targetVistoriadorId,
        empresaId,
        {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      );
      
      return sendSuccess(res, inspections, 'Vistorias do vistoriador listadas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar vistorias por imóvel
   */
  getByImovel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId } = req.user!;
      const { imovelId } = req.params;
      const { limit = '20', offset = '0' } = req.query;

      const inspections = await this.inspectionService.getInspectionsByImovel(
        imovelId,
        empresaId,
        {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      );
      
      return sendSuccess(res, inspections, 'Vistorias do imóvel listadas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obter estatísticas de vistorias
   */
  getStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { vistoriadorId } = req.query;

      // Se não é admin, só pode ver suas próprias estatísticas
      const targetVistoriadorId = papel === 'admin' && vistoriadorId ? vistoriadorId as string : uid;

      const stats = await this.inspectionService.getInspectionStats(empresaId, targetVistoriadorId);
      
      return sendSuccess(res, stats, 'Estatísticas obtidas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Atualizar status da vistoria
   */
  updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        throw createValidationError('Status é obrigatório');
      }

      // Verificar se o usuário pode editar esta vistoria
      const existingInspection = await this.inspectionService.getInspectionById(id, empresaId);
      
      if (papel !== 'admin' && existingInspection.vistoriadorId !== uid) {
        throw createForbiddenError('Você só pode alterar o status das suas próprias vistorias');
      }

      const inspection = await this.inspectionService.updateInspection(
        id,
        { status },
        empresaId
      );
      
      logger.info(`Status da vistoria atualizado:`, { id, status, empresaId, updatedBy: uid });
      
      return sendSuccess(res, inspection, 'Status atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  };
}