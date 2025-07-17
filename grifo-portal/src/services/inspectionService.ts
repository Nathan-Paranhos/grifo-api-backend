import api from './api';

export interface Inspection {
  id: string;
  empresaId: string;
  vistoriadorId: string;
  imovelId: string;
  tipo: 'entrada' | 'saida' | 'manutencao';
  status: 'Pendente' | 'Em Andamento' | 'Finalizado';
  dataVistoria: string;
  observacoes?: string;
  fotos?: string[];
  checklists?: Record<string, any>;
  imovel?: {
    endereco: string;
    tipo: string;
    proprietario?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface InspectionFilters {
  vistoriadorId?: string;
  status?: string;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class InspectionService {
  /**
   * Busca inspeções com filtros
   */
  async getInspections(filters: InspectionFilters = {}): Promise<Inspection[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.vistoriadorId) {
        params.append('vistoriadorId', filters.vistoriadorId);
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await api.get<ApiResponse<Inspection[]>>(`/api/v1/inspections?${params.toString()}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Erro ao buscar inspeções');
    } catch (error) {
      console.error('Erro ao buscar inspeções:', error);
      throw error;
    }
  }

  /**
   * Busca uma inspeção específica por ID
   */
  async getInspectionById(id: string): Promise<Inspection> {
    try {
      const response = await api.get<ApiResponse<Inspection>>(`/api/v1/inspections/${id}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Inspeção não encontrada');
    } catch (error) {
      console.error('Erro ao buscar inspeção:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova inspeção
   */
  async createInspection(inspectionData: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<Inspection> {
    try {
      const response = await api.post<ApiResponse<Inspection>>('/api/v1/inspections', inspectionData);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Erro ao criar inspeção');
    } catch (error) {
      console.error('Erro ao criar inspeção:', error);
      throw error;
    }
  }

  /**
   * Atualiza uma inspeção existente
   */
  async updateInspection(id: string, updateData: Partial<Inspection>): Promise<void> {
    try {
      const response = await api.put<ApiResponse<null>>(`/api/v1/inspections/${id}`, updateData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao atualizar inspeção');
      }
    } catch (error) {
      console.error('Erro ao atualizar inspeção:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de inspeções para o dashboard
   */
  async getInspectionStats(): Promise<{
    total: number;
    pendentes: number;
    concluidas: number;
    emAndamento: number;
  }> {
    try {
      const inspections = await this.getInspections();
      
      return {
        total: inspections.length,
        pendentes: inspections.filter(i => i.status === 'Pendente').length,
        concluidas: inspections.filter(i => i.status === 'Finalizado').length,
        emAndamento: inspections.filter(i => i.status === 'Em Andamento').length
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total: 0,
        pendentes: 0,
        concluidas: 0,
        emAndamento: 0
      };
    }
  }
}

export const inspectionService = new InspectionService();
export default inspectionService;