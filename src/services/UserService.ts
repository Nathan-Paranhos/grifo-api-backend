import * as admin from 'firebase-admin';
import { getDbSafe, isFirebaseInitialized } from '../config/firebase';
import logger from '../config/logger';
import { CustomError, createNotFoundError, createValidationError, createForbiddenError } from '../middlewares/errorHandler';

// Interface para evitar dependência circular
interface ICompanyService {
  incrementUsuarios(empresaId: string): Promise<void>;
  decrementUsuarios(empresaId: string): Promise<void>;
  canCreateUser(empresaId: string): Promise<boolean>;
  getCompanyById(id: string): Promise<{ id: string; status: string; [key: string]: unknown }>;
}

export interface User {
  uid: string;
  email: string;
  nome: string;
  telefone?: string;
  empresaId: string;
  papel: 'admin' | 'corretor' | 'leitor';
  ativo: boolean;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  lastLogin?: admin.firestore.Timestamp;
  avatar?: string;
  configuracoes?: {
    notificacoes: boolean;
    tema: 'light' | 'dark';
    idioma: string;
  };
}

export interface CreateUserData {
  email: string;
  nome: string;
  telefone?: string;
  empresaId: string;
  papel: 'admin' | 'corretor' | 'leitor';
  password: string;
}

export interface UpdateUserData {
  nome?: string;
  telefone?: string;
  papel?: 'admin' | 'corretor' | 'leitor';
  ativo?: boolean;
  configuracoes?: User['configuracoes'];
}

export class UserService {
  private db: admin.firestore.Firestore;
  private auth: admin.auth.Auth;
  private companyService: ICompanyService;
  private collection: admin.firestore.CollectionReference;

  constructor(companyService?: ICompanyService) {
    if (isFirebaseInitialized()) {
      const db = getDbSafe();
      if (db) {
        this.db = db;
        this.auth = admin.auth();
        this.collection = this.db.collection('usuarios');
      } else {
        throw new CustomError('Firebase não está disponível', 503);
      }
    } else {
      throw new CustomError('Firebase não foi inicializado', 503);
    }
    this.companyService = companyService || this.createCompanyService();
  }

  private createCompanyService(): ICompanyService {
    // Lazy loading para evitar dependência circular
    const { CompanyService } = require('./CompanyService');
    return new CompanyService();
  }

  /**
   * Criar novo usuário
   */
  async createUser(data: CreateUserData, createdBy: string): Promise<User> {
    try {
      // Verificar se a empresa pode criar mais usuários
      const canCreate = await this.companyService.canCreateUser(data.empresaId);
      if (!canCreate) {
        throw createForbiddenError('Limite de usuários atingido para esta empresa');
      }

      // Verificar se já existe usuário com este email
      const existingUser = await this.findByEmail(data.email);
      if (existingUser) {
        throw createValidationError('Já existe um usuário com este email');
      }

      // Criar usuário no Firebase Auth
      const userRecord = await this.auth.createUser({
        email: data.email,
        password: data.password,
        displayName: data.nome,
        emailVerified: false
      });

      // Definir claims customizados
      await this.auth.setCustomUserClaims(userRecord.uid, {
        empresaId: data.empresaId,
        papel: data.papel
      });

      // Criar documento no Firestore
      const userData: Omit<User, 'uid'> = {
        email: data.email,
        nome: data.nome,
        telefone: data.telefone,
        empresaId: data.empresaId,
        papel: data.papel,
        ativo: true,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        configuracoes: {
          notificacoes: true,
          tema: 'light',
          idioma: 'pt-BR'
        }
      };

      await this.collection.doc(userRecord.uid).set(userData);

      // Incrementar contador de usuários da empresa
      await this.companyService.incrementUsuarios(data.empresaId);

      const user: User = {
        uid: userRecord.uid,
        ...userData
      };

      logger.info(`Usuário criado:`, { 
        uid: userRecord.uid, 
        email: data.email, 
        empresaId: data.empresaId,
        createdBy 
      });

      return user;
    } catch (error) {
      logger.error('Erro ao criar usuário:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao criar usuário', 500);
    }
  }

