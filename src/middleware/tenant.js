import { supabase } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import {
  ValidationError,
  NotFoundError,
  asyncHandler
} from './errorHandler.js';

/**
 * Cache em memória para tenants (evita consultas repetidas)
 */
const tenantCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Middleware para resolver tenant baseado no slug
 * Suporta tenant via:
 * - Path parameter: /v1/tenants/:tenant/...
 * - Query parameter: ?tenant=slug
 * - Header: X-Tenant: slug
 */
export const resolveTenant = asyncHandler(async (req, res, next) => {
  // Extrair tenant slug de diferentes fontes
  const tenantSlug = req.params.tenant || 
                    req.headers['x-tenant'] || 
                    req.query.tenant;
  
  if (!tenantSlug) {
    throw new ValidationError('Tenant não especificado. Use path parameter, query string ou header X-Tenant.');
  }

  // Verificar cache primeiro
  const cacheKey = `tenant:${tenantSlug}`;
  const cached = tenantCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    req.company = cached.data;
    logger.debug('Tenant resolvido do cache', { tenant: tenantSlug, companyId: cached.data.id });
    return next();
  }

  try {
    // Buscar empresa pelo slug
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, name, slug, is_active, plan, logo_url')
      .eq('slug', tenantSlug)
      .eq('is_active', true)
      .single();

    if (error || !company) {
      logger.warn('Tenant não encontrado ou inativo', { 
        tenant: tenantSlug, 
        error: error?.message 
      });
      throw new NotFoundError(`Empresa '${tenantSlug}' não encontrada ou inativa`);
    }

    // Adicionar ao cache
    tenantCache.set(cacheKey, {
      data: company,
      timestamp: Date.now()
    });

    // Adicionar company ao request
    req.company = company;
    
    logger.info('Tenant resolvido com sucesso', { 
      tenant: tenantSlug, 
      companyId: company.id,
      companyName: company.name 
    });
    
    next();
  } catch (error) {
    logger.error('Erro ao resolver tenant', { 
      tenant: tenantSlug, 
      error: error.message 
    });
    
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw error;
    }
    
    throw new ValidationError('Erro interno ao resolver tenant');
  }
});

/**
 * Middleware para verificar se o usuário tem acesso ao tenant
 * Deve ser usado após authSupabase e resolveTenant
 */
export const requireTenantAccess = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ValidationError('Usuário não autenticado');
  }

  if (!req.company) {
    throw new ValidationError('Tenant não resolvido');
  }

  // Service role tem acesso a todos os tenants
  if (req.user.isServiceRole) {
    return next();
  }

  // Usuários anônimos não têm acesso a tenants específicos
  if (req.user.isAnonymous) {
    throw new ValidationError('Usuários anônimos não podem acessar dados de empresas');
  }

  try {
    // Verificar se o usuário é membro da empresa
    const { data: membership, error } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', req.company.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !membership) {
      logger.warn('Usuário sem acesso ao tenant', {
        userId: req.user.id,
        companyId: req.company.id,
        tenant: req.company.slug
      });
      throw new ValidationError(`Acesso negado à empresa '${req.company.slug}'`);
    }

    // Adicionar role do usuário na empresa ao request
    req.userRole = membership.role;
    
    logger.debug('Acesso ao tenant autorizado', {
      userId: req.user.id,
      companyId: req.company.id,
      role: membership.role
    });
    
    next();
  } catch (error) {
    logger.error('Erro ao verificar acesso ao tenant', {
      userId: req.user.id,
      companyId: req.company.id,
      error: error.message
    });
    
    if (error instanceof ValidationError) {
      throw error;
    }
    
    throw new ValidationError('Erro interno ao verificar acesso');
  }
});

/**
 * Middleware para verificar roles específicos no contexto do tenant
 */
export const requireTenantRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return asyncHandler(async (req, res, next) => {
    if (!req.userRole) {
      throw new ValidationError('Role do usuário não definida');
    }

    // Service role bypassa verificação de roles
    if (req.user?.isServiceRole) {
      return next();
    }

    if (!roles.includes(req.userRole)) {
      logger.warn('Acesso negado por role insuficiente', {
        userId: req.user.id,
        companyId: req.company.id,
        userRole: req.userRole,
        requiredRoles: roles
      });
      throw new ValidationError(`Acesso negado. Roles necessárias: ${roles.join(', ')}`);
    }

    next();
  });
};

/**
 * Limpar cache de tenants (útil para testes ou atualizações)
 */
export const clearTenantCache = (tenantSlug = null) => {
  if (tenantSlug) {
    tenantCache.delete(`tenant:${tenantSlug}`);
    logger.info('Cache do tenant limpo', { tenant: tenantSlug });
  } else {
    tenantCache.clear();
    logger.info('Cache de todos os tenants limpo');
  }
};

/**
 * Middleware para adicionar filtro automático por company_id nas queries
 * Deve ser usado em repositories/services
 */
export const addCompanyFilter = (query, req) => {
  if (!req.company?.id) {
    throw new ValidationError('Company ID não disponível para filtro');
  }
  
  return query.eq('company_id', req.company.id);
};