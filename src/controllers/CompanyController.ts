import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { CompanyService, CreateCompanyData, UpdateCompanyData } from '../services/CompanyService';
import { sendSuccess } from '../utils/response';
import { AuthenticatedRequest } from '../middlewares/auth';
import logger from '../config/logger';
import { createForbiddenError, createValidationError } from '../middlewares/errorHandler';

export class CompanyController {
  private static instance: CompanyController;

  private companyService: CompanyService | null = null;

  private getCompanyService(): CompanyService {
    if (!this.companyService) {
      this.companyService = new CompanyService();
    }
    return this.companyService;
  }

  /**
   * Criar nova empresa (apenas superadmin)
   */
  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid, papel } = req.user!;
      
      // Verificar se é superadmin (implementar lógica específica)
      // Por enquanto, apenas admins podem criar empresas
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem criar empresas');
      }

      const data: CreateCompanyData = req.body;
      data.proprietarioId = data.proprietarioId || uid;

      const company = await this.getCompanyService().createCompany(data);
      
      logger.info(`Empresa criada:`, { id: company.id, nome: data.nome, createdBy: uid });
      
      return sendSuccess(res, company, 'Empresa criada com sucesso', 201);
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Buscar empresa por ID
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { empresaId, papel } = req.user!;
      const { id } = req.params;

      // Usuários normais só podem ver sua própria empresa
      const targetId = (papel === 'admin' && id) ? id : empresaId;

      if (!targetId) {
        throw createForbiddenError('ID da empresa não fornecido');
      }

      const company = await this.getCompanyService().getCompanyById(targetId);
      
      return sendSuccess(res, company, 'Empresa encontrada');
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Buscar empresa atual do usuário
   */
  getCurrent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId } = req.user!;

      if (!empresaId) {
        throw createValidationError('ID da empresa é obrigatório');
      }

      const company = await this.getCompanyService().getCompanyById(empresaId);
      
      return sendSuccess(res, company, 'Empresa atual encontrada');
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Listar empresas por proprietário
   */
  getByProprietario = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid, papel } = req.user!;
      const { proprietarioId } = req.params;

      // Usuários normais só podem ver suas próprias empresas
      const targetProprietarioId = (papel === 'admin' && proprietarioId) ? proprietarioId : uid;

      const companies = await this.getCompanyService().getCompaniesByProprietario(targetProprietarioId);
      
      return sendSuccess(res, companies, 'Empresas do proprietário listadas com sucesso');
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Listar todas as empresas (apenas superadmin)
   */
  listAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { papel } = req.user!;
      
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem listar todas as empresas');
      }

      const listCompaniesQuerySchema = z.object({
        limit: z.preprocess((val) => Number(val || 20), z.number().min(1)),
        offset: z.preprocess((val) => Number(val || 0), z.number().min(0)),
        status: z.enum(['ativa', 'inativa', 'pendente']).optional(),
      });

      const { limit, offset, status } = listCompaniesQuerySchema.parse(req.query);

      const options = { limit, offset, filters: { status } };

      const companies = await this.getCompanyService().listAllCompanies(options);
      
      return sendSuccess(res, companies, 'Empresas listadas com sucesso');
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Atualizar empresa
   */
  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;
      const data: UpdateCompanyData = req.body;

      // Usuários normais só podem editar sua própria empresa
      const targetId = (papel === 'admin' && id) ? id : empresaId;

      if (!targetId) {
        throw createForbiddenError('ID da empresa não fornecido');
      }

      const company = await this.getCompanyService().updateCompany(targetId, data);
      
      logger.info(`Empresa atualizada:`, { id: targetId, updatedBy: uid });
      
      return sendSuccess(res, company, 'Empresa atualizada com sucesso');
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Atualizar status da empresa (apenas superadmin)
   */
  updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid, papel } = req.user!;
      const { id } = req.params;
      
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem alterar status de empresas');
      }

      const statusSchema = z.object({ status: z.enum(['ativa', 'suspensa', 'cancelada']) });
      const { status } = statusSchema.parse(req.body);

      const company = await this.getCompanyService().updateStatus(id, status);
      
      logger.info(`Status da empresa atualizado:`, { id, status, updatedBy: uid });
      
      return sendSuccess(res, company, 'Status atualizado com sucesso');
    } catch (error: unknown) {
      next(error);
    }
  };

  /**
   * Atualizar configurações da empresa
   */
  updateConfiguracoes = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;
      const { configuracoes } = req.body as { configuracoes: Record<string, unknown> };



      // Usuários normais só podem editar configurações da própria empresa
      const targetId = (papel === 'admin' && id) ? id : empresaId;

      if (!targetId) {
        throw createForbiddenError('ID da empresa não fornecido');
      }

      const company = await this.getCompanyService().updateConfiguracoes(targetId, configuracoes);
      
      logger.info(`Configurações da empresa atualizadas:`, { id: targetId, updatedBy: uid });
      
      return sendSuccess(res, company, 'Configurações atualizadas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Atualizar plano da empresa (apenas superadmin)
   */
  updatePlano = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid, papel } = req.user!;
      const { id } = req.params;
      const { plano } = req.body;

      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem alterar planos de empresas');
      }

      if (!plano) {
        throw createValidationError('Plano é obrigatório');
      }

      const company = await this.getCompanyService().updatePlano(id, plano);
      
      logger.info(`Plano da empresa atualizado:`, { id, plano: plano.tipo, updatedBy: uid });
      
      return sendSuccess(res, company, 'Plano atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Suspender empresa
   */
  suspend = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid, papel } = req.user!;
      const { id } = req.params;

      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem suspender empresas');
      }

      const company = await this.getCompanyService().suspendCompany(id);
      
      logger.info(`Empresa suspensa:`, { id, suspendedBy: uid });
      
      return sendSuccess(res, company, 'Empresa suspensa com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reativar empresa
   */
  reactivate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid, papel } = req.user!;
      const { id } = req.params;

      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem reativar empresas');
      }

      const company = await this.getCompanyService().reactivateCompany(id);
      
      logger.info(`Empresa reativada:`, { id, reactivatedBy: uid });
      
      return sendSuccess(res, company, 'Empresa reativada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancelar empresa
   */
  cancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid, papel } = req.user!;
      const { id } = req.params;

      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem cancelar empresas');
      }

      const company = await this.getCompanyService().cancelCompany(id);
      
      logger.info(`Empresa cancelada:`, { id, cancelledBy: uid });
      
      return sendSuccess(res, company, 'Empresa cancelada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verificar se pode criar usuário
   */
  canCreateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId } = req.user!;

      if (!empresaId) {
        throw createValidationError('ID da empresa é obrigatório');
      }

      const canCreate = await this.getCompanyService().canCreateUser(empresaId);
      
      return sendSuccess(res, { canCreate }, 'Verificação realizada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Verificar se pode criar vistoria
   */
  canCreateInspection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId } = req.user!;

      if (!empresaId) {
        throw createValidationError('ID da empresa é obrigatório');
      }

      const canCreate = await this.getCompanyService().canCreateInspection(empresaId);
      
      return sendSuccess(res, { canCreate }, 'Verificação realizada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Obter estatísticas globais (apenas superadmin)
   */
  getGlobalStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { papel } = req.user!;
      
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem ver estatísticas globais');
      }

      const stats = await this.getCompanyService().getGlobalStats();
      
      return sendSuccess(res, stats, 'Estatísticas globais obtidas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletar empresa (soft delete)
   */
  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { uid, papel } = req.user!;
      const { id } = req.params;

      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem deletar empresas');
      }

      await this.getCompanyService().deleteCompany(id);
      
      logger.info(`Empresa deletada:`, { id, deletedBy: uid });
      
      return sendSuccess(res, null, 'Empresa deletada com sucesso');
    } catch (error) {
      next(error);
    }
  };

  public static getInstance(): CompanyController {
    if (!CompanyController.instance) {
      CompanyController.instance = new CompanyController();
    }
    return CompanyController.instance;
  }
}

export const companyController = CompanyController.getInstance();