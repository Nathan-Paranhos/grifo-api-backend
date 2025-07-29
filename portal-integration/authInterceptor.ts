import { auth } from './firebase';

/**
 * Interceptor de autenticação para anexar automaticamente o token Firebase
 * a todas as requisições para a API
 */
export class AuthInterceptor {
  private static instance: AuthInterceptor;
  private token: string | null = null;

  private constructor() {
    // Escutar mudanças no estado de autenticação
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          this.token = await user.getIdToken();
          console.log('Token de autenticação atualizado');
        } catch (error) {
          console.error('Erro ao obter token:', error);
          this.token = null;
        }
      } else {
        this.token = null;
        console.log('Usuário deslogado, token removido');
      }
    });
  }

  public static getInstance(): AuthInterceptor {
    if (!AuthInterceptor.instance) {
      AuthInterceptor.instance = new AuthInterceptor();
    }
    return AuthInterceptor.instance;
  }

  /**
   * Obtém o token atual do usuário autenticado
   */
  public async getToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      try {
        // Sempre obter um token fresco para garantir que não está expirado
        this.token = await user.getIdToken(true);
        return this.token;
      } catch (error) {
        console.error('Erro ao obter token fresco:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Adiciona o header de autorização a uma requisição
   */
  public async addAuthHeader(headers: Record<string, string> = {}): Promise<Record<string, string>> {
    const token = await this.getToken();
    if (token) {
      return {
        ...headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
    return {
      ...headers,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Verifica se o usuário está autenticado
   */
  public isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  /**
   * Obtém informações do usuário atual
   */
  public getCurrentUser() {
    return auth.currentUser;
  }
}

// Instância singleton do interceptor
export const authInterceptor = AuthInterceptor.getInstance();

/**
 * Função utilitária para fazer requisições autenticadas
 */
export const authenticatedFetch = async (
  url: string, 
  options: RequestInit = {}
): Promise<Response> => {
  const headers = await authInterceptor.addAuthHeader(
    options.headers as Record<string, string> || {}
  );

  const authenticatedOptions: RequestInit = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, authenticatedOptions);
    
    // Se receber 401, o token pode estar expirado
    if (response.status === 401) {
      console.warn('Token expirado ou inválido, tentando renovar...');
      
      // Tentar obter um novo token
      const newToken = await authInterceptor.getToken();
      if (newToken) {
        // Tentar novamente com o novo token
        const newHeaders = await authInterceptor.addAuthHeader(
          options.headers as Record<string, string> || {}
        );
        
        const retryOptions: RequestInit = {
          ...options,
          headers: newHeaders
        };
        
        return fetch(url, retryOptions);
      }
    }
    
    return response;
  } catch (error) {
    console.error('Erro na requisição autenticada:', error);
    throw error;
  }
};