import logger from './logger';

// Configuração do portal web
interface PortalConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  enabled: boolean;
}

class PortalManager {
  private config: PortalConfig;
  private isConnected: boolean = false;

  constructor() {
    this.config = {
      baseUrl: process.env.PORTAL_BASE_URL || 'https://portal.grifo.com',
      apiKey: process.env.PORTAL_API_KEY || '',
      timeout: parseInt(process.env.PORTAL_TIMEOUT || '30000'),
      retryAttempts: parseInt(process.env.PORTAL_RETRY_ATTEMPTS || '3'),
      enabled: process.env.PORTAL_ENABLED === 'true'
    };
  }

  public async initialize() {
    if (!this.config.enabled) {
      logger.info('Portal integration disabled');
      return;
    }

    if (!this.config.apiKey) {
      logger.warn('Portal API key not configured');
      return;
    }

    try {
      await this.testConnection();
      this.isConnected = true;
      logger.info('Portal connection established successfully');
    } catch (error) {
      logger.error('Failed to connect to portal', { error });
      this.isConnected = false;
    }
  }

  private async testConnection(): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(`Portal health check failed: ${response.status}`);
    }
  }

  public isAvailable(): boolean {
    return this.config.enabled && this.isConnected;
  }

  public getConfig(): PortalConfig {
    return { ...this.config };
  }

  // Sincronizar dados com o portal
  public async syncData(type: string, data: any): Promise<any> {
    if (!this.isAvailable()) {
      throw new Error('Portal not available');
    }

    const url = `${this.config.baseUrl}/api/sync/${type}`;
    
    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data),
          signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
          throw new Error(`Portal sync failed: ${response.status}`);
        }

        const result = await response.json();
        logger.info(`Data synced with portal successfully`, { type, attempt });
        return result;
      } catch (error) {
        logger.warn(`Portal sync attempt ${attempt} failed`, { type, error });
        
        if (attempt === this.config.retryAttempts) {
          throw error;
        }
        
        // Aguardar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Buscar dados do portal
  public async fetchData(endpoint: string, params?: Record<string, any>): Promise<any> {
    if (!this.isAvailable()) {
      throw new Error('Portal not available');
    }

    const url = new URL(`${this.config.baseUrl}/api/${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(`Portal fetch failed: ${response.status}`);
    }

    return await response.json();
  }

  // Enviar notificação para o portal
  public async sendNotification(notification: {
    empresaId: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }): Promise<void> {
    if (!this.isAvailable()) {
      logger.warn('Portal not available, notification not sent', { notification });
      return;
    }

    try {
      await this.syncData('notifications', notification);
      logger.info('Notification sent to portal', { notification });
    } catch (error) {
      logger.error('Failed to send notification to portal', { error, notification });
    }
  }

  // Sincronizar vistoria com o portal
  public async syncInspection(inspection: any): Promise<void> {
    if (!this.isAvailable()) {
      logger.warn('Portal not available, inspection not synced', { inspectionId: inspection.id });
      return;
    }

    try {
      await this.syncData('inspections', inspection);
      logger.info('Inspection synced with portal', { inspectionId: inspection.id });
    } catch (error) {
      logger.error('Failed to sync inspection with portal', { error, inspectionId: inspection.id });
    }
  }

  // Sincronizar usuário com o portal
  public async syncUser(user: any): Promise<void> {
    if (!this.isAvailable()) {
      logger.warn('Portal not available, user not synced', { userId: user.id });
      return;
    }

    try {
      await this.syncData('users', user);
      logger.info('User synced with portal', { userId: user.id });
    } catch (error) {
      logger.error('Failed to sync user with portal', { error, userId: user.id });
    }
  }

  // Buscar configurações da empresa do portal
  public async getCompanySettings(empresaId: string): Promise<any> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const settings = await this.fetchData(`companies/${empresaId}/settings`);
      logger.info('Company settings retrieved from portal', { empresaId });
      return settings;
    } catch (error) {
      logger.error('Failed to get company settings from portal', { error, empresaId });
      return null;
    }
  }

  // Verificar status da conexão
  public async checkConnection(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }

    try {
      await this.testConnection();
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  // Reconectar ao portal
  public async reconnect(): Promise<void> {
    logger.info('Attempting to reconnect to portal');
    await this.initialize();
  }
}

const portalManager = new PortalManager();

export const initializePortal = async () => {
  await portalManager.initialize();
};

export default portalManager;
export { PortalManager, PortalConfig };