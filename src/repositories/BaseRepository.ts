import * as admin from 'firebase-admin';
import { getDb, getDbSafe, firebaseInitialized } from '../config/firebase';
import logger from '../config/logger';
import { CustomError } from '../middlewares/errorHandler';

export interface BaseEntity {
  id?: string;
  empresaId: string;
  createdAt?: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  ativo?: boolean;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  where?: Array<{
    field: string;
    operator: admin.firestore.WhereFilterOp;
    value: unknown;
  }>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export abstract class BaseRepository<T extends BaseEntity> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected getCollection(): admin.firestore.CollectionReference {
    if (!firebaseInitialized) {
      throw new Error('Firebase não foi inicializado. Alguns recursos podem não estar disponíveis.');
    }
    const db = getDbSafe();
    if (!db) {
      throw new Error('Firebase não está disponível em modo desenvolvimento.');
    }
    return db.collection(this.collectionName);
  }

  /**
   * Criar um novo documento
   */
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    try {
      const now = admin.firestore.Timestamp.now();
      const docData = {
        ...data,
        createdAt: now,
        updatedAt: now,
        ativo: data.ativo ?? true
      };

      const docRef = await this.getCollection().add(docData);
      const doc = await docRef.get();
      
      logger.info(`Documento criado em ${this.collectionName}:`, { id: docRef.id, empresaId: data.empresaId });
      
      return {
        id: doc.id,
        ...doc.data()
      } as T;
    } catch (error) {
      logger.error(`Erro ao criar documento em ${this.collectionName}:`, error);
      throw new CustomError(`Erro ao criar ${this.collectionName}`, 500);
    }
  }

  /**
   * Buscar documento por ID
   */
  async findById(id: string, empresaId: string): Promise<T | null> {
    try {
      const doc = await this.getCollection().doc(id).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as T;
      
      // Verificar se pertence à empresa
      if (data.empresaId !== empresaId) {
        logger.warn(`Tentativa de acesso a documento de outra empresa: ${id}`);
        return null;
      }

      return {
        id: doc.id,
        ...data
      } as T;
    } catch (error) {
      logger.error(`Erro ao buscar documento ${id} em ${this.collectionName}:`, error);
      throw new CustomError(`Erro ao buscar ${this.collectionName}`, 500);
    }
  }

  /**
   * Buscar todos os documentos da empresa com filtros
   */
  async findByEmpresa(empresaId: string, options: QueryOptions = {}): Promise<PaginatedResult<T>> {
    try {
      let query: admin.firestore.Query = this.getCollection()
        .where('empresaId', '==', empresaId);

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

      // Aplicar paginação
      const limit = options.limit || 10;
      const offset = options.offset || 0;
      
      if (offset > 0) {
        const offsetSnapshot = await query.limit(offset).get();
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }

      query = query.limit(limit);

      const snapshot = await query.get();
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      // Contar total (para paginação)
      const totalSnapshot = await this.getCollection()
        .where('empresaId', '==', empresaId)
        .get();
      const total = totalSnapshot.size;

      const page = Math.floor(offset / limit) + 1;
      const hasNext = (offset + limit) < total;
      const hasPrev = offset > 0;

      logger.info(`Busca em ${this.collectionName} para empresa ${empresaId}:`, {
        total: data.length,
        page,
        limit
      });

      return {
        data,
        total,
        page,
        limit,
        hasNext,
        hasPrev
      };
    } catch (error) {
      logger.error(`Erro ao buscar documentos em ${this.collectionName}:`, error);
      throw new CustomError(`Erro ao buscar ${this.collectionName}`, 500);
    }
  }

  /**
   * Atualizar documento
   */
  async update(id: string, empresaId: string, data: Partial<Omit<T, 'id' | 'createdAt' | 'empresaId'>>): Promise<T> {
    try {
      // Verificar se o documento existe e pertence à empresa
      const existing = await this.findById(id, empresaId);
      if (!existing) {
        throw new CustomError(`${this.collectionName} não encontrado`, 404);
      }

      const updateData = {
        ...data,
        updatedAt: admin.firestore.Timestamp.now()
      };

      await this.getCollection().doc(id).update(updateData);
      
      logger.info(`Documento atualizado em ${this.collectionName}:`, { id, empresaId });
      
      // Retornar documento atualizado
      return await this.findById(id, empresaId) as T;
    } catch (error) {
      logger.error(`Erro ao atualizar documento ${id} em ${this.collectionName}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Erro ao atualizar ${this.collectionName}`, 500);
    }
  }

  /**
   * Soft delete (marcar como inativo)
   */
  async softDelete(id: string, empresaId: string): Promise<boolean> {
    try {
      await this.update(id, empresaId, { ativo: false } as Partial<T>);
      logger.info(`Soft delete em ${this.collectionName}:`, { id, empresaId });
      return true;
    } catch (error) {
      logger.error(`Erro ao fazer soft delete ${id} em ${this.collectionName}:`, error);
      throw new CustomError(`Erro ao deletar ${this.collectionName}`, 500);
    }
  }

  /**
   * Hard delete (remover permanentemente)
   */
  async hardDelete(id: string, empresaId: string): Promise<boolean> {
    try {
      // Verificar se o documento existe e pertence à empresa
      const existing = await this.findById(id, empresaId);
      if (!existing) {
        throw new CustomError(`${this.collectionName} não encontrado`, 404);
      }

      await this.getCollection().doc(id).delete();
      logger.info(`Hard delete em ${this.collectionName}:`, { id, empresaId });
      return true;
    } catch (error) {
      logger.error(`Erro ao fazer hard delete ${id} em ${this.collectionName}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(`Erro ao deletar ${this.collectionName}`, 500);
    }
  }

  /**
   * Contar documentos
   */
  async count(empresaId: string, filters?: QueryOptions['where']): Promise<number> {
    try {
      let query: admin.firestore.Query = this.getCollection()
        .where('empresaId', '==', empresaId);

      if (filters) {
        filters.forEach(filter => {
          query = query.where(filter.field, filter.operator, filter.value);
        });
      }

      const snapshot = await query.get();
      return snapshot.size;
    } catch (error) {
      logger.error(`Erro ao contar documentos em ${this.collectionName}:`, error);
      throw new CustomError(`Erro ao contar ${this.collectionName}`, 500);
    }
  }

  /**
   * Verificar se documento existe
   */
  async exists(id: string, empresaId: string): Promise<boolean> {
    try {
      const doc = await this.findById(id, empresaId);
      return doc !== null;
    } catch (error) {
      logger.error(`Erro ao verificar existência ${id} em ${this.collectionName}:`, error);
      return false;
    }
  }
}