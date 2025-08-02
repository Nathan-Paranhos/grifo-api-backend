import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { UserService } from '../services/UserService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middlewares/auth';
import logger from '../config/logger';
import { CustomError, createValidationError, createAuthError } from '../middlewares/errorHandler';

export class AuthController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Verificar token Firebase e extrair claims
   */
  verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      if (!token) {
        throw createValidationError('Token é obrigatório');
      }

      // Verificar token no Firebase
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Buscar dados do usuário no Firestore
      const user = await this.userService.getUserById(decodedToken.uid);
      
      if (!user) {
        throw createAuthError('Usuário não encontrado');
      }

      if (!user.ativo) {
        throw createAuthError('Usuário desativado');
      }

      // Atualizar último login
      await this.userService.updateLastLogin(decodedToken.uid);

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
    } catch (error) {
      logger.error('Erro na verificação do token:', error);
      
      if (error instanceof CustomError) {
        return next(error);
      }
      
      // Erros específicos do Firebase Auth
      if (error.code) {
        switch (error.code) {
          case 'auth/id-token-expired':
            return next(createAuthError('Token expirado'));
          case 'auth/id-token-revoked':
            return next(createAuthError('Token revogado'));
          case 'auth/invalid-id-token':
            return next(createAuthError('Token inválido'));
          default:
            return next(createAuthError('Erro na autenticação'));
        }
      }
      
      next(new CustomError('Erro interno na verificação do token', 500));
    }
  };

  /**
   * Obter dados do usuário autenticado
   */
  getMe = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid } = req.user!;

      const user = await this.userService.getUserById(uid);
      
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
    } catch (error) {
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
      const user = await this.userService.getUserById(uid);
      
      if (!user) {
        throw createAuthError('Usuário não encontrado');
      }

      if (!user.ativo) {
        throw createAuthError('Usuário desativado');
      }

      // Atualizar claims customizados no Firebase
      await admin.auth().setCustomUserClaims(uid, {
        empresaId: user.empresaId,
        papel: user.papel
      });

      logger.info(`Claims atualizados:`, { uid, empresaId: user.empresaId, papel: user.papel });
      
      return sendSuccess(res, {
        uid: user.uid,
        empresaId: user.empresaId,
        papel: user.papel,
        updatedAt: new Date().toISOString()
      }, 'Claims atualizados com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout (revogar token)
   */
  logout = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid } = req.user!;

      // Revogar todos os tokens do usuário
      await admin.auth().revokeRefreshTokens(uid);

      logger.info(`Logout realizado:`, { uid });
      
      return sendSuccess(res, null, 'Logout realizado com sucesso');
    } catch (error) {
      logger.error('Erro no logout:', error);
      next(new CustomError('Erro no logout', 500));
    }
  };

  /**
   * Verificar se o usuário tem permissão para acessar um recurso
   */
  checkPermission = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid } = req.user!;
      const { action, resource } = req.query;

      if (!action || !resource) {
        throw createValidationError('Action e resource são obrigatórios');
      }

      const hasPermission = await this.userService.hasPermission(
        uid,
        action as any,
        resource as any
      );
      
      return sendSuccess(res, { hasPermission }, 'Permissão verificada');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Solicitar reset de senha
   */
  requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw createValidationError('Email é obrigatório');
      }

      // Verificar se o usuário existe
      const user = await this.userService.findByEmail(email);
      if (!user) {
        // Por segurança, não revelar se o email existe ou não
        return sendSuccess(res, null, 'Se o email existir, um link de reset será enviado');
      }

      if (!user.ativo) {
        throw createAuthError('Usuário desativado');
      }

      // Gerar link de reset
      await this.userService.resetPassword(email);
      
      logger.info(`Reset de senha solicitado:`, { email });
      
      return sendSuccess(res, null, 'Link de reset de senha enviado com sucesso');
    } catch (error) {
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
      const user = await this.userService.getUserById(uid);
      
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
    } catch (error) {
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
    } catch (error) {
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

      const user = await this.userService.updateUser(uid, { configuracoes }, uid);
      
      logger.info(`Configurações de auth atualizadas:`, { uid });
      
      return sendSuccess(res, {
        uid: user.uid,
        configuracoes: user.configuracoes
      }, 'Configurações atualizadas com sucesso');
    } catch (error) {
      next(error);
    }
  };
}