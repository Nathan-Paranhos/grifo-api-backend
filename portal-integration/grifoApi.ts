import { authenticatedFetch } from './authInterceptor';

// Base URL da API de produção
const API_BASE = 'https://grifo-api-backend.onrender.com/api/v1';

/**
 * Tipos de dados da API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Property {
  id: string;
  endereco: string;
  tipo: string;
  valor?: number;
  status: string;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Inspection {
  id: string;
  propertyId: string;
  vistoriadorId: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'cancelada';
  dataAgendada: string;
  dataRealizacao?: string;
  observacoes?: string;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'vistoriador' | 'usuario';
  ativo: boolean;
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  telefone?: string;
  endereco?: {
    rua: string;
    numero: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  totalProperties: number;
  totalInspections: number;
  totalUsers: number;
  pendingInspections: number;
  completedInspections: number;
  recentActivity: any[];
}

export interface Contestation {
  id: string;
  inspectionId: string;
  motivo: string;
  descricao: string;
  status: 'pendente' | 'analisando' | 'aprovada' | 'rejeitada';
  empresaId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Classe principal para comunicação com a API Grifo
 */
export class GrifoApiService {
  private static instance: GrifoApiService;

  private constructor() {}

  public static getInstance(): GrifoApiService {
    if (!GrifoApiService.instance) {
      GrifoApiService.instance = new GrifoApiService();
    }
    return GrifoApiService.instance;
  }

  /**
   * Método genérico para fazer requisições à API
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE}${endpoint}`;
      const response = await authenticatedFetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: `HTTP ${response.status}: ${response.statusText}`
        }));
        return {
          success: false,
          error: errorData.error || `Erro ${response.status}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data.data || data
      };
    } catch (error) {
      console.error('Erro na requisição:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // ===== DASHBOARD =====
  /**
   * Obtém dados do dashboard
   */
  async getDashboard(): Promise<ApiResponse<DashboardData>> {
    return this.request<DashboardData>('/dashboard');
  }

  // ===== PROPRIEDADES =====
  /**
   * Lista todas as propriedades
   */
  async getProperties(params?: {
    limit?: number;
    offset?: number;
    tipo?: string;
    status?: string;
  }): Promise<ApiResponse<Property[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/properties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<Property[]>(endpoint);
  }

  /**
   * Obtém uma propriedade específica
   */
  async getProperty(id: string): Promise<ApiResponse<Property>> {
    return this.request<Property>(`/properties/${id}`);
  }

  /**
   * Cria uma nova propriedade
   */
  async createProperty(property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Property>> {
    return this.request<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(property)
    });
  }

  // ===== VISTORIAS =====
  /**
   * Lista todas as vistorias
   */
  async getInspections(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    propertyId?: string;
  }): Promise<ApiResponse<Inspection[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/inspections${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<Inspection[]>(endpoint);
  }

  /**
   * Obtém uma vistoria específica
   */
  async getInspection(id: string): Promise<ApiResponse<Inspection>> {
    return this.request<Inspection>(`/inspections/${id}`);
  }

  /**
   * Cria uma nova vistoria
   */
  async createInspection(inspection: Omit<Inspection, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Inspection>> {
    return this.request<Inspection>('/inspections', {
      method: 'POST',
      body: JSON.stringify(inspection)
    });
  }

  // ===== USUÁRIOS =====
  /**
   * Lista todos os usuários da empresa
   */
  async getUsers(params?: {
    limit?: number;
    offset?: number;
    role?: string;
    ativo?: boolean;
  }): Promise<ApiResponse<User[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<User[]>(endpoint);
  }

  /**
   * Cria um novo usuário
   */
  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<User>> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }

  // ===== EMPRESAS =====
  /**
   * Obtém dados da empresa autenticada
   */
  async getCompany(): Promise<ApiResponse<Company>> {
    return this.request<Company>('/empresas');
  }

  /**
   * Atualiza dados da empresa
   */
  async updateCompany(id: string, updates: Partial<Company>): Promise<ApiResponse<Company>> {
    return this.request<Company>(`/empresas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // ===== CONTESTAÇÕES =====
  /**
   * Lista contestações cadastradas
   */
  async getContestations(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<ApiResponse<Contestation[]>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/contestations${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<Contestation[]>(endpoint);
  }

  /**
   * Envia nova contestação
   */
  async createContestation(contestation: Omit<Contestation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Contestation>> {
    return this.request<Contestation>('/contestations', {
      method: 'POST',
      body: JSON.stringify(contestation)
    });
  }
}

// Instância singleton da API
export const grifoApi = GrifoApiService.getInstance();

// Exportar como default também
export default grifoApi;