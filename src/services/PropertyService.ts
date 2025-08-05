import { getDbSafe, isFirebaseInitialized } from '../config/firebase';
import logger from '../config/logger';
import { CustomError } from '../utils/errors';
import { Property } from '../models/Property';

class PropertyService {
  private collectionName = 'properties';

  async list(empresaId: string, search?: string): Promise<Property[]> {
    try {
      if (!isFirebaseInitialized()) {
        throw new CustomError('Firebase não inicializado', 500);
      }

      const db = getDbSafe();
      if (!db) {
        throw new CustomError('Instância do banco de dados não disponível', 500);
      }

      let query = db.collection(this.collectionName)
        .where('empresaId', '==', empresaId)
        .where('ativo', '!=', false);

      const snapshot = await query.get();
      let properties = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }) as Property[];

      // Filter by search term if provided
      if (search) {
        const searchLower = search.toLowerCase();
        properties = properties.filter(property => 
          property.enderecoCompleto?.toLowerCase().includes(searchLower) ||
          property.endereco?.toLowerCase().includes(searchLower) ||
          property.proprietario?.nome?.toLowerCase().includes(searchLower) ||
          property.bairro?.toLowerCase().includes(searchLower) ||
          property.cidade?.toLowerCase().includes(searchLower)
        );
      }

      return properties;
    } catch (error) {
      logger.error('Erro ao listar propriedades:', error);
      throw error;
    }
  }

  async getById(id: string, empresaId: string): Promise<Property> {
    try {
      if (!isFirebaseInitialized()) {
        throw new CustomError('Firebase não inicializado', 500);
      }

      const db = getDbSafe();
      if (!db) {
        throw new CustomError('Instância do banco de dados não disponível', 500);
      }

      const doc = await db.collection(this.collectionName).doc(id).get();
      
      if (!doc.exists) {
        throw new CustomError('Propriedade não encontrada', 404);
      }

      const data = doc.data();
      if (data?.empresaId !== empresaId) {
        throw new CustomError('Acesso negado', 403);
      }

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date()
      } as Property;
    } catch (error) {
      logger.error('Erro ao buscar propriedade:', error);
      throw error;
    }
  }

  async create(data: Omit<Property, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>, empresaId: string): Promise<Property> {
    try {
      if (!isFirebaseInitialized()) {
        throw new CustomError('Firebase não inicializado', 500);
      }

      const db = getDbSafe();
      if (!db) {
        throw new CustomError('Instância do banco de dados não disponível', 500);
      }

      // Gerar endereço completo se não fornecido
      const enderecoCompleto = data.enderecoCompleto || 
        `${data.endereco}, ${data.bairro}, ${data.cidade} - ${data.estado}, ${data.cep}`;

      const propertyData = { 
        ...data, 
        empresaId, 
        enderecoCompleto,
        ativo: data.ativo !== undefined ? data.ativo : true,
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      
      const docRef = await db.collection(this.collectionName).add(propertyData);
      return { id: docRef.id, ...propertyData } as Property;
    } catch (error) {
      logger.error('Erro ao criar propriedade:', error);
      throw error;
    }
  }

  async update(id: string, data: Partial<Omit<Property, 'id' | 'empresaId' | 'createdAt' | 'updatedAt'>>, empresaId: string): Promise<Property> {
    try {
      if (!isFirebaseInitialized()) {
        throw new CustomError('Firebase não inicializado', 500);
      }

      const db = getDbSafe();
      if (!db) {
        throw new CustomError('Instância do banco de dados não disponível', 500);
      }

      const property = await this.getById(id, empresaId);
      
      // Gerar endereço completo se campos de endereço foram atualizados
      let enderecoCompleto = data.enderecoCompleto;
      if (data.endereco || data.bairro || data.cidade || data.estado || data.cep) {
        const endereco = data.endereco || property.endereco;
        const bairro = data.bairro || property.bairro;
        const cidade = data.cidade || property.cidade;
        const estado = data.estado || property.estado;
        const cep = data.cep || property.cep;
        enderecoCompleto = `${endereco}, ${bairro}, ${cidade} - ${estado}, ${cep}`;
      }

      const updatedData = { 
        ...data, 
        ...(enderecoCompleto && { enderecoCompleto }),
        updatedAt: new Date() 
      };
      
      await db.collection(this.collectionName).doc(id).update(updatedData);
      return { ...property, ...updatedData };
    } catch (error) {
      logger.error('Erro ao atualizar propriedade:', error);
      throw error;
    }
  }

  async remove(id: string, empresaId: string): Promise<void> {
    try {
      if (!isFirebaseInitialized()) {
        throw new CustomError('Firebase não inicializado', 500);
      }

      const db = getDbSafe();
      if (!db) {
        throw new CustomError('Instância do banco de dados não disponível', 500);
      }

      await this.getById(id, empresaId); // Check if property exists and belongs to the company
      
      // Soft delete - marca como inativo em vez de deletar
      await db.collection(this.collectionName).doc(id).update({
        ativo: false,
        updatedAt: new Date()
      });
    } catch (error) {
      logger.error('Erro ao remover propriedade:', error);
      throw error;
    }
  }
}

export { PropertyService };
export const propertyService = new PropertyService();