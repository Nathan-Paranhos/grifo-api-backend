import { Response, NextFunction } from 'express';
import * as z from 'zod';
import { UserService, CreateUserData, UpdateUserData } from '../services/UserService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middlewares/auth';
import logger from '../config/logger';
import { createForbiddenError, createValidationError } from '../middlewares/errorHandler';
import { listUsersQuerySchema } from '../validators/users/listUsers.schema';

class UserController {
  private userService: UserService | null = null;

  private getUserService(): UserService {
    if (!this.userService) {
      this.userService = new UserService();
    }
    return this.userService;
  }

  /**
   * Criar novo usuário
   */
  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      
      // Apenas admins podem criar usuários
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem criar usuários');
      }

      const data: CreateUserData = req.body;
      
      if (!empresaId) {
        throw createValidationError('ID da empresa é obrigatório');
      }
      
      // Garantir que o usuário seja criado para a empresa do admin
      data.empresaId = empresaId;

      const user = await this.getUserService().createUser(data, uid);
      
      // Remover dados sensíveis da resposta

      
      logger.info(`Usuário criado:`, { uid: user.uid, email: data.email, empresaId, createdBy: uid });
      
      return sendSuccess(res, user, 'Usuário criado com sucesso', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar usuário por UID
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid: currentUid, papel } = req.user!;
      const { uid } = req.params;

      const user = await this.getUserService().getUserById(uid);
      
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
  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { uid } = req.user!;

      const user = await this.getUserService().getUserById(uid);
      
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
  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, papel } = req.user!;
      
      // Apenas admins podem listar usuários
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem listar usuários');
      }

      const options = listUsersQuerySchema.parse(req.query);

      if (!empresaId) {
        throw createValidationError('ID da empresa é obrigatório');
      }

      return sendSuccess(res, await this.getUserService().getUsersByEmpresa(empresaId, options), 'Usuários listados com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Atualizar usuário
   */
  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid: currentUid, papel } = req.user!;
      const { uid } = req.params;
      const data: UpdateUserData = req.body;

      // Verificar se o usuário pode editar este perfil
      if (papel !== 'admin' && uid !== currentUid) {
        throw createForbiddenError('Você só pode editar seu próprio perfil');
      }

      // Verificar se o usuário existe e é da mesma empresa
      const existingUser = await this.getUserService().getUserById(uid);
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

      const user = await this.getUserService().updateUser(uid, data, currentUid);
      
      logger.info(`Usuário atualizado:`, { uid, updatedBy: currentUid });
      
      return sendSuccess(res, user, 'Usuário atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Atualizar perfil do usuário atual
   */
  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { uid } = req.user!;
      const data: UpdateUserData = req.body;

      // Remover campos que o usuário não pode alterar em seu próprio perfil
      delete data.papel;
      delete data.ativo;

      const user = await this.getUserService().updateUser(uid, data, uid);
      
      logger.info(`Perfil atualizado:`, { uid });
      
      return sendSuccess(res, user, 'Perfil atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Atualizar status do usuário (ativo/inativo)
   */
  updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid: currentUid, papel } = req.user!;
      const { uid } = req.params;
      const { ativo } = z.object({ ativo: z.boolean() }).parse(req.body);

      // Apenas admins podem alterar o status
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem alterar o status do usuário');
      }

      // Não pode desativar a si mesmo
      if (uid === currentUid && !ativo) {
        throw createValidationError('Você não pode desativar sua própria conta');
      }

      // Verificar se o usuário existe e é da mesma empresa
      const existingUser = await this.getUserService().getUserById(uid);
      if (!existingUser) {
        return sendError(res, 'Usuário não encontrado', 404);
      }

      if (existingUser.empresaId !== empresaId) {
        throw createForbiddenError('Usuário não pertence à sua empresa');
      }

      const user = await this.getUserService().updateUser(uid, { ativo }, currentUid);
      
      const action = ativo ? 'reativado' : 'desativado';
      logger.info(`Usuário ${action}:`, { uid, updatedBy: currentUid });
      
      return sendSuccess(res, user, `Usuário ${action} com sucesso`);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletar usuário permanentemente
   */
  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
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
      const existingUser = await this.getUserService().getUserById(uid);
      if (!existingUser) {
        return sendError(res, 'Usuário não encontrado', 404);
      }

      if (existingUser.empresaId !== empresaId) {
        throw createForbiddenError('Usuário não pertence à sua empresa');
      }

      await this.getUserService().deleteUser(uid, currentUid);
      
      logger.info(`Usuário deletado:`, { uid, deletedBy: currentUid });
      
      return sendSuccess(res, null, 'Usuário deletado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Alterar papel do usuário
   */
  changeRole = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid: currentUid, papel } = req.user!;
      const { uid } = req.params;
      const { papel: newRole } = z.object({ papel: z.enum(['admin', 'corretor', 'leitor']) }).parse(req.body);

      // Apenas admins podem alterar papéis
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem alterar papéis');
      }



      // Não pode alterar seu próprio papel
      if (uid === currentUid) {
        throw createValidationError('Você não pode alterar seu próprio papel');
      }

      // Verificar se o usuário existe e é da mesma empresa
      const existingUser = await this.getUserService().getUserById(uid);
      if (!existingUser) {
        return sendError(res, 'Usuário não encontrado', 404);
      }

      if (existingUser.empresaId !== empresaId) {
        throw createForbiddenError('Usuário não pertence à sua empresa');
      }

      const user = await this.getUserService().updateUser(uid, { papel: newRole }, currentUid);
      
      logger.info(`Papel do usuário alterado:`, { uid, newRole, changedBy: currentUid });
      
      return sendSuccess(res, user, 'Papel alterado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obter estatísticas de usuários
   */
  getStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, papel } = req.user!;
      
      // Apenas admins podem ver estatísticas
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem ver estatísticas');
      }

      if (!empresaId) {
        throw createValidationError('ID da empresa é obrigatório');
      }

      const stats = await this.getUserService().getUserStats(empresaId);
      
      return sendSuccess(res, stats, 'Estatísticas obtidas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resetar senha do usuário
   */
  resetPassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid: currentUid, papel } = req.user!;
      const { email } = z.object({ email: z.string().email() }).parse(req.body);



      // Verificar se o usuário existe e é da mesma empresa
      const existingUser = await this.getUserService().findByEmail(email);
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

      await this.getUserService().resetPassword(email);
      
      logger.info(`Reset de senha solicitado:`, { email, requestedBy: currentUid });
      
      return sendSuccess(res, null, 'Link de reset de senha enviado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verificar permissões do usuário
   */
  checkPermission = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { uid } = req.user!;
      const { action, resource } = z.object({
        action: z.enum(['create', 'read', 'update', 'delete']),
        resource: z.enum(['user', 'inspection', 'company']),
      }).parse(req.query);



      const hasPermission = await this.getUserService().hasPermission(uid, action, resource);
      
      return sendSuccess(res, { hasPermission }, 'Permissão verificada');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Desativar usuário
   */
  deactivate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;
      
      // Apenas admins podem desativar usuários
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem desativar usuários');
      }

      await this.getUserService().deactivateUser(id, uid);
      
      logger.info(`Usuário desativado:`, { targetUid: id, empresaId, actionBy: uid });
      
      return sendSuccess(res, null, 'Usuário desativado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reativar usuário
   */
  reactivate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;
      
      // Apenas admins podem reativar usuários
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem reativar usuários');
      }

      await this.getUserService().reactivateUser(id, uid);
      
      logger.info(`Usuário reativado:`, { targetUid: id, empresaId, actionBy: uid });
      
      return sendSuccess(res, null, 'Usuário reativado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  // Alias para o método delete
  remove = this.delete;
}

export { UserController };
export const userController = new UserController();