import { Pool, PoolClient } from 'pg';
import logger from './logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

class DatabaseManager {
  private pool: Pool | null = null;
  private isConnected = false;

  public async initialize(): Promise<void> {
    try {
      const config: DatabaseConfig = {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432'),
        database: process.env.DATABASE_NAME || 'grifo_db',
        user: process.env.DATABASE_USER || 'postgres',
        password: process.env.DATABASE_PASSWORD || '',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20, // máximo de conexões no pool
        idleTimeoutMillis: 30000, // tempo limite para conexões inativas
        connectionTimeoutMillis: 2000, // tempo limite para estabelecer conexão
      };

      // Se não há URL de banco configurada, não inicializa
      if (!process.env.DATABASE_URL && !process.env.DATABASE_PASSWORD) {
        logger.warn('Configurações de banco PostgreSQL não encontradas. Usando apenas Firebase.');
        this.isConnected = false;
        return;
      }

      // Se há DATABASE_URL, usa ela (comum em produção)
      if (process.env.DATABASE_URL) {
        this.pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        });
      } else {
        this.pool = new Pool(config);
      }

      this.pool.on('connect', () => {
        logger.info('Nova conexão PostgreSQL estabelecida');
      });

      this.pool.on('error', (err) => {
        logger.error('Erro no pool de conexões PostgreSQL:', err);
        this.isConnected = false;
      });

      // Testa conexão com timeout
      await Promise.race([
        this.testConnection(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout na conexão do banco')), 5000)
        )
      ]);
      logger.info('Database PostgreSQL inicializado com sucesso');

    } catch (error) {
      logger.error('Erro ao inicializar banco PostgreSQL:', error);
      logger.warn('Continuando sem PostgreSQL - usando apenas Firebase');
      this.isConnected = false;
      this.pool = null;
    }
  }

  private async testConnection(): Promise<void> {
    if (!this.pool) return;

    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      this.isConnected = true;
      logger.info('Conexão PostgreSQL estabelecida com sucesso');
    } catch (error) {
      logger.error('Erro ao testar conexão PostgreSQL:', error);
      this.isConnected = false;
    }
  }

  public async getClient(): Promise<PoolClient | null> {
    if (!this.pool || !this.isConnected) {
      logger.warn('Pool PostgreSQL não disponível');
      return null;
    }

    try {
      return await this.pool.connect();
    } catch (error) {
      logger.error('Erro ao obter cliente PostgreSQL:', error);
      return null;
    }
  }

  public async query(text: string, params?: any[]): Promise<any> {
    if (!this.pool || !this.isConnected) {
      throw new Error('Banco PostgreSQL não disponível');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool || !this.isConnected) {
      throw new Error('Banco PostgreSQL não disponível');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public isAvailable(): boolean {
    return this.isConnected && this.pool !== null;
  }

  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.isConnected = false;
      logger.info('Pool PostgreSQL fechado');
    }
  }

  // Métodos específicos para o sistema Grifo
  public async getEmpresaById(empresaId: string): Promise<any> {
    const result = await this.query(
      'SELECT * FROM empresas WHERE id = $1 AND ativo = true',
      [empresaId]
    );
    return result.rows[0] || null;
  }

  public async getUsersByEmpresa(empresaId: string): Promise<any[]> {
    const result = await this.query(
      'SELECT * FROM usuarios WHERE empresa_id = $1 AND ativo = true ORDER BY nome',
      [empresaId]
    );
    return result.rows;
  }

  public async getInspectionsByEmpresa(empresaId: string, limit = 50, offset = 0): Promise<any[]> {
    const result = await this.query(
      'SELECT * FROM vistorias WHERE empresa_id = $1 ORDER BY criado_em DESC LIMIT $2 OFFSET $3',
      [empresaId, limit, offset]
    );
    return result.rows;
  }

  public async getDashboardStats(empresaId: string, vistoriadorId?: string): Promise<any> {
    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Pendente' THEN 1 END) as pendentes,
        COUNT(CASE WHEN status = 'Concluída' THEN 1 END) as concluidas,
        COUNT(CASE WHEN status = 'Em Andamento' THEN 1 END) as em_andamento,
        COUNT(CASE WHEN status = 'Cancelada' THEN 1 END) as canceladas
      FROM vistorias 
      WHERE empresa_id = $1
    `;
    
    const params = [empresaId];
    
    if (vistoriadorId) {
      query += ' AND vistoriador_id = $2';
      params.push(vistoriadorId);
    }

    const result = await this.query(query, params);
    return result.rows[0];
  }

  // Buscar usuários com paginação
  public async getUsers(empresaId: string, options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    ativo?: boolean;
  } = {}): Promise<{ users: any[]; total: number }> {
    if (!this.pool || !this.isConnected) {
      throw new Error('Banco PostgreSQL não disponível');
    }

    const { page = 1, limit = 10, search = '', role = '', ativo } = options;
    const offset = (page - 1) * limit;

    const client = await this.pool.connect();
    try {
      let whereClause = 'WHERE empresa_id = $1';
      const params: any[] = [empresaId];
      let paramIndex = 2;

      if (search) {
        whereClause += ` AND (nome ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (role) {
        whereClause += ` AND role = $${paramIndex}`;
        params.push(role);
        paramIndex++;
      }

      if (ativo !== undefined) {
        whereClause += ` AND ativo = $${paramIndex}`;
        params.push(ativo);
        paramIndex++;
      }

      // Buscar total de registros
      const countQuery = `SELECT COUNT(*) as total FROM usuarios ${whereClause}`;
      const countResult = await client.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);

      // Buscar usuários com paginação
      const usersQuery = `
        SELECT id, nome, email, role, telefone, ativo, ultimo_login, criado_em, atualizado_em
        FROM usuarios 
        ${whereClause}
        ORDER BY criado_em DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      params.push(limit, offset);

      const usersResult = await client.query(usersQuery, params);
      
      return {
        users: usersResult.rows,
        total
      };
    } finally {
      client.release();
    }
  }

  // Criar usuário
  public async createUser(userData: {
    empresaId: string;
    firebaseUid?: string;
    nome: string;
    email: string;
    role: string;
    telefone?: string;
    ativo?: boolean;
  }): Promise<any> {
    if (!this.pool || !this.isConnected) {
      throw new Error('Banco PostgreSQL não disponível');
    }

    const client = await this.pool.connect();
    try {
      const query = `
        INSERT INTO usuarios (empresa_id, firebase_uid, nome, email, role, telefone, ativo)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        userData.empresaId,
        userData.firebaseUid || null,
        userData.nome,
        userData.email,
        userData.role,
        userData.telefone || null,
        userData.ativo !== undefined ? userData.ativo : true
      ];

      const result = await client.query(query, values);
      return result.rows[0];
    } finally {
      client.release();
    }
  }
}

const databaseManager = new DatabaseManager();

export const initializeDatabase = async () => {
  await databaseManager.initialize();
};

export default databaseManager;
export { DatabaseManager };