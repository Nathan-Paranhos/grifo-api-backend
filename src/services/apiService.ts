import { auth } from '../config/firebase';
import Constants from 'expo-constants';
import { fetchWithTimeout, FetchTimeoutError } from '../utils/fetchWithTimeout';

// Acessar variáveis de ambiente através do Constants.expoConfig.extra
const API_BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || '';
const DEFAULT_TIMEOUT = 15000; // 15 segundos de timeout padrão

interface ApiResponse<T> {
  success: boolean;
  partialSuccess?: boolean;
  data?: T;
  error?: string;
  message?: string;
  urls?: string[]; // Para respostas de upload de fotos
}

interface InspectionData {
  id: string;
  empresaId: string;
  vistoriadorId: string;
  imovelId: string;
  tipo: 'entrada' | 'saida' | 'manutencao';
  fotos: string[];
  checklist: Record<string, string>;
  observacoes: string;
  createdAt: string;
  status: 'pending' | 'synced' | 'error';
}

interface DashboardStats {
  overview: {
    totalInspections: number;
    completedInspections: number;
    pendingInspections: number;
    totalProperties: number;
    activeInspectors: number;
  };
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    imovel: string;
    timestamp: string;
    vistoriador: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    inspections: number;
  }>;
  qualityMetrics: {
    averagePhotosPerInspection: number;
    checklistCompletionRate: number;
    averageInspectionTime: number;
  };
}

export class ApiService {
  static async updateInspection(id: string, data: any): Promise<any> {
    const response = await this.request(`/inspections/${id}`, {
      method: 'PUT',
      data,
    });
    return response.data;
  }

  static async getInspectionById(id: string): Promise<any> {
    const response = await this.request(`/inspections/${id}`);
    return response.data;
  }

  static async getProperties(params: {
    empresaId: string;
    search?: string;
  }): Promise<ApiResponse<any[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('empresaId', params.empresaId);
    if (params.search) {
      searchParams.append('search', params.search);
    }
    return this.makeRequest<any[]>(`/properties?${searchParams.toString()}`);
  }

  // Método para obter a URL base da API
  static getApiBaseUrl(): string {
    return API_BASE_URL;
  }
  
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit & { timeout?: number } = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;
      
      // Obter o token de autenticação do usuário atual
      let authHeaders = {};
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          authHeaders = {
            'Authorization': `Bearer ${token}`
          };
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      }
      
      // Usar fetchWithTimeout em vez de fetch padrão
      const response = await fetchWithTimeout(url, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
        timeout: options.timeout || DEFAULT_TIMEOUT,
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      
      // Tratamento específico para erros de timeout
      if (error instanceof FetchTimeoutError) {
        return {
          success: false,
          partialSuccess: false,
          error: `Tempo limite excedido. Verifique sua conexão e tente novamente.`,
        };
      }
      
      // Tratamento para erros de rede
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        return {
          success: false,
          partialSuccess: false,
          error: `Falha na conexão de rede. Verifique se você está online.`,
        };
      }
      
      return {
        success: false,
        partialSuccess: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ocorreu',
      };
    }
  }

  // Get inspections for a company or specific inspector
  static async getInspections(params: {
    empresaId: string;
    vistoriadorId?: string;
    status?: string;
    limit?: number;
  }): Promise<ApiResponse<InspectionData[]>> {
    const searchParams = new URLSearchParams();
    searchParams.append('empresaId', params.empresaId);
    
    if (params.vistoriadorId) {
      searchParams.append('vistoriadorId', params.vistoriadorId);
    }
    if (params.status) {
      searchParams.append('status', params.status);
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    return this.makeRequest<InspectionData[]>(`/api/inspections?${searchParams}`);
  }

  // Create a new inspection
  static async createInspection(inspectionData: Omit<InspectionData, 'id' | 'createdAt' | 'status'>): Promise<ApiResponse<InspectionData>> {
    return this.makeRequest<InspectionData>('/api/inspections', {
      method: 'POST',
      body: JSON.stringify(inspectionData),
    });
  }

  // Get dashboard statistics
  static async getDashboardStats(params: {
    empresaId: string;
    vistoriadorId?: string;
    period?: number;
  }): Promise<ApiResponse<DashboardStats>> {
    const searchParams = new URLSearchParams();
    searchParams.append('empresaId', params.empresaId);
    
    if (params.vistoriadorId) {
      searchParams.append('vistoriadorId', params.vistoriadorId);
    }
    if (params.period) {
      searchParams.append('period', params.period.toString());
    }

    return this.makeRequest<DashboardStats>(`/api/dashboard/stats?${searchParams}`);
  }

  // Sync pending inspections
  static async syncPendingInspections(params: {
    pendingInspections: InspectionData[];
    vistoriadorId: string;
    empresaId: string;
  }): Promise<ApiResponse<{
    synced: number;
    failed: number;
    results: Array<{
      localId: string;
      cloudId: string;
      status: string;
      syncedAt: string;
    }>;
    errors: Array<{
      inspectionId: string;
      error: string;
    }>;
  }>> {
    // Usar timeout maior para sincronização, pois pode envolver muitos dados
    return this.makeRequest('/api/sync', {
      method: 'POST',
      body: JSON.stringify(params),
      timeout: 30000, // 30 segundos para sincronização
    });
  }

  // Upload photos to Firebase Storage with retry and batch processing
  static async uploadPhotos(photos: string[], inspectionId: string, options: {
    maxRetries?: number;
    retryDelay?: number;
    batchSize?: number;
    exponentialBackoff?: boolean;
    onProgress?: (current: number, total: number, message?: string) => void;
    onRetry?: (photoIndex: number, attempt: number, error: any, nextDelay: number) => void;
    onBatchComplete?: (batchIndex: number, totalBatches: number, successCount: number, failCount: number) => void;
  } = {}): Promise<ApiResponse<string[]>> {
    try {
      // Delegamos o upload para o UploadService que já implementa retry e processamento em lotes
      const { UploadService } = await import('./uploadService');
      
      const { 
        maxRetries = 3, 
        retryDelay = 2000, 
        batchSize = 3, 
        exponentialBackoff = true,
        onProgress,
        onRetry,
        onBatchComplete
      } = options;
      
      // Usar o UploadService para fazer o upload com retry e processamento em lotes
      const uploadResult = await UploadService.uploadPhotos(
        photos,
        inspectionId,
        {
          maxRetries,
          retryDelay,
          batchSize,
          exponentialBackoff,
          onProgress,
          onRetry,
          onBatchComplete
        }
      );
      
      if (!uploadResult.success) {
        return {
          success: false,
          partialSuccess: uploadResult.partialSuccess || false,
          error: uploadResult.errors?.join(', ') || 'Falha no upload das fotos',
          urls: uploadResult.urls || [] // Retornar URLs parciais se houver sucesso parcial
        };
      }
      
      return {
        success: true,
        data: uploadResult.urls || [],
      };
    } catch (error) {
      console.error('Error in uploadPhotos:', error);
      return {
        success: false,
        partialSuccess: false,
        error: error instanceof Error ? error.message : 'Failed to upload photos',
      };
    }
  }

  // Health check endpoint
  static async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest('/api/health');
  }
}