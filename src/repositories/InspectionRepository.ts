import * as admin from 'firebase-admin';
import { BaseRepository, BaseEntity, QueryOptions } from './BaseRepository';
import logger from '../config/logger';
import { CustomError } from '../middlewares/errorHandler';

export interface Inspection extends BaseEntity {
  vistoriadorId: string;
  imovelId: string;
  tipo: 'entrada' | 'saida' | 'manutencao';
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  dataVistoria?: admin.firestore.Timestamp;
  observacoes?: string;
  fotos?: Array<{
    url: string;
    descricao?: string;
    categoria?: string;
    timestamp?: admin.firestore.Timestamp;
  }>;
  checklists?: Array<{
    categoria: string;
    itens: Array<{
      item: string;
      status: 'ok' | 'problema' | 'nao_aplicavel';
      observacao?: string;
    }>;
  }>;
  imovel?: {
    endereco: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
    tipo: string;
    areaTotal?: number;
    areaConstruida?: number;
    proprietario?: {
      nome: string;
      telefone?: string;
      email?: string;
    };
    inquilino?: {
      nome: string;
      telefone?: string;
      email?: string;
    };
  };
  contestacoes?: Array<{
    id: string;
    motivo: string;
    detalhes?: string;
    status: 'pendente' | 'em_analise' | 'aprovada' | 'rejeitada';
    createdAt: admin.firestore.Timestamp;
  }>;
}

export interface InspectionFilters {
  vistoriadorId?: string;
  status?: string;
  tipo?: string;
  dataInicio?: Date;
  dataFim?: Date;
  imovelId?: string;
}

export class InspectionRepository extends BaseRepository<Inspection> {
  constructor() {
    super('inspections');
  }

  /**
   * Buscar vistorias com filtros específicos
   */
  async findWithFilters(
    empresaId: string,
    filters: InspectionFilters,
    options: QueryOptions = {}
  ) {
    try {
      const whereConditions: QueryOptions['where'] = [];

      // Aplicar filtros específicos
      if (filters.vistoriadorId) {
        whereConditions.push({
          field: 'vistoriadorId',
          operator: '==',
          value: filters.vistoriadorId
        });
      }

      if (filters.status) {
        whereConditions.push({
          field: 'status',
          operator: '==',
          value: filters.status
        });
      }

      if (filters.tipo) {
        whereConditions.push({
          field: 'tipo',
          operator: '==',
          value: filters.tipo
        });
      }

      if (filters.imovelId) {
        whereConditions.push({
          field: 'imovelId',
          operator: '==',
          value: filters.imovelId
        });
      }

      // Filtros de data (Firestore tem limitações com range queries)
      if (filters.dataInicio) {
        whereConditions.push({
          field: 'dataVistoria',
          operator: '>=',
          value: admin.firestore.Timestamp.fromDate(filters.dataInicio)
        });
      }

      if (filters.dataFim) {
        whereConditions.push({
          field: 'dataVistoria',
          operator: '<=',
          value: admin.firestore.Timestamp.fromDate(filters.dataFim)
        });
      }

      const queryOptions: QueryOptions = {
        ...options,
        where: whereConditions,
        orderBy: options.orderBy || 'createdAt'
      };

      return await this.findByEmpresa(empresaId, queryOptions);
    } catch (error) {
      logger.error('Erro ao buscar vistorias com filtros:', error);
      throw new CustomError('Erro ao buscar vistorias', 500);
    }
  }

  /**
   * Buscar vistorias por vistoriador
   */
  async findByVistoriador(
    empresaId: string,
    vistoriadorId: string,
    options: QueryOptions = {}
  ) {
    return await this.findWithFilters(empresaId, { vistoriadorId }, options);
  }

  /**
   * Buscar vistorias por imóvel
   */
  async findByImovel(
    empresaId: string,
    imovelId: string,
    options: QueryOptions = {}
  ) {
    return await this.findWithFilters(empresaId, { imovelId }, options);
  }

  /**
   * Buscar vistorias por status
   */
  async findByStatus(
    empresaId: string,
    status: string,
    options: QueryOptions = {}
  ) {
    return await this.findWithFilters(empresaId, { status }, options);
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
      const inspection = await this.findById(id, empresaId);
      if (!inspection) {
        throw new CustomError('Vistoria não encontrada', 404);
      }

      const newPhoto = {
        ...photo,
        timestamp: admin.firestore.Timestamp.now()
      };

      const updatedPhotos = [...(inspection.fotos || []), newPhoto];

      return await this.update(id, empresaId, {
        fotos: updatedPhotos
      });
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
      const inspection = await this.findById(id, empresaId);
      if (!inspection) {
        throw new CustomError('Vistoria não encontrada', 404);
      }

      const updatedPhotos = (inspection.fotos || []).filter(
        photo => photo.url !== photoUrl
      );

      return await this.update(id, empresaId, {
        fotos: updatedPhotos
      });
    } catch (error) {
      logger.error(`Erro ao remover foto da vistoria ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao remover foto', 500);
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
      logger.info(`Atualizando status da vistoria ${id} para ${status}`);
      return await this.update(id, empresaId, { status });
    } catch (error) {
      logger.error(`Erro ao atualizar status da vistoria ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao atualizar status', 500);
    }
  }

  /**
   * Adicionar contestação à vistoria
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
      const inspection = await this.findById(id, empresaId);
      if (!inspection) {
        throw new CustomError('Vistoria não encontrada', 404);
      }

      const newContestation = {
        id: admin.firestore.FieldValue.serverTimestamp().toString(),
        ...contestacao,
        status: 'pendente' as const,
        createdAt: admin.firestore.Timestamp.now()
      };

      const updatedContestacoes = [...(inspection.contestacoes || []), newContestation];

      return await this.update(id, empresaId, {
        contestacoes: updatedContestacoes
      });
    } catch (error) {
      logger.error(`Erro ao adicionar contestação à vistoria ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao adicionar contestação', 500);
    }
  }

  /**
   * Buscar estatísticas de vistorias
   */
  async getStats(empresaId: string) {
    try {
      const [total, pendentes, concluidas, canceladas] = await Promise.all([
        this.count(empresaId),
        this.count(empresaId, [{ field: 'status', operator: '==', value: 'pendente' }]),
        this.count(empresaId, [{ field: 'status', operator: '==', value: 'concluida' }]),
        this.count(empresaId, [{ field: 'status', operator: '==', value: 'cancelada' }])
      ]);

      return {
        total,
        pendentes,
        concluidas,
        canceladas,
        emAndamento: total - pendentes - concluidas - canceladas
      };
    } catch (error) {
      logger.error('Erro ao buscar estatísticas de vistorias:', error);
      throw new CustomError('Erro ao buscar estatísticas', 500);
    }
  }
}