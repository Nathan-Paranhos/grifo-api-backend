import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { UserService } from '../services/UserService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middlewares/auth';
import logger from '../config/logger';
import { CustomError, createAuthError, createValidationError } from '../middlewares/errorHandler';
import { isFirebaseInitialized } from '../config/firebase';

export class AuthController {
  private static instance: AuthController;

  private userService: UserService | null = null;

  private getUserService(): UserService {
    if (!this.userService) {
      this.userService = new UserService();
    }
    return this.userService;
  }

  /**
   * Verificar token Firebase e extrair claims
   */
  verifyToken = async (req: Request, res: Response) => {
    try {
      const { token, firebaseToken } = req.body;
      const authToken = token || firebaseToken;

      if (!authToken) {
        throw createValidationError('Token é obrigatório');
      }

      // Verificar se o Firebase foi inicializado
      if (!isFirebaseInitialized()) {
        logger.warn('Firebase não inicializado - retornando dados mock para desenvolvimento');
        return sendSuccess(res, {
          uid: 'dev-user-id',
          email: 'dev@example.com',
          empresaId: 'dev-empresa-id',
          papel: 'admin',
          ativo: true,
          nome: 'Usuário de Desenvolvimento'
        });
      }

      // Verificar token no Firebase
      const decodedToken = await admin.auth().verifyIdToken(authToken);
      
      // Buscar dados do usuário no Firestore
      const user = await this.getUserService().getUserById(decodedToken.uid);
      
      if (!user) {
        throw createAuthError('Usuário não encontrado');
      }

      if (!user.ativo) {
        throw createAuthError('Usuário desativado');
      }

      // Verificar e atualizar custom claims se necessário
      const currentClaims = decodedToken.empresaId && decodedToken.papel;
      if (!currentClaims || decodedToken.empresaId !== user.empresaId || decodedToken.papel !== user.papel) {
        await admin.auth().setCustomUserClaims(decodedToken.uid, {
          empresaId: user.empresaId,
          papel: user.papel
        });
      }

      // Atualizar último login
      await this.getUserService().updateLastLogin(decodedToken.uid);

      // Preparar dados de resposta
      const userData = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        nome: user.nome,
        empresaId: user.empresaId,
        papel: user.papel,
        configuracoes: user.configuracoes,
        lastLogin: new Date().toISOString(),
        claims: {
          empresaId: decodedToken.empresaId || user.empresaId,
          papel: decodedToken.papel || user.papel
        }
      };

      logger.info(`Login realizado:`, { 
        uid: decodedToken.uid, 
        email: decodedToken.email,
        empresaId: user.empresaId 
      });
      
      return sendSuccess(res, userData, 'Token verificado com sucesso');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao validar token';
      logger.error('Erro ao validar token:', { error: errorMessage });
      return sendError(res, 'Token inválido ou expirado.', 401);
    }
  };

  /**
   * Obter dados do usuário autenticado
   */
  getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid } = req.user!;

      const user = await this.getUserService().getUserById(uid);
      
      if (!user) {
        throw createAuthError('Usuário não encontrado');
      }

      if (!user.ativo) {
        throw createAuthError('Usuário desativado');
      }

      // Preparar dados de resposta (sem informações sensíveis)
      const userData = {
        uid: user.uid,
        email: user.email,
        nome: user.nome,
        telefone: user.telefone,
        empresaId: user.empresaId,
        papel: user.papel,
        configuracoes: user.configuracoes,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      };
      
      return sendSuccess(res, userData, 'Dados do usuário obtidos com sucesso');
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Refresh token (renovar claims customizados)
   */
  refreshToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid } = req.user!;

      // Buscar dados atualizados do usuário
      const user = await this.getUserService().getUserById(uid);
      
      if (!user) {
        throw createAuthError('Usuário não encontrado');
      }

      if (!user.ativo) {
        throw createAuthError('Usuário desativado');
      }

      // Atualizar claims customizados no Firebase (se inicializado)
      if (isFirebaseInitialized()) {
        await admin.auth().setCustomUserClaims(uid, {
          empresaId: user.empresaId,
          papel: user.papel
        });
      } else {
        logger.warn('Firebase não inicializado - pulando atualização de claims');
      }

      logger.info(`Claims atualizados:`, { uid, empresaId: user.empresaId, papel: user.papel });
      
      return sendSuccess(res, {
        uid: user.uid,
        empresaId: user.empresaId,
        papel: user.papel,
        updatedAt: new Date().toISOString()
      }, 'Claims atualizados com sucesso');
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Registrar novo usuário
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, nome, telefone, empresaId } = req.body;

      if (!email || !password || !nome) {
        throw createValidationError('Email, senha e nome são obrigatórios');
      }

      // Verificar se o usuário já existe
      const existingUser = await this.getUserService().findByEmail(email);
      if (existingUser) {
        throw createValidationError('Usuário já existe com este email');
      }

      // Criar usuário no Firebase (se inicializado)
      let firebaseUser;
      if (isFirebaseInitialized()) {
        firebaseUser = await admin.auth().createUser({
          email,
          password,
          displayName: nome
        });
      } else {
        logger.warn('Firebase não inicializado - criando usuário mock');
        firebaseUser = { uid: `mock-${Date.now()}` };
      }

      // Criar usuário no banco de dados
      const userData = {
        email,
        nome,
        telefone: telefone || '',
        empresaId: empresaId || 'default-empresa',
        papel: 'corretor' as const,
        password
      };

      const user = await this.getUserService().createUser(userData, firebaseUser.uid);
      
      logger.info(`Usuário registrado:`, { uid: firebaseUser.uid, email });
      
      return sendSuccess(res, {
        uid: user.uid,
        email: user.email,
        nome: user.nome,
        empresaId: user.empresaId
      }, 'Usuário registrado com sucesso', 201);
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Logout (revogar token)
   */
  logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid } = req.user!;

      // Revogar todos os tokens do usuário (se Firebase inicializado)
      if (isFirebaseInitialized()) {
        await admin.auth().revokeRefreshTokens(uid);
      } else {
        logger.warn('Firebase não inicializado - pulando revogação de tokens');
      }

      logger.info(`Logout realizado:`, { uid });
      
      return sendSuccess(res, null, 'Logout realizado com sucesso');
    } catch (error: unknown) {
      logger.error('Erro no logout:', error);
      next(new CustomError('Erro no logout', 500));
    }
  };

  /**
   * Verificar se o usuário tem permissão para acessar um recurso
   */
  checkPermission = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const permissionSchema = z.object({
        action: z.enum(['create', 'read', 'update', 'delete']),
        resource: z.enum(['user', 'company', 'inspection']),
      });

      const { uid } = req.user!;
      const { action, resource } = permissionSchema.parse(req.query);

      const hasPermission = await this.getUserService().hasPermission(uid, action, resource);
      
      return sendSuccess(res, { hasPermission }, 'Permissão verificada');
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Solicitar reset de senha
   */
  requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const emailSchema = z.object({ email: z.string().email('Email inválido') });
      const { email } = emailSchema.parse(req.body);

      // Verificar se o usuário existe
      const user = await this.getUserService().findByEmail(email);
      if (!user) {
        // Por segurança, não revelar se o email existe ou não
        return sendSuccess(res, null, 'Se o email existir, um link de reset será enviado');
      }

      if (!user.ativo) {
        throw createAuthError('Usuário desativado');
      }

      // Gerar link de reset
      await this.getUserService().resetPassword(email);
      
      logger.info(`Reset de senha solicitado:`, { email });
      
      return sendSuccess(res, null, 'Link de reset de senha enviado com sucesso');
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Validar sessão do usuário
   */
  validateSession = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid, empresaId, papel } = req.user!;

      // Verificar se o usuário ainda existe e está ativo
      const user = await this.getUserService().getUserById(uid);
      
      if (!user) {
        throw createAuthError('Usuário não encontrado');
      }

      if (!user.ativo) {
        throw createAuthError('Usuário desativado');
      }

      // Verificar se os dados da sessão ainda são válidos
      if (user.empresaId !== empresaId || user.papel !== papel) {
        throw createAuthError('Sessão inválida, faça login novamente');
      }

      return sendSuccess(res, {
        valid: true,
        uid: user.uid,
        empresaId: user.empresaId,
        papel: user.papel,
        lastValidation: new Date().toISOString()
      }, 'Sessão válida');
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Obter informações da empresa do usuário
   */
  getCompanyInfo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId } = req.user!;

      // Aqui você pode buscar informações da empresa
      // Por enquanto, retornamos apenas o ID
      const companyInfo = {
        empresaId,
        // Adicionar mais campos conforme necessário
      };
      
      return sendSuccess(res, companyInfo, 'Informações da empresa obtidas');
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Atualizar configurações de autenticação do usuário
   */
  updateAuthSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid } = req.user!;
      const { configuracoes } = req.body;

      if (!configuracoes) {
        throw createValidationError('Configurações são obrigatórias');
      }

      const user = await this.getUserService().updateUser(uid, { configuracoes }, uid);
      
      logger.info(`Configurações de auth atualizadas:`, { uid });
      
      return sendSuccess(res, {
        uid: user.uid,
        configuracoes: user.configuracoes
      }, 'Configurações atualizadas com sucesso');
    } catch (error: unknown) {
      next(error);
    }
  };

  public static getInstance(): AuthController {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }
}

export const authController = AuthController.getInstance();