import { supabase } from '../config/supabase.js';
import { logger } from '../config/logger.js';
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  asyncHandler
} from './errorHandler.js';

/**
 * Middleware de autenticação Supabase
 */
export const authSupabase = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers.apikey;

  if (!authHeader && !apiKey) {
    throw new AuthenticationError('Token de autorização não fornecido');
  }

  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (apiKey) {
    token = apiKey;
  }

  if (!token) {
    throw new AuthenticationError('Formato de token inválido');
  }

  // Verificar se é ANON_KEY
  if (token === process.env.SUPABASE_ANON_KEY) {
    req.user = {
      id: 'anonymous',
      type: 'anonymous',
      isAnonymous: true
    };
    return next();
  }

  // Verificar se é SERVICE_ROLE_KEY
  if (token === process.env.SUPABASE_SERVICE_ROLE_KEY) {
    req.user = {
      id: 'service_role',
      type: 'service_role',
      isServiceRole: true
    };
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.warn('Token inválido ou expirado', { error: error?.message });
      throw new AuthenticationError('Token inválido ou expirado');
    }

    const claims = user.app_metadata || {};
    
    req.user = {
      id: user.id,
      email: user.email,
      supabase_user: user,
      user_type: claims.user_type || 'unknown',
      user_id: claims.user_id,
      empresa_id: claims.empresa_id,
      empresa_slug: claims.empresa_slug,
      role: claims.role,
      nome: claims.nome,
      permissions: claims.permissions || [],
      isAnonymous: false
    };

    // User authenticated successfully

    next();
  } catch (error) {
    // Authentication error handled silently
    throw new AuthenticationError('Falha na autenticação');
  }
});

/**
 * Middleware para resolver tenant
 */
export const resolveTenant = asyncHandler(async (req, res, next) => {
  const tenantSlug = req.params.tenant || req.headers['x-tenant'] || req.query.tenant;
  
  if (!tenantSlug) {
    throw new ValidationError('Tenant não especificado');
  }

  try {
    const { data: empresa, error } = await supabase
      .from('empresas')
      .select('id, nome, slug, ativo, configuracoes')
      .eq('slug', tenantSlug)
      .eq('ativo', true)
      .single();

    if (error || !empresa) {
      logger.warn('Tenant não encontrado', { tenant: tenantSlug });
      throw new ValidationError('Empresa não encontrada ou inativa');
    }

    req.tenant = {
      id: empresa.id,
      nome: empresa.nome,
      slug: empresa.slug,
      configuracoes: empresa.configuracoes || {}
    };

    // Tenant resolved successfully

    next();
  } catch (error) {
    // Tenant resolution error handled silently
    throw error;
  }
});

/**
 * Middleware para verificar roles
 */
export const requireRole = (roles) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('Usuário não autenticado');
    }

    if (req.user.isServiceRole) {
      return next();
    }

    if (req.user.isAnonymous) {
      throw new AuthorizationError('Acesso negado para usuários anônimos');
    }

    const userRole = req.user.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Access denied - insufficient role
      throw new AuthorizationError('Permissões insuficientes');
    }

    next();
  });
};

/**
 * Middleware para verificar permissões
 */
export const requirePermission = (permissions) => {
  const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
  
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      throw new AuthenticationError('Usuário não autenticado');
    }

    if (req.user.isServiceRole) {
      return next();
    }

    if (req.user.isAnonymous) {
      throw new AuthorizationError('Acesso negado para usuários anônimos');
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      // Access denied - insufficient permissions
      throw new AuthorizationError('Permissões insuficientes');
    }

    next();
  });
};

/**
 * Middleware de autenticação opcional
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers.apikey;

  if (!authHeader && !apiKey) {
    req.user = null;
    return next();
  }

  try {
    await authSupabase(req, res, next);
  } catch (error) {
    logger.debug('Autenticação opcional falhou', { error: error.message });
    req.user = null;
    next();
  }
});

/**
 * Alias para compatibilidade
 */
export const authMiddleware = authSupabase;