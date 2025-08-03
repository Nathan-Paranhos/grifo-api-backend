import { CompanyRepository, Company } from '../repositories/CompanyRepository';
import { QueryOptions } from '../repositories/BaseRepository';
import logger from '../config/logger';
import { CustomError, createNotFoundError, createValidationError } from '../middlewares/errorHandler';
import * as admin from 'firebase-admin';

export interface CreateCompanyData {
  nome: string;
  cnpj?: string;
  email: string;
  telefone?: string;
  endereco?: Company['endereco'];
  proprietarioId: string;
  plano?: {
    tipo: 'free' | 'basic' | 'premium' | 'enterprise';
    limiteUsuarios?: number;
    limiteVistorias?: number;
    limiteFotos?: number;
    dataVencimento?: Date;
  };
}

export interface UpdateCompanyData {
  nome?: string;
  email?: string;
  telefone?: string;
  endereco?: Company['endereco'];
  configuracoes?: Company['configuracoes'];
}

export class CompanyService {
  private companyRepository: CompanyRepository;

  constructor() {
    this.companyRepository = new CompanyRepository();
  }

  /**
   * Criar nova empresa
   */
  async createCompany(data: CreateCompanyData): Promise<Company> {
    try {
      // Verificar se já existe empresa com o mesmo CNPJ
      if (data.cnpj) {
        const existingByCnpj = await this.companyRepository.findByCnpj(data.cnpj);
        if (existingByCnpj) {
          throw createValidationError('Já existe uma empresa com este CNPJ');
        }
      }

      // Verificar se já existe empresa com o mesmo email
      const existingByEmail = await this.companyRepository.findByEmail(data.email);
      if (existingByEmail) {
        throw createValidationError('Já existe uma empresa com este email');
      }

      // Definir plano padrão se não fornecido
      const plano = data.plano || {
        tipo: 'free',
        limiteUsuarios: 5,
        limiteVistorias: 50,
        limiteFotos: 10
      };

      // Se tem data de vencimento, converter para Timestamp
      if (plano.dataVencimento) {
        (plano as { dataVencimento?: admin.firestore.Timestamp | Date }).dataVencimento = admin.firestore.Timestamp.fromDate(plano.dataVencimento as Date);
      }

      const companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt' | 'empresaId'> = {
        nome: data.nome,
        cnpj: data.cnpj,
        email: data.email,
        telefone: data.telefone,
        endereco: data.endereco,
        proprietarioId: data.proprietarioId,
        plano: plano as Company['plano'],
        status: 'ativa',
        ativo: true,
        configuracoes: {
          corPrimaria: '#1976d2',
          corSecundaria: '#424242'
        }
      };

      const company = await this.companyRepository.create(companyData);
      
      logger.info(`Empresa criada:`, { id: company.id, nome: data.nome, proprietario: data.proprietarioId });
      
      return company;
    } catch (error) {
      logger.error('Erro ao criar empresa:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao criar empresa', 500);
    }
  }

  /**
   * Buscar empresa por ID
   */
  async getCompanyById(id: string): Promise<Company> {
    try {
      const company = await this.companyRepository.findByIdDirect(id);
      if (!company) {
        throw createNotFoundError('Empresa não encontrada');
      }
      return company;
    } catch (error) {
      logger.error(`Erro ao buscar empresa ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao buscar empresa', 500);
    }
  }

  /**
   * Buscar empresas por proprietário
   */
  async getCompaniesByProprietario(proprietarioId: string): Promise<Company[]> {
    try {
      return await this.companyRepository.findByProprietario(proprietarioId);
    } catch (error) {
      logger.error(`Erro ao buscar empresas do proprietário ${proprietarioId}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao buscar empresas', 500);
    }
  }

  /**
   * Listar todas as empresas (para superadmin)
   */
  async listAllCompanies(options: QueryOptions = {}): Promise<Company[]> {
    try {
      return await this.companyRepository.findAll(options);
    } catch (error) {
      logger.error('Erro ao listar empresas:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao listar empresas', 500);
    }
  }

  /**
   * Atualizar empresa
   */
  async updateCompany(
    id: string,
    data: UpdateCompanyData
  ): Promise<Company> {
    try {
      // Verificar se a empresa existe
      const existingCompany = await this.getCompanyById(id);

      // Se está alterando email, verificar se não existe outra empresa com o mesmo
      if (data.email && data.email !== existingCompany.email) {
        const existingByEmail = await this.companyRepository.findByEmail(data.email);
        if (existingByEmail && existingByEmail.id !== id) {
          throw createValidationError('Já existe uma empresa com este email');
        }
      }

      const updateData: Partial<Company> = {};

      if (data.nome) updateData.nome = data.nome;
      if (data.email) updateData.email = data.email;
      if (data.telefone !== undefined) updateData.telefone = data.telefone;
      if (data.endereco) updateData.endereco = data.endereco;
      if (data.configuracoes) {
        updateData.configuracoes = {
          ...existingCompany.configuracoes,
          ...data.configuracoes
        };
      }

      // Usar método específico do repository que não filtra por empresaId
      await this.companyRepository.update(id, id, {
        ...updateData,
        updatedAt: admin.firestore.Timestamp.now()
      } as Partial<Company>);
      
      logger.info(`Empresa atualizada:`, { id, changes: Object.keys(updateData) });
      
      return await this.getCompanyById(id);
    } catch (error) {
      logger.error(`Erro ao atualizar empresa ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao atualizar empresa', 500);
    }
  }

  /**
   * Atualizar status da empresa
   */
  async updateStatus(
    id: string,
    status: Company['status']
  ): Promise<Company> {
    try {
      return await this.companyRepository.updateStatus(id, status);
    } catch (error) {
      logger.error(`Erro ao atualizar status da empresa ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao atualizar status', 500);
    }
  }

  /**
   * Atualizar configurações da empresa
   */
  async updateConfiguracoes(
    id: string,
    configuracoes: Company['configuracoes']
  ): Promise<Company> {
    try {
      return await this.companyRepository.updateConfiguracoes(id, configuracoes);
    } catch (error) {
      logger.error(`Erro ao atualizar configurações da empresa ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao atualizar configurações', 500);
    }
  }

  /**
   * Atualizar plano da empresa
   */
  async updatePlano(
    id: string,
    plano: Company['plano']
  ): Promise<Company> {
    try {
      // Se tem data de vencimento, converter para Timestamp
      if (plano?.dataVencimento && plano.dataVencimento instanceof Date) {
        (plano as { dataVencimento?: admin.firestore.Timestamp | Date }).dataVencimento = admin.firestore.Timestamp.fromDate(plano.dataVencimento);
      }

      return await this.companyRepository.updatePlano(id, plano);
    } catch (error) {
      logger.error(`Erro ao atualizar plano da empresa ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao atualizar plano', 500);
    }
  }

  /**
   * Suspender empresa
   */
  async suspendCompany(id: string): Promise<Company> {
    try {
      return await this.updateStatus(id, 'suspensa');
    } catch (error) {
      logger.error(`Erro ao suspender empresa ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao suspender empresa', 500);
    }
  }

  /**
   * Reativar empresa
   */
  async reactivateCompany(id: string): Promise<Company> {
    try {
      return await this.updateStatus(id, 'ativa');
    } catch (error) {
      logger.error(`Erro ao reativar empresa ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao reativar empresa', 500);
    }
  }

  /**
   * Cancelar empresa
   */
  async cancelCompany(id: string): Promise<Company> {
    try {
      return await this.updateStatus(id, 'cancelada');
    } catch (error) {
      logger.error(`Erro ao cancelar empresa ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao cancelar empresa', 500);
    }
  }

  /**
   * Verificar se empresa pode criar mais usuários
   */
  async canCreateUser(empresaId: string): Promise<boolean> {
    try {
      const company = await this.getCompanyById(empresaId);
      
      if (company.status !== 'ativa') {
        return false;
      }

      if (company.plano) {
        const usuariosCount = company.usuariosCount || 0;
        return usuariosCount < company.plano.limiteUsuarios;
      }

      return true;
    } catch (error) {
      logger.error(`Erro ao verificar limite de usuários da empresa ${empresaId}:`, error);
      return false;
    }
  }

  /**
   * Verificar se empresa pode criar mais vistorias
   */
  async canCreateInspection(empresaId: string): Promise<boolean> {
    try {
      const company = await this.getCompanyById(empresaId);
      
      if (company.status !== 'ativa') {
        return false;
      }

      if (company.plano) {
        const vistoriasCount = company.vistoriasCount || 0;
        return vistoriasCount < company.plano.limiteVistorias;
      }

      return true;
    } catch (error) {
      logger.error(`Erro ao verificar limite de vistorias da empresa ${empresaId}:`, error);
      return false;
    }
  }

  /**
   * Incrementar contador de usuários
   */
  async incrementUsuarios(empresaId: string): Promise<void> {
    try {
      const company = await this.getCompanyById(empresaId);
      const currentCount = company.usuariosCount || 0;
      
      await this.companyRepository.update(empresaId, empresaId, {
        usuariosCount: currentCount + 1,
        updatedAt: admin.firestore.Timestamp.now()
      });
      
      logger.info(`Contador de usuários incrementado para empresa ${empresaId}`);
    } catch (error) {
      logger.error(`Erro ao incrementar usuários da empresa ${empresaId}:`, error);
      throw new CustomError('Erro ao atualizar contador de usuários', 500);
    }
  }

  /**
   * Decrementar contador de usuários
   */
  async decrementUsuarios(empresaId: string): Promise<void> {
    try {
      const company = await this.getCompanyById(empresaId);
      const currentCount = company.usuariosCount || 0;
      
      await this.companyRepository.update(empresaId, empresaId, {
        usuariosCount: Math.max(0, currentCount - 1),
        updatedAt: admin.firestore.Timestamp.now()
      });
      
      logger.info(`Contador de usuários decrementado para empresa ${empresaId}`);
    } catch (error) {
      logger.error(`Erro ao decrementar usuários da empresa ${empresaId}:`, error);
      throw new CustomError('Erro ao atualizar contador de usuários', 500);
    }
  }

  /**
   * Buscar estatísticas globais (para superadmin)
   */
  async getGlobalStats() {
    try {
      return await this.companyRepository.getGlobalStats();
    } catch (error) {
      logger.error('Erro ao buscar estatísticas globais:', error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao buscar estatísticas', 500);
    }
  }

  /**
   * Deletar empresa (soft delete)
   */
  async deleteCompany(id: string): Promise<boolean> {
    try {
      // Verificar se a empresa existe
      await this.getCompanyById(id);
      
      // Usar soft delete do repository base
      await this.companyRepository.update(id, id, {
        ativo: false,
        status: 'cancelada',
        updatedAt: admin.firestore.Timestamp.now()
      } as Partial<Company>);
      
      logger.info(`Empresa deletada:`, { id });
      
      return true;
    } catch (error) {
      logger.error(`Erro ao deletar empresa ${id}:`, error);
      if (error instanceof CustomError) throw error;
      throw new CustomError('Erro ao deletar empresa', 500);
    }
  }
}