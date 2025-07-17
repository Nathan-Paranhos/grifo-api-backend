import api from './api';

export interface Property {
  id: string;
  empresaId: string;
  endereco: string;
  tipo: 'apartamento' | 'casa' | 'comercial' | 'terreno';
  proprietario?: string;
  telefoneProprietario?: string;
  emailProprietario?: string;
  observacoes?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyFilters {
  tipo?: string;
  ativo?: boolean;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class PropertyService {
  /**
   * Busca propriedades com filtros
   */
  async getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.tipo) {
        params.append('tipo', filters.tipo);
      }
      if (filters.ativo !== undefined) {
        params.append('ativo', filters.ativo.toString());
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await api.get<ApiResponse<Property[]>>(`/api/v1/properties?${params.toString()}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Erro ao buscar propriedades');
    } catch (error) {
      console.error('Erro ao buscar propriedades:', error);
      throw error;
    }
  }

  /**
   * Busca uma propriedade específica por ID
   */
  async getPropertyById(id: string): Promise<Property> {
    try {
      const response = await api.get<ApiResponse<Property>>(`/api/v1/properties/${id}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Propriedade não encontrada');
    } catch (error) {
      console.error('Erro ao buscar propriedade:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova propriedade
   */
  async createProperty(propertyData: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
    try {
      const response = await api.post<ApiResponse<Property>>('/api/v1/properties', propertyData);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Erro ao criar propriedade');
    } catch (error) {
      console.error('Erro ao criar propriedade:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma propriedade existente
   */
  async updateProperty(id: string, updateData: Partial<Property>): Promise<void> {
    try {
      const response = await api.put<ApiResponse<null>>(`/api/v1/properties/${id}`, updateData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao atualizar propriedade');
      }
    } catch (error) {
      console.error('Erro ao atualizar propriedade:', error);
      throw error;
    }
  }

  /**
   * Conta o número de propriedades ativas
   */
  async getPropertyCount(): Promise<number> {
    try {
      const properties = await this.getProperties({ ativo: true });
      return properties.length;
    } catch (error) {
      console.error('Erro ao contar propriedades:', error);
      return 0;
    }
  }

  /**
   * Busca propriedades por tipo
   */
  async getPropertiesByType(tipo: string): Promise<Property[]> {
    try {
      return await this.getProperties({ tipo, ativo: true });
    } catch (error) {
      console.error('Erro ao buscar propriedades por tipo:', error);
      return [];
    }
  }
}

export const propertyService = new PropertyService();
export default propertyService;