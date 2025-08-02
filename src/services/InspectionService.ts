import { InspectionRepository, Inspection, InspectionFilters } from '../repositories/InspectionRepository';
export { InspectionFilters }; // Exportar para uso em outros módulos
import { CompanyRepository } from '../repositories/CompanyRepository';
import { QueryOptions } from '../repositories/BaseRepository';
import logger from '../config/logger';
import { CustomError, createNotFoundError, createValidationError } from '../middlewares/errorHandler';
import * as admin from 'firebase-admin';

export interface CreateInspectionData {
  vistoriadorId: string;
  imovelId: string;
  tipo: 'entrada' | 'saida' | 'manutencao';
  dataVistoria?: Date;
  observacoes?: string;
  imovel?: Inspection['imovel'];
}

export interface UpdateInspectionData {
  status?: Inspection['status'];
  observacoes?: string;
  dataVistoria?: Date;
  checklists?: Inspection['checklists'];
}

export class InspectionService {
  private inspectionRepository: InspectionRepository;
  private companyRepository: CompanyRepository;

  constructor() {
    this.inspectionRepository = new InspectionRepository();
    this.companyRepository = new CompanyRepository();
  }

  /**
   * Criar nova vistoria
   */
  async createInspection(
    empresaId: string,
    data: CreateInspectionData
  ): Promise<Inspection> {
    try {
      // Verificar se a empresa existe e está ativa
      const empresa = await this.companyRepository.findByIdDirect(empresaId);
      if (!empresa || empresa.status !== 'ativa') {
        throw createValidationError('Empresa não encontrada ou inativa');
      }

      // Verificar limites do plano
      if (empresa.plano) {
        const vistoriasCount = await this.inspectionRepository.count(empresaId);
        if (vistoriasCount >= empresa.plano.limiteVistorias) {
          throw createValidationError('Limite de vistorias do plano atingido');
        }
      }

      // Preparar dados da vistoria
      const inspectionData: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'> = {
        empresaId,
        vistoriadorId: data.vistoriadorId,
        imovelId: data.imovelId,
        tipo: data.tipo,
        status: 'pendente',
        dataVistoria: data.dataVistoria ? admin.firestore.Timestamp.fromDate(data.dataVistoria) : undefined,
        observacoes: data.observacoes,
        imovel: data.imovel,
        fotos: [],
        checklists: [],
        contestacoes: [],
        ativo: true
      };

      const inspection = await this.inspectionRepository.create(inspectionData);
      
      // Incrementar contador de vistorias da empresa
      await this.companyRepository.incrementVistorias(empresaId);
      
      logger.info(`Vistoria criada:`, { id: inspection.id, empresaId, tipo: data.tipo });
      
      return inspection;
    } catch (error) {
      logger.error('Erro ao criar vistoria:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao criar vistoria', 500);
    }
  }

  /**
   * Buscar vistoria por ID
   */
  async getInspectionById(
    id: string,
    empresaId: string
  ): Promise<Inspection> {
    try {
      const inspection = await this.inspectionRepository.findById(id, empresaId);
      if (!inspection) {
        throw createNotFoundError('Vistoria não encontrada');
      }
      return inspection;
    } catch (error) {
      logger.error(`Erro ao buscar vistoria ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao buscar vistoria', 500);
    }
  }

  /**
   * Listar vistorias com filtros
   */
  async listInspections(
    empresaId: string,
    filters: InspectionFilters = {},
    options: QueryOptions = {}
  ) {
    try {
      return await this.inspectionRepository.findWithFilters(empresaId, filters, options);
    } catch (error) {
      logger.error('Erro ao listar vistorias:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao listar vistorias', 500);
    }
  }

  /**
   * Atualizar vistoria
   */
  async updateInspection(
    id: string,
    empresaId: string,
    data: UpdateInspectionData
  ): Promise<Inspection> {
    try {
      const updateData: Partial<Inspection> = {};

      if (data.status) {
        updateData.status = data.status;
      }

      if (data.observacoes !== undefined) {
        updateData.observacoes = data.observacoes;
      }

      if (data.dataVistoria) {
        updateData.dataVistoria = admin.firestore.Timestamp.fromDate(data.dataVistoria);
      }

      if (data.checklists) {
        updateData.checklists = data.checklists;
      }

      const inspection = await this.inspectionRepository.update(id, empresaId, updateData);
      
      logger.info(`Vistoria atualizada:`, { id, empresaId, changes: Object.keys(updateData) });
      
      return inspection;
    } catch (error) {
      logger.error(`Erro ao atualizar vistoria ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao atualizar vistoria', 500);
    }
  }

  /**
   * Atualizar status da vistoria
   */
  async updateStatus(
    id: string,
    empresaId: string,
    status: Inspection['status']
  ): Promise<Inspection> {
    try {
      return await this.inspectionRepository.updateStatus(id, empresaId, status);
    } catch (error) {
      logger.error(`Erro ao atualizar status da vistoria ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao atualizar status', 500);
    }
  }

  /**
   * Adicionar foto à vistoria
   */
  async addPhoto(
    id: string,
    empresaId: string,
    photo: {
      url: string;
      descricao?: string;
      categoria?: string;
    }
  ): Promise<Inspection> {
    try {
      // Verificar limites do plano
      const empresa = await this.companyRepository.findByIdDirect(empresaId);
      if (empresa?.plano) {
        const inspection = await this.getInspectionById(id, empresaId);
        const fotosCount = inspection.fotos?.length || 0;
        
        if (fotosCount >= empresa.plano.limiteFotos) {
          throw createValidationError('Limite de fotos do plano atingido');
        }
      }

      return await this.inspectionRepository.addPhoto(id, empresaId, photo);
    } catch (error) {
      logger.error(`Erro ao adicionar foto à vistoria ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao adicionar foto', 500);
    }
  }

  /**
   * Remover foto da vistoria
   */
  async removePhoto(
    id: string,
    empresaId: string,
    photoUrl: string
  ): Promise<Inspection> {
    try {
      return await this.inspectionRepository.removePhoto(id, empresaId, photoUrl);
    } catch (error) {
      logger.error(`Erro ao remover foto da vistoria ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao remover foto', 500);
    }
  }

  /**
   * Adicionar contestação
   */
  async addContestation(
    id: string,
    empresaId: string,
    contestacao: {
      motivo: string;
      detalhes?: string;
    }
  ): Promise<Inspection> {
    try {
      return await this.inspectionRepository.addContestation(id, empresaId, contestacao);
    } catch (error) {
      logger.error(`Erro ao adicionar contestação à vistoria ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao adicionar contestação', 500);
    }
  }

  /**
   * Deletar vistoria (soft delete)
   */
  async deleteInspection(
    id: string,
    empresaId: string
  ): Promise<boolean> {
    try {
      // Verificar se a vistoria existe
      await this.getInspectionById(id, empresaId);
      
      const result = await this.inspectionRepository.softDelete(id, empresaId);
      
      logger.info(`Vistoria deletada:`, { id, empresaId });
      
      return result;
    } catch (error) {
      logger.error(`Erro ao deletar vistoria ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao deletar vistoria', 500);
    }
  }

  /**
   * Buscar vistorias por vistoriador
   */
  async getInspectionsByVistoriador(
    empresaId: string,
    vistoriadorId: string,
    options: QueryOptions = {}
  ) {
    try {
      return await this.inspectionRepository.findByVistoriador(empresaId, vistoriadorId, options);
    } catch (error) {
      logger.error(`Erro ao buscar vistorias do vistoriador ${vistoriadorId}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao buscar vistorias', 500);
    }
  }

  /**
   * Buscar vistorias por imóvel
   */
  async getInspectionsByImovel(
    empresaId: string,
    imovelId: string,
    options: QueryOptions = {}
  ) {
    try {
      return await this.inspectionRepository.findByImovel(empresaId, imovelId, options);
    } catch (error) {
      logger.error(`Erro ao buscar vistorias do imóvel ${imovelId}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao buscar vistorias', 500);
    }
  }

  /**
   * Buscar estatísticas de vistorias
   */
  async getStats(empresaId: string) {
    try {
      return await this.inspectionRepository.getStats(empresaId);
    } catch (error) {
      logger.error('Erro ao buscar estatísticas de vistorias:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao buscar estatísticas', 500);
    }
  }
}