import api from './api';

export interface User {
  id: string;
  empresaId: string;
  nome: string;
  email: string;
  role: 'admin' | 'vistoriador' | 'usuario';
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  role?: string;
  ativo?: boolean;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class UserService {
  /**
   * Busca usuários com filtros
   */
  async getUsers(filters: UserFilters = {}): Promise<User[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters.role) {
        params.append('role', filters.role);
      }
      if (filters.ativo !== undefined) {
        params.append('ativo', filters.ativo.toString());
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }

      const response = await api.get<ApiResponse<User[]>>(`/api/v1/users?${params.toString()}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Erro ao buscar usuários');
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      throw error;
    }
  }

  /**
   * Busca um usuário específico por ID
   */
  async getUserById(id: string): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>(`/api/v1/users/${id}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Usuário não encontrado');
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  }

  /**
   * Cria um novo usuário
   */
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const response = await api.post<ApiResponse<User>>('/api/v1/users', userData);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      
      throw new Error(response.data.error || 'Erro ao criar usuário');
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  /**
   * Atualiza um usuário existente
   */
  async updateUser(id: string, updateData: Partial<User>): Promise<void> {
    try {
      const response = await api.put<ApiResponse<null>>(`/api/v1/users/${id}`, updateData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao atualizar usuário');
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  /**
   * Busca apenas vistoriadores
   */
  async getSurveyors(): Promise<User[]> {
    try {
      return await this.getUsers({ role: 'vistoriador', ativo: true });
    } catch (error) {
      console.error('Erro ao buscar vistoriadores:', error);
      return [];
    }
  }

  /**
   * Conta o número de vistoriadores ativos
   */
  async getSurveyorCount(): Promise<number> {
    try {
      const surveyors = await this.getSurveyors();
      return surveyors.length;
    } catch (error) {
      console.error('Erro ao contar vistoriadores:', error);
      return 0;
    }
  }
}

export const userService = new UserService();
export default userService;