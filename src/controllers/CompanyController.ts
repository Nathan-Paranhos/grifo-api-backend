import { Request, Response, NextFunction } from 'express';
import { CompanyService, CreateCompanyData, UpdateCompanyData } from '../services/CompanyService';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middlewares/auth';
import logger from '../config/logger';
import { CustomError, createValidationError, createForbiddenError } from '../middlewares/errorHandler';

export class CompanyController {
  private companyService: CompanyService;

  constructor() {
    this.companyService = new CompanyService();
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

      const company = await this.companyService.createCompany(data);
      
      logger.info(`Empresa criada:`, { id: company.id, nome: data.nome, createdBy: uid });
      
      return sendSuccess(res, company, 'Empresa criada com sucesso', 201);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar empresa por ID
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, papel } = req.user!;
      const { id } = req.params;

      // Usuários normais só podem ver sua própria empresa
      const targetId = papel === 'admin' && id !== empresaId ? id : empresaId;

      const company = await this.companyService.getCompanyById(targetId);
      
      return sendSuccess(res, company, 'Empresa encontrada');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Buscar empresa atual do usuário
   */
  getCurrent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId } = req.user!;

      const company = await this.companyService.getCompanyById(empresaId);
      
      return sendSuccess(res, company, 'Empresa atual encontrada');
    } catch (error) {
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
      const targetProprietarioId = papel === 'admin' ? proprietarioId : uid;

      const companies = await this.companyService.getCompaniesByProprietario(targetProprietarioId);
      
      return sendSuccess(res, companies, 'Empresas do proprietário listadas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Listar todas as empresas (apenas superadmin)
   */
  listAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { papel } = req.user!;
      
      // Verificar se é superadmin
      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem listar todas as empresas');
      }

      const { limit = '20', offset = '0', status } = req.query;

      const options = {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        filters: status ? { status } : undefined
      };

      const companies = await this.companyService.listAllCompanies(options);
      
      return sendSuccess(res, companies, 'Empresas listadas com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Atualizar empresa
   */
  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;
      const data: UpdateCompanyData = req.body;

      // Usuários normais só podem editar sua própria empresa
      const targetId = papel === 'admin' && id !== empresaId ? id : empresaId;

      const company = await this.companyService.updateCompany(targetId, data);
      
      logger.info(`Empresa atualizada:`, { id: targetId, updatedBy: uid });
      
      return sendSuccess(res, company, 'Empresa atualizada com sucesso');
    } catch (error) {
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
      const { status } = req.body;

      if (papel !== 'admin') {
        throw createForbiddenError('Apenas administradores podem alterar status de empresas');
      }

      if (!status) {
        throw createValidationError('Status é obrigatório');
      }

      const company = await this.companyService.updateStatus(id, status);
      
      logger.info(`Status da empresa atualizado:`, { id, status, updatedBy: uid });
      
      return sendSuccess(res, company, 'Status atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  };

  /**
   * Atualizar configurações da empresa
   */
  updateConfiguracoes = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { empresaId, uid, papel } = req.user!;
      const { id } = req.params;
      const { configuracoes } = req.body;

      if (!configuracoes) {
        throw createValidationError('Configurações são obrigatórias');
      }

      // Usuários normais só podem editar configurações da própria empresa
      const targetId = papel === 'admin' && id !== empresaId ? id : empresaId;

      const company = await this.companyService.updateConfiguracoes(targetId, configuracoes);
      
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

      const company = await this.companyService.updatePlano(id, plano);
      
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

      const company = await this.companyService.suspendCompany(id);
      
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

      const company = await this.companyService.reactivateCompany(id);
      
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

      const company = await this.companyService.cancelCompany(id);
      
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

      const canCreate = await this.companyService.canCreateUser(empresaId);
      
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

      const canCreate = await this.companyService.canCreateInspection(empresaId);
      
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

      const stats = await this.companyService.getGlobalStats();
      
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

      await this.companyService.deleteCompany(id);
      
      logger.info(`Empresa deletada:`, { id, deletedBy: uid });
      
      return sendSuccess(res, null, 'Empresa deletada com sucesso');
    } catch (error) {
      next(error);
    }
  };
}