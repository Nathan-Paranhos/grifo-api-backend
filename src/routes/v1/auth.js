import express from 'express';
import { z } from 'zod';
import { supabase } from '../../config/supabase.js';
import { logger, authLogger } from '../../config/logger.js';
import {
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError
} from '../../middleware/errorHandler.js';
import { validateRequest, commonSchemas } from '../../middleware/validation.js';
import { authSupabase } from '../../middleware/auth.js';

const router = express.Router();

// DEBUG: Endpoint temporário para verificar configurações
router.get('/debug/config', (req, res) => {
  res.json({
    supabase_url: process.env.SUPABASE_URL || 'NOT_SET',
    supabase_anon_key_length: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.length : 0,
    supabase_service_key_length: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0,
    jwt_secret_length: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
    node_env: process.env.NODE_ENV || 'NOT_SET',
    port: process.env.PORT || 'NOT_SET'
  });
});

// Validation schemas
const authSchemas = {
  appLogin: {
    body: z.object({
      email: commonSchemas.email,
      password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
    })
  },
  portalLogin: {
    body: z.object({
      email: commonSchemas.email,
      password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
      remember: z.boolean().optional().default(false)
    })
  },
  register: {
    body: z.object({
      name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
      email: commonSchemas.email,
      password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
      phone: z.string().optional(),
      user_type: z.enum(['app_user', 'portal_user'])
    })
  },
  changePassword: {
    body: z
      .object({
        current_password: z.string().min(1, 'Senha atual é obrigatória'),
        new_password: z
          .string()
          .min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
        confirm_password: z
          .string()
          .min(1, 'Confirmação de senha é obrigatória')
      })
      .refine(data => data.new_password === data.confirm_password, {
        message: 'Senhas não coincidem',
        path: ['confirm_password']
      })
  },
  forgotPassword: {
    body: z.object({
      email: commonSchemas.email
    })
  },
  resetPassword: {
    body: z
      .object({
        token: z.string().min(1, 'Token é obrigatório'),
        password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
        confirm_password: z
          .string()
          .min(1, 'Confirmação de senha é obrigatória')
      })
      .refine(data => data.password === data.confirm_password, {
        message: 'Senhas não coincidem',
        path: ['confirm_password']
      })
  }
};