  /**
   * Buscar usuário por UID
   */
  async getUserById(uid: string): Promise<User | null> {
    try {
      const doc = await this.collection.doc(uid).get();
      if (!doc.exists) {
        return null;
      }

      return {
        uid: doc.id,
        ...doc.data()
      } as User;
    } catch (error) {
      logger.error(`Erro ao buscar usuário ${uid}:`, error);
      throw new CustomError('Erro ao buscar usuário', 500);
    }
  }

  /**
   * Buscar usuário por email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const snapshot = await this.collection
        .where('email', '==', email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        uid: doc.id,
        ...doc.data()
      } as User;
    } catch (error) {
      logger.error(`Erro ao buscar usuário por email ${email}:`, error);
      throw new CustomError('Erro ao buscar usuário', 500);
    }
  }

  /**
   * Listar usuários por empresa
   */
  async getUsersByEmpresa(
    empresaId: string,
    options: {
      limit?: number;
      offset?: number;
      papel?: string;
      ativo?: boolean;
    } = {}
  ): Promise<User[]> {
    try {
      let query = this.collection
        .where('empresaId', '==', empresaId)
        .orderBy('createdAt', 'desc');

      if (options.papel) {
        query = query.where('papel', '==', options.papel);
      }

      if (options.ativo !== undefined) {
        query = query.where('ativo', '==', options.ativo);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.offset(options.offset);
      }

      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as User));
    } catch (error) {
      logger.error(`Erro ao listar usuários da empresa ${empresaId}:`, error);
      throw new CustomError('Erro ao listar usuários', 500);
    }
  }

  /**
   * Atualizar usuário
   */
  async updateUser(
    uid: string,
    data: UpdateUserData,
    updatedBy: string
  ): Promise<User> {
    try {
      const existingUser = await this.getUserById(uid);
      if (!existingUser) {
        throw createNotFoundError('Usuário não encontrado');
      }

      const updateData: Partial<User> = {
        updatedAt: admin.firestore.Timestamp.now()
      };

      if (data.nome) updateData.nome = data.nome;
      if (data.telefone !== undefined) updateData.telefone = data.telefone;
      if (data.ativo !== undefined) updateData.ativo = data.ativo;
      if (data.configuracoes) {
        updateData.configuracoes = {
          ...existingUser.configuracoes,
          ...data.configuracoes
        };
      }

      // Se está mudando o papel, atualizar claims
      if (data.papel && data.papel !== existingUser.papel) {
        await this.auth.setCustomUserClaims(uid, {
          empresaId: existingUser.empresaId,
          papel: data.papel
        });
        updateData.papel = data.papel;
      }

      // Se está mudando o nome, atualizar no Auth também
      if (data.nome && data.nome !== existingUser.nome) {
        await this.auth.updateUser(uid, {
          displayName: data.nome
        });
      }

      await this.collection.doc(uid).update(updateData);

      logger.info(`Usuário atualizado:`, { 
        uid, 
        changes: Object.keys(updateData),
        updatedBy 
      });

      return await this.getUserById(uid) as User;
    } catch (error) {
      logger.error(`Erro ao atualizar usuário ${uid}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao atualizar usuário', 500);
    }
  }

  /**
   * Desativar usuário
   */
  async deactivateUser(uid: string, deactivatedBy: string): Promise<User> {
    try {
      const user = await this.updateUser(uid, { ativo: false }, deactivatedBy);
      
      // Desabilitar no Firebase Auth também
      await this.auth.updateUser(uid, {
        disabled: true
      });

      // Decrementar contador de usuários da empresa
      await this.companyService.decrementUsuarios(user.empresaId);

      logger.info(`Usuário desativado:`, { uid, deactivatedBy });
      
      return user;
    } catch (error) {
      logger.error(`Erro ao desativar usuário ${uid}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao desativar usuário', 500);
    }
  }

  /**
   * Reativar usuário
   */
  async reactivateUser(uid: string, reactivatedBy: string): Promise<User> {
    try {
      const existingUser = await this.getUserById(uid);
      if (!existingUser) {
        throw createNotFoundError('Usuário não encontrado');
      }

      // Verificar se a empresa pode ter mais usuários
      const canCreate = await this.companyService.canCreateUser(existingUser.empresaId);
      if (!canCreate) {
        throw createForbiddenError('Limite de usuários atingido para esta empresa');
      }

      const user = await this.updateUser(uid, { ativo: true }, reactivatedBy);
      
      // Reabilitar no Firebase Auth também
      await this.auth.updateUser(uid, {
        disabled: false
      });

      // Incrementar contador de usuários da empresa
      await this.companyService.incrementUsuarios(user.empresaId);

      logger.info(`Usuário reativado:`, { uid, reactivatedBy });
      
      return user;
    } catch (error) {
      logger.error(`Erro ao reativar usuário ${uid}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao reativar usuário', 500);
    }
  }

  /**
   * Deletar usuário permanentemente
   */
  async deleteUser(uid: string, deletedBy: string): Promise<boolean> {
    try {
      const existingUser = await this.getUserById(uid);
      if (!existingUser) {
        throw createNotFoundError('Usuário não encontrado');
      }

      // Deletar do Firebase Auth
      await this.auth.deleteUser(uid);

      // Deletar do Firestore
      await this.collection.doc(uid).delete();

      // Se estava ativo, decrementar contador
      if (existingUser.ativo) {
        await this.companyService.decrementUsuarios(existingUser.empresaId);
      }

      logger.info(`Usuário deletado permanentemente:`, { uid, deletedBy });
      
      return true;
    } catch (error) {
      logger.error(`Erro ao deletar usuário ${uid}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao deletar usuário', 500);
    }
  }

  /**
   * Atualizar último login
   */
  async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.collection.doc(uid).update({
        lastLogin: admin.firestore.Timestamp.now()
      });
    } catch (error) {
      logger.error(`Erro ao atualizar último login do usuário ${uid}:`, error);
      // Não propagar erro para não afetar o login
    }
  }

  /**
   * Verificar se usuário tem permissão para ação
   */
  async hasPermission(
    uid: string,
    action: 'create' | 'read' | 'update' | 'delete',
    resource: 'user' | 'inspection' | 'company' | 'report'
  ): Promise<boolean> {
    try {
      const user = await this.getUserById(uid);
      if (!user || !user.ativo) {
        return false;
      }

      // Admins têm todas as permissões
      if (user.papel === 'admin') {
        return true;
      }

      // Corretores podem criar/ler/atualizar vistorias e ler relatórios
      if (user.papel === 'corretor') {
        if (resource === 'inspection') {
          return ['create', 'read', 'update'].includes(action);
        }
        if (resource === 'report') {
          return action === 'read';
        }
        return false;
      }

      // Leitores só podem ler
      if (user.papel === 'leitor') {
        return action === 'read' && ['inspection', 'report'].includes(resource);
      }

      return false;
    } catch (error) {
      logger.error(`Erro ao verificar permissão do usuário ${uid}:`, error);
      return false;
    }
  }

  /**
   * Buscar estatísticas de usuários por empresa
   */
  async getUserStats(empresaId: string) {
    try {
      const [totalSnapshot, activeSnapshot, adminSnapshot, corretorSnapshot] = await Promise.all([
        this.collection.where('empresaId', '==', empresaId).get(),
        this.collection.where('empresaId', '==', empresaId).where('ativo', '==', true).get(),
        this.collection.where('empresaId', '==', empresaId).where('papel', '==', 'admin').get(),
        this.collection.where('empresaId', '==', empresaId).where('papel', '==', 'corretor').get()
      ]);

      return {
        total: totalSnapshot.size,
        ativos: activeSnapshot.size,
        inativos: totalSnapshot.size - activeSnapshot.size,
        admins: adminSnapshot.size,
        corretores: corretorSnapshot.size,
        leitores: totalSnapshot.size - adminSnapshot.size - corretorSnapshot.size
      };
    } catch (error) {
      logger.error(`Erro ao buscar estatísticas de usuários da empresa ${empresaId}:`, error);
      throw new CustomError('Erro ao buscar estatísticas', 500);
    }
  }

  /**
   * Resetar senha do usuário
   */
  async resetPassword(email: string): Promise<boolean> {
    try {
      // Gerar link de reset de senha
      const link = await this.auth.generatePasswordResetLink(email);
      
      // Aqui você poderia enviar o email com o link
      // Por enquanto, apenas logamos
      logger.info(`Link de reset de senha gerado para ${email}:`, { link });
      
      return true;
    } catch (error) {
      logger.error(`Erro ao resetar senha para ${email}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao resetar senha', 500);
    }
  }
}