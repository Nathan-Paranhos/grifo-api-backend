import api from './api';

export interface DashboardStats {
  total: number;
  pendentes: number;
  concluidas: number;
  emAndamento: number;
}

export interface DashboardFilters {
  vistoriadorId?: string;
  period?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class DashboardService {
  /**
   * Busca estatísticas do dashboard
   */
  async getDashboardStats(filters: DashboardFilters = {}): Promise<DashboardStats> {
    try {
      const params = new URLSearchParams();
      
      if (filters.vistoriadorId) {
        params.append('vistoriadorId', filters.vistoriadorId);
      }
      if (filters.period) {
        params.append('period', filters.period);
      }

      const response = await api.get<ApiResponse<DashboardStats>>(`/api/v1/dashboard/stats?${params.toString()}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Erro ao buscar estatísticas');
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      // Retorna dados padrão em caso de erro
      return {
        total: 0,
        pendentes: 0,
        concluidas: 0,
        emAndamento: 0
      };
    }
  }

  /**
   * Busca informações gerais do dashboard
   */
  async getDashboardInfo(filters: DashboardFilters = {}): Promise<{
    stats: DashboardStats;
    recentInspections: any[];
  }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.vistoriadorId) {
        params.append('vistoriadorId', filters.vistoriadorId);
      }
      if (filters.period) {
        params.append('period', filters.period);
      }

      const response = await api.get<ApiResponse<{
        stats: DashboardStats;
        recentInspections: any[];
      }>>(`/api/v1/dashboard?${params.toString()}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Erro ao buscar informações do dashboard');
    } catch (error) {
      console.error('Erro ao buscar informações do dashboard:', error);
      // Retorna dados padrão em caso de erro
      return {
        stats: {
          total: 0,
          pendentes: 0,
          concluidas: 0,
          emAndamento: 0
        },
        recentInspections: []
      };
    }
  }

  /**
   * Verifica a saúde da API
   */
  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    database: string;
    firebase: string;
  }> {
    try {
      const response = await api.get('/api/health');
      return response.data;
    } catch (error) {
      console.error('Erro no health check:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;