/**
 * @swagger
 * /api/v1/auth/app/login:
 *   post:
 *     tags: [Authentication - App]
 *     summary: Login para usuários do aplicativo móvel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post(
  '/app/login',
  validateRequest(authSchemas.appLogin),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    authLogger.info('App login attempt', { email, ip: req.ip });

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

    if (authError || !authData.user) {
      authLogger.warn('App login failed - invalid credentials', {
        email,
        ip: req.ip
      });
      throw new AuthenticationError('Credenciais inválidas');
    }

    // DEBUG: Log the auth user ID for debugging
    authLogger.info('DEBUG: Supabase Auth successful', {
      email,
      supabaseUid: authData.user.id,
      ip: req.ip
    });

    // Get user data from app_users table (without forcing INNER JOIN)
    const { data: appUser, error: userError } = await supabase
      .from('app_users')
      .select(
        `
        id,
        nome,
        email,
        empresa_id,
        role,
        ativo,
        auth_user_id
      `
      )
      .eq('auth_user_id', authData.user.id)
      .eq('ativo', true)
      .single();

    // DEBUG: Log detailed query results
    authLogger.info('DEBUG: app_users query result', {
      email,
      supabaseUid: authData.user.id,
      userError: userError ? userError.message : null,
      userErrorCode: userError ? userError.code : null,
      userErrorDetails: userError ? userError.details : null,
      appUserFound: !!appUser,
      appUserData: appUser ? {
        id: appUser.id,
        nome: appUser.nome,
        email: appUser.email,
        empresa_id: appUser.empresa_id,
        ativo: appUser.ativo,
        auth_user_id: appUser.auth_user_id
      } : null,
      ip: req.ip
    });

    if (userError || !appUser) {
      authLogger.warn('App login failed - user not found in app_users', {
        email,
        supabaseUid: authData.user.id,
        userError: userError ? userError.message : 'No error message',
        userErrorCode: userError ? userError.code : 'No error code',
        userErrorDetails: userError ? userError.details : 'No error details',
        ip: req.ip
      });
      throw new AuthenticationError('Usuário não encontrado ou inativo');
    }

    // Check if company is active
    // if (appUser.empresas.status !== 'active') {
    //   authLogger.warn('App login failed - company inactive', {
    //     email,
    //     companyId: appUser.empresa_id,
    //     ip: req.ip
    //   });
    //   throw new AuthenticationError(
    //     'Empresa inativa. Entre em contato com o suporte.'
    //   );
    // }

    // Update last login
    await supabase
      .from('app_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', appUser.id);

    authLogger.info('App login successful', {
      userId: appUser.id,
      email,
      companyId: appUser.empresa_id
    });

    // Get company data separately if needed
    let companyData = null;
    if (appUser.empresa_id) {
      const { data: empresa } = await supabase
        .from('empresas')
        .select('id, nome')
        .eq('id', appUser.empresa_id)
        .single();
      companyData = empresa;
    }

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        user: {
          id: appUser.id,
          nome: appUser.nome,
          email: appUser.email,
          user_type: 'app_user',
          company: companyData ? {
            id: companyData.id,
            nome: companyData.nome
          } : null
        }
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/auth/portal/login:
 *   post:
 *     tags: [Authentication - Portal]
 *     summary: Login para usuários do portal web
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               remember:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 */
router.post(
  '/portal/login',
  validateRequest(authSchemas.portalLogin),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;



    authLogger.info('Portal login attempt', { email, ip: req.ip });

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

    if (authError || !authData.user) {
      authLogger.warn('Portal login failed - invalid credentials', {
        email,
        ip: req.ip
      });
      throw new AuthenticationError('Credenciais inválidas');
    }

    // Get user data from portal_users table
    const { data: portalUser, error: userError } = await supabase
      .from('portal_users')
      .select(
        `
        id,
        nome,
        email,
        role,
        permissions,
        ativo,
        empresa_id,
        empresas(
          id,
          nome
        )
      `
      )
      .eq('auth_user_id', authData.user.id)
      .eq('ativo', true)
      .single();

    if (userError || !portalUser) {
      authLogger.warn('Portal login failed - user not found in portal_users', {
        email,
        supabaseUid: authData.user.id,
        ip: req.ip
      });
      throw new AuthenticationError('Usuário não encontrado ou inativo');
    }

    // Check if company is active (assuming empresas table has ativo column)
    // if (portalUser.empresas.ativo !== true) {
    //   authLogger.warn('Portal login failed - company inactive', {
    //     email,
    //     companyId: portalUser.empresa_id,
    //     ip: req.ip
    //   });
    //   throw new AuthenticationError(
    //     'Empresa inativa. Entre em contato com o suporte.'
    //   );
    // }

    // Update user app_metadata with company info
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      authData.user.id,
      {
        app_metadata: {
          ...authData.user.app_metadata,
          user_type: 'portal_user',
          user_id: portalUser.id,
          empresa_id: portalUser.empresa_id,
          empresa_slug: 'default',
          role: portalUser.role,
          nome: portalUser.nome,
          permissions: portalUser.permissions || []
        }
      }
    );

    if (updateError) {
      authLogger.warn('Failed to update user metadata', {
        userId: portalUser.id,
        error: updateError.message
      });
    }

    // Update last login
    await supabase
      .from('portal_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', portalUser.id);

    authLogger.info('Portal login successful', {
      userId: portalUser.id,
      email,
      companyId: portalUser.empresa_id
    });

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
        user: {
          id: portalUser.id,
          name: portalUser.nome,
          email: portalUser.email,
          role: portalUser.role,
          permissions: portalUser.permissions,
          user_type: 'portal_user',
          company: {
            id: portalUser.empresas.id,
            name: portalUser.empresas.nome
          }
        }
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
router.post(
  '/logout',
  authSupabase,
  asyncHandler(async (req, res) => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Logout error:', error);
      throw new AppError('Erro ao fazer logout', 500);
    }

    authLogger.info('User logged out', { userId: req.user?.id });

    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  })
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Obter dados do usuário atual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 */
router.get(
  '/me',
  authSupabase,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const userType = req.userType;

    let userData;

    if (userType === 'app_user') {
      const { data: appUser, error } = await supabase
        .from('app_users')
        .select(
          `
          id,
          name,
          email,
          phone,
          status,
          empresa_id,
          empresas!inner(
            id,
            name
          )
        `
        )
        .eq('auth_user_id', user.id)
        .single();

      if (error || !appUser) {
        throw new NotFoundError('Usuário não encontrado');
      }

      userData = {
        ...appUser,
        user_type: 'app_user',
        company: appUser.empresas
      };
      delete userData.empresas;
    } else {
      const { data: portalUser, error } = await supabase
        .from('portal_users')
        .select(
          `
          id,
          nome,
          email,
          role,
          empresa_id,
          empresas!inner(
            id,
            nome
          )
        `
        )
        .eq('auth_user_id', user.id)
        .single();

      if (error || !portalUser) {
        throw new NotFoundError('Usuário não encontrado');
      }

      userData = {
        ...portalUser,
        user_type: 'portal_user',
        company: portalUser.empresas
      };
      delete userData.empresas;
    }

    res.json({
      success: true,
      data: userData
    });
  })
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Renovar token de acesso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refresh_token: refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token é obrigatório');
    }

    const { data: authData, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error || !authData.session) {
      throw new AuthenticationError('Token inválido ou expirado');
    }

    res.json({
      success: true,
      message: 'Token renovado com sucesso',
      data: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      }
    });
  })
);

export default router;
