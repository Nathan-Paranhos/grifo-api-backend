import { Request, Response, NextFunction } from 'express';
import { UserService, CreateUserData, UpdateUserData } from '../services/UserService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middlewares/auth';
import logger from '../config/logger';
import { CustomError, createValidationError, createForbiddenError } from '../middlewares/errorHandler';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Criar novo usuário
   */
  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid, papel } = req.user!;
      
      // Apenas admins podem criar usuários
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem criar usuários');
      }

      const data: CreateUserData = req.body;
      
      // Garantir que o usuário seja criado para a empresa do admin
      data.empresaId = empresaId;

      const user = await this.userService.createUser(data, uid);
      
      // Remover dados sensíveis da resposta
      const { ...userResponse } = user;
      
      logger.info(`Usuário criado:`, { uid: user.uid, email: data.email, empresaId, createdBy: uid });
      
      return sendSuccess(res, userResponse, 'Usuário criado com sucesso', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar usuário por UID
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid: currentUid, papel } = req.user!;
      const { uid } = req.params;

      const user = await this.userService.getUserById(uid);
      
      if (!user) {
        return sendError(res, 'Usuário não encontrado', 404);
      }

      // Verificar se o usuário pode ver este perfil
      if (papel !== 'admin' && user.uid !== currentUid) {
        throw createForbiddenError('Você só pode ver seu próprio perfil');
      }

      // Verificar se é da mesma empresa
      if (user.empresaId !== empresaId) {
        throw createForbiddenError('Usuário não pertence à sua empresa');
      }
      
      return sendSuccess(res, user, 'Usuário encontrado');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar perfil do usuário atual
   */
  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid } = req.user!;

      const user = await this.userService.getUserById(uid);
      
      if (!user) {
        return sendError(res, 'Usuário não encontrado', 404);
      }
      
      return sendSuccess(res, user, 'Perfil do usuário');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Listar usuários da empresa
   */
  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, papel } = req.user!;
      
      // Apenas admins podem listar usuários
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem listar usuários');
      }

      const {
        limit = '20',
        offset = '0',
        papel: filterPapel,
        ativo
      } = req.query;

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        papel: filterPapel as string,
        ativo: ativo !== undefined ? ativo === 'true' : undefined
      };

      const users = await this.userService.getUsersByEmpresa(empresaId, options);
      
      return sendSuccess(res, users, 'Usuários listados com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Atualizar usuário
   */
  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid: currentUid, papel } = req.user!;
      const { uid } = req.params;
      const data: UpdateUserData = req.body;

      // Verificar se o usuário pode editar este perfil
      if (papel !== 'admin' && uid !== currentUid) {
        throw createForbiddenError('Você só pode editar seu próprio perfil');
      }

      // Verificar se o usuário existe e é da mesma empresa
      const existingUser = await this.userService.getUserById(uid);
      if (!existingUser) {
        return sendError(res, 'Usuário não encontrado', 404);
      }

      if (existingUser.empresaId !== empresaId) {
        throw createForbiddenError('Usuário não pertence à sua empresa');
      }

      // Usuários normais não podem alterar papel ou status ativo
      if (papel !== 'admin') {
        delete data.papel;
        delete data.ativo;
      }

      const user = await this.userService.updateUser(uid, data, currentUid);
      
      logger.info(`Usuário atualizado:`, { uid, updatedBy: currentUid });
      
      return sendSuccess(res, user, 'Usuário atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Atualizar perfil do usuário atual
   */
  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid } = req.user!;
      const data: UpdateUserData = req.body;

      // Remover campos que o usuário não pode alterar em seu próprio perfil
      delete data.papel;
      delete data.ativo;

      const user = await this.userService.updateUser(uid, data, uid);
      
      logger.info(`Perfil atualizado:`, { uid });
      
      return sendSuccess(res, user, 'Perfil atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Desativar usuário
   */
  deactivate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid: currentUid, papel } = req.user!;
      const { uid } = req.params;

      // Apenas admins podem desativar usuários
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem desativar usuários');
      }

      // Não pode desativar a si mesmo
      if (uid === currentUid) {
        throw createValidationError('Você não pode desativar sua própria conta');
      }

      // Verificar se o usuário existe e é da mesma empresa
      const existingUser = await this.userService.getUserById(uid);
      if (!existingUser) {
        return sendError(res, 'Usuário não encontrado', 404);
      }

      if (existingUser.empresaId !== empresaId) {
        throw createForbiddenError('Usuário não pertence à sua empresa');
      }

      const user = await this.userService.deactivateUser(uid, currentUid);
      
      logger.info(`Usuário desativado:`, { uid, deactivatedBy: currentUid });
      
      return sendSuccess(res, user, 'Usuário desativado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reativar usuário
   */
  reactivate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid: currentUid, papel } = req.user!;
      const { uid } = req.params;

      // Apenas admins podem reativar usuários
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem reativar usuários');
      }

      // Verificar se o usuário existe e é da mesma empresa
      const existingUser = await this.userService.getUserById(uid);
      if (!existingUser) {
        return sendError(res, 'Usuário não encontrado', 404);
      }

      if (existingUser.empresaId !== empresaId) {
        throw createForbiddenError('Usuário não pertence à sua empresa');
      }

      const user = await this.userService.reactivateUser(uid, currentUid);
      
      logger.info(`Usuário reativado:`, { uid, reactivatedBy: currentUid });
      
      return sendSuccess(res, user, 'Usuário reativado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletar usuário permanentemente
   */
  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid: currentUid, papel } = req.user!;
      const { uid } = req.params;

      // Apenas admins podem deletar usuários
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem deletar usuários');
      }

      // Não pode deletar a si mesmo
      if (uid === currentUid) {
        throw createValidationError('Você não pode deletar sua própria conta');
      }

      // Verificar se o usuário existe e é da mesma empresa
      const existingUser = await this.userService.getUserById(uid);
      if (!existingUser) {
        return sendError(res, 'Usuário não encontrado', 404);
      }

      if (existingUser.empresaId !== empresaId) {
        throw createForbiddenError('Usuário não pertence à sua empresa');
      }

      await this.userService.deleteUser(uid, currentUid);
      
      logger.info(`Usuário deletado:`, { uid, deletedBy: currentUid });
      
      return sendSuccess(res, null, 'Usuário deletado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Alterar papel do usuário
   */
  changeRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid: currentUid, papel } = req.user!;
      const { uid } = req.params;
      const { papel: newRole } = req.body;

      // Apenas admins podem alterar papéis
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem alterar papéis');
      }

      if (!newRole) {
        throw createValidationError('Papel é obrigatório');
      }

      // Não pode alterar seu próprio papel
      if (uid === currentUid) {
        throw createValidationError('Você não pode alterar seu próprio papel');
      }

      // Verificar se o usuário existe e é da mesma empresa
      const existingUser = await this.userService.getUserById(uid);
      if (!existingUser) {
        return sendError(res, 'Usuário não encontrado', 404);
      }

      if (existingUser.empresaId !== empresaId) {
        throw createForbiddenError('Usuário não pertence à sua empresa');
      }

      const user = await this.userService.updateUser(uid, { papel: newRole }, currentUid);
      
      logger.info(`Papel do usuário alterado:`, { uid, newRole, changedBy: currentUid });
      
      return sendSuccess(res, user, 'Papel alterado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obter estatísticas de usuários
   */
  getStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, papel } = req.user!;
      
      // Apenas admins podem ver estatísticas
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem ver estatísticas');
      }

      const stats = await this.userService.getUserStats(empresaId);
      
      return sendSuccess(res, stats, 'Estatísticas obtidas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resetar senha do usuário
   */
  resetPassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid: currentUid, papel } = req.user!;
      const { email } = req.body;

      if (!email) {
        throw createValidationError('Email é obrigatório');
      }

      // Verificar se o usuário existe e é da mesma empresa
      const existingUser = await this.userService.findByEmail(email);
      if (!existingUser) {
        return sendError(res, 'Usuário não encontrado', 404);
      }

      // Usuários normais só podem resetar sua própria senha
      if (papel !== 'admin' && existingUser.uid !== currentUid) {
        throw createForbiddenError('Você só pode resetar sua própria senha');
      }

      if (existingUser.empresaId !== empresaId) {
        throw createForbiddenError('Usuário não pertence à sua empresa');
      }

      await this.userService.resetPassword(email);
      
      logger.info(`Reset de senha solicitado:`, { email, requestedBy: currentUid });
      
      return sendSuccess(res, null, 'Link de reset de senha enviado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verificar permissões do usuário
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
}