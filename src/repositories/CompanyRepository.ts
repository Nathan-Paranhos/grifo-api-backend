import * as admin from 'firebase-admin';
import { BaseRepository, BaseEntity, QueryOptions } from './BaseRepository';
import logger from '../config/logger';
import { CustomError } from '../middlewares/errorHandler';

export interface Company extends BaseEntity {
  nome: string;
  cnpj?: string;
  email: string;
  telefone?: string;
  endereco?: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  configuracoes?: {
    logoUrl?: string;
    corPrimaria?: string;
    corSecundaria?: string;
    assinaturaEmail?: string;
    templateLaudo?: string;
  };
  plano?: {
    tipo: 'free' | 'basic' | 'premium' | 'enterprise';
    limiteUsuarios: number;
    limiteVistorias: number;
    limiteFotos: number;
    dataVencimento?: admin.firestore.Timestamp;
  };
  status: 'ativa' | 'suspensa' | 'cancelada';
  proprietarioId: string;
  usuariosCount?: number;
  vistoriasCount?: number;
}

export class CompanyRepository extends BaseRepository<Company> {
  constructor() {
    super('companies');
  }

  /**
   * Criar empresa (override para não filtrar por empresaId)
   */
  async create(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'empresaId'>): Promise<Company> {
    try {
      const now = admin.firestore.Timestamp.now();
      const docData = {
        ...data,
        empresaId: '', // Será preenchido com o ID do documento
        createdAt: now,
        updatedAt: now,
        ativo: true,
        status: 'ativa' as const,
        usuariosCount: 0,
        vistoriasCount: 0
      };

      const docRef = await this.collection.add(docData);
      
      // Atualizar o empresaId com o ID do documento
      await docRef.update({ empresaId: docRef.id });
      
      const doc = await docRef.get();
      
      logger.info(`Empresa criada:`, { id: docRef.id, nome: data.nome });
      
      return {
        id: doc.id,
        ...doc.data()
      } as Company;
    } catch (error) {
      logger.error('Erro ao criar empresa:', error);
      throw new CustomError('Erro ao criar empresa', 500);
    }
  }

  /**
   * Buscar empresa por ID (sem filtro de empresaId)
   */
  async findByIdDirect(id: string): Promise<Company | null> {
    try {
      const doc = await this.collection.doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      return {
        id: doc.id,
        ...doc.data()
      } as Company;
    } catch (error) {
      logger.error(`Erro ao buscar empresa ${id}:`, error);
      throw new CustomError('Erro ao buscar empresa', 500);
    }
  }

  /**
   * Buscar empresa por CNPJ
   */
  async findByCnpj(cnpj: string): Promise<Company | null> {
    try {
      const snapshot = await this.collection
        .where('cnpj', '==', cnpj)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Company;
    } catch (error) {
      logger.error(`Erro ao buscar empresa por CNPJ ${cnpj}:`, error);
      throw new CustomError('Erro ao buscar empresa', 500);
    }
  }

  /**
   * Buscar empresa por email
   */
  async findByEmail(email: string): Promise<Company | null> {
    try {
      const snapshot = await this.collection
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as Company;
    } catch (error) {
      logger.error(`Erro ao buscar empresa por email ${email}:`, error);
      throw new CustomError('Erro ao buscar empresa', 500);
    }
  }

  /**
   * Buscar empresas por proprietário
   */
  async findByProprietario(proprietarioId: string): Promise<Company[]> {
    try {
      const snapshot = await this.collection
        .where('proprietarioId', '==', proprietarioId)
        .where('ativo', '==', true)
        .orderBy('createdAt', 'desc')
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Company[];
    } catch (error) {
      logger.error(`Erro ao buscar empresas do proprietário ${proprietarioId}:`, error);
      throw new CustomError('Erro ao buscar empresas', 500);
    }
  }

  /**
   * Listar todas as empresas (para superadmin)
   */
  async findAll(options: QueryOptions = {}) {
    try {
      let query: admin.firestore.Query = this.collection;

      // Aplicar filtros where
      if (options.where) {
        options.where.forEach(filter => {
          query = query.where(filter.field, filter.operator, filter.value);
        });
      }

      // Aplicar ordenação
      if (options.orderBy) {
        query = query.orderBy(options.orderBy, options.orderDirection || 'desc');
      } else {
        query = query.orderBy('createdAt', 'desc');
      }

      // Aplicar limite
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const snapshot = await query.get();
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Company[];

      logger.info(`Listagem de empresas:`, { total: data.length });

      return data;
    } catch (error) {
      logger.error('Erro ao listar empresas:', error);
      throw new CustomError('Erro ao listar empresas', 500);
    }
  }

  /**
   * Atualizar status da empresa
   */
  async updateStatus(id: string, status: Company['status']): Promise<Company> {
    try {
      const empresa = await this.findByIdDirect(id);
      if (!empresa) {
        throw new CustomError('Empresa não encontrada', 404);
      }

      await this.collection.doc(id).update({
        status,
        updatedAt: admin.firestore.Timestamp.now()
      });

      logger.info(`Status da empresa ${id} atualizado para ${status}`);
      
      return await this.findByIdDirect(id) as Company;
    } catch (error) {
      logger.error(`Erro ao atualizar status da empresa ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao atualizar status da empresa', 500);
    }
  }

  /**
   * Atualizar configurações da empresa
   */
  async updateConfiguracoes(
    id: string,
    configuracoes: Company['configuracoes']
  ): Promise<Company> {
    try {
      const empresa = await this.findByIdDirect(id);
      if (!empresa) {
        throw new CustomError('Empresa não encontrada', 404);
      }

      await this.collection.doc(id).update({
        configuracoes: {
          ...empresa.configuracoes,
          ...configuracoes
        },
        updatedAt: admin.firestore.Timestamp.now()
      });

      logger.info(`Configurações da empresa ${id} atualizadas`);
      
      return await this.findByIdDirect(id) as Company;
    } catch (error) {
      logger.error(`Erro ao atualizar configurações da empresa ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao atualizar configurações', 500);
    }
  }

  /**
   * Atualizar plano da empresa
   */
  async updatePlano(id: string, plano: Company['plano']): Promise<Company> {
    try {
      const empresa = await this.findByIdDirect(id);
      if (!empresa) {
        throw new CustomError('Empresa não encontrada', 404);
      }

      await this.collection.doc(id).update({
        plano,
        updatedAt: admin.firestore.Timestamp.now()
      });

      logger.info(`Plano da empresa ${id} atualizado para ${plano?.tipo}`);
      
      return await this.findByIdDirect(id) as Company;
    } catch (error) {
      logger.error(`Erro ao atualizar plano da empresa ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao atualizar plano', 500);
    }
  }

  /**
   * Incrementar contador de usuários
   */
  async incrementUsuarios(id: string): Promise<void> {
    try {
      await this.collection.doc(id).update({
        usuariosCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.Timestamp.now()
      });
    } catch (error) {
      logger.error(`Erro ao incrementar usuários da empresa ${id}:`, error);
    }
  }

  /**
   * Decrementar contador de usuários
   */
  async decrementUsuarios(id: string): Promise<void> {
    try {
      await this.collection.doc(id).update({
        usuariosCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: admin.firestore.Timestamp.now()
      });
    } catch (error) {
      logger.error(`Erro ao decrementar usuários da empresa ${id}:`, error);
    }
  }

  /**
   * Incrementar contador de vistorias
   */
  async incrementVistorias(id: string): Promise<void> {
    try {
      await this.collection.doc(id).update({
        vistoriasCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.Timestamp.now()
      });
    } catch (error) {
      logger.error(`Erro ao incrementar vistorias da empresa ${id}:`, error);
    }
  }

  /**
   * Buscar estatísticas gerais (para superadmin)
   */
  async getGlobalStats() {
    try {
      const [total, ativas, suspensas, canceladas] = await Promise.all([
        this.collection.get().then(snap => snap.size),
        this.collection.where('status', '==', 'ativa').get().then(snap => snap.size),
        this.collection.where('status', '==', 'suspensa').get().then(snap => snap.size),
        this.collection.where('status', '==', 'cancelada').get().then(snap => snap.size)
      ]);

      return {
        total,
        ativas,
        suspensas,
        canceladas
      };
    } catch (error) {
      logger.error('Erro ao buscar estatísticas globais:', error);
      throw new CustomError('Erro ao buscar estatísticas', 500);
    }
  }
}