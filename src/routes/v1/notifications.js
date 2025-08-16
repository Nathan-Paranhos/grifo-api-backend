import express from 'express';
import { z } from 'zod';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
import { validation } from '../../middleware/validation.js';
import { requireRole } from '../../middleware/auth.js';
import { addCompanyFilter } from '../../middleware/tenant.js';

const router = express.Router();

// ============================================================================
// SCHEMAS DE VALIDAÇÃO
// ============================================================================

const createNotificationSchema = z.object({
  user_id: z.string().uuid('ID do usuário deve ser um UUID válido'),
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  message: z.string().min(1, 'Mensagem é obrigatória').max(1000, 'Mensagem muito longa'),
  type: z.enum(['info', 'warning', 'error', 'success'], 'Tipo inválido'),
  data: z.record(z.any()).optional(),
  scheduled_for: z.string().datetime().optional()
});

const updateNotificationSchema = z.object({
  read_at: z.string().datetime().optional(),
  archived_at: z.string().datetime().optional()
});

const pushNotificationSchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1, 'Pelo menos um usuário deve ser especificado'),
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  body: z.string().min(1, 'Corpo da mensagem é obrigatório').max(1000, 'Mensagem muito longa'),
  data: z.record(z.any()).optional(),
  badge: z.number().int().min(0).optional(),
  sound: z.string().optional(),
  click_action: z.string().url().optional()
});

// ============================================================================
// ROTAS
// ============================================================================

/**
 * GET /api/v1/tenants/:tenant/notifications
 * Listar notificações do usuário
 */
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unread_only = false, type } = req.query;
  const offset = (page - 1) * limit;
  
  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  // Aplicar filtro de empresa
  query = addCompanyFilter(query, req.tenant.id);
  
  // Filtros opcionais
  if (unread_only === 'true') {
    query = query.is('read_at', null);
  }
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data: notifications, error, count } = await query;
  
  if (error) {
    logger.error('Erro ao buscar notificações', { error, user_id: req.user.id });
    throw error;
  }
  
  res.json({
    success: true,
    data: notifications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count,
      pages: Math.ceil(count / limit)
    }
  });
}));

/**
 * POST /api/v1/tenants/:tenant/notifications
 * Criar nova notificação (apenas admins)
 */
router.post('/', 
  requireRole(['admin', 'manager']),
  validation(createNotificationSchema),
  asyncHandler(async (req, res) => {
    const notificationData = {
      ...req.body,
      company_id: req.tenant.id,
      created_by: req.user.id
    };
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .single();
    
    if (error) {
      logger.error('Erro ao criar notificação', { error, data: notificationData });
      throw error;
    }
    
    logger.info('Notificação criada', { notification_id: notification.id, user_id: req.user.id });
    
    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notificação criada com sucesso'
    });
  })
);

/**
 * PUT /api/v1/tenants/:tenant/notifications/:id
 * Atualizar notificação (marcar como lida, arquivar)
 */
router.put('/:id',
  validation(updateNotificationSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Verificar se a notificação pertence ao usuário
    const { data: existing, error: fetchError } = await supabase
      .from('notifications')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();
    
    if (fetchError || !existing) {
      return res.status(404).json({
        success: false,
        error: 'Notificação não encontrada'
      });
    }
    
    const { data: notification, error } = await supabase
      .from('notifications')
      .update(req.body)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Erro ao atualizar notificação', { error, id });
      throw error;
    }
    
    res.json({
      success: true,
      data: notification,
      message: 'Notificação atualizada com sucesso'
    });
  })
);

/**
 * POST /api/v1/tenants/:tenant/notifications/mark-all-read
 * Marcar todas as notificações como lidas
 */
router.post('/mark-all-read', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', req.user.id)
    .eq('company_id', req.tenant.id)
    .is('read_at', null)
    .select('id');
  
  if (error) {
    logger.error('Erro ao marcar notificações como lidas', { error, user_id: req.user.id });
    throw error;
  }
  
  res.json({
    success: true,
    message: `${data.length} notificações marcadas como lidas`,
    count: data.length
  });
}));

/**
 * GET /api/v1/tenants/:tenant/notifications/unread-count
 * Contar notificações não lidas
 */
router.get('/unread-count', asyncHandler(async (req, res) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', req.user.id)
    .eq('company_id', req.tenant.id)
    .is('read_at', null);
  
  if (error) {
    logger.error('Erro ao contar notificações não lidas', { error, user_id: req.user.id });
    throw error;
  }
  
  res.json({
    success: true,
    count: count || 0
  });
}));

/**
 * POST /api/v1/tenants/:tenant/notifications/push
 * Enviar notificação push (apenas admins)
 */
router.post('/push',
  requireRole(['admin', 'manager']),
  validation(pushNotificationSchema),
  asyncHandler(async (req, res) => {
    const { user_ids, title, body, data, badge, sound, click_action } = req.body;
    
    // Buscar tokens FCM dos usuários
    const { data: users, error: usersError } = await supabase
      .from('company_members')
      .select('user_id, users(fcm_token)')
      .eq('company_id', req.tenant.id)
      .in('user_id', user_ids)
      .not('users.fcm_token', 'is', null);
    
    if (usersError) {
      logger.error('Erro ao buscar tokens FCM', { error: usersError });
      throw usersError;
    }
    
    const tokens = users
      .map(u => u.users?.fcm_token)
      .filter(Boolean);
    
    if (tokens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum token FCM encontrado para os usuários especificados'
      });
    }
    
    // TODO: Implementar envio via FCM
    // Por enquanto, apenas simular o envio
    logger.info('Push notification enviada', {
      tokens: tokens.length,
      title,
      body,
      sent_by: req.user.id
    });
    
    // Criar notificações no banco para cada usuário
    const notifications = user_ids.map(user_id => ({
      user_id,
      company_id: req.tenant.id,
      title,
      message: body,
      type: 'info',
      data: data || {},
      created_by: req.user.id
    }));
    
    const { data: createdNotifications, error: createError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();
    
    if (createError) {
      logger.error('Erro ao criar notificações', { error: createError });
      throw createError;
    }
    
    res.json({
      success: true,
      message: `Push notification enviada para ${tokens.length} dispositivos`,
      data: {
        tokens_sent: tokens.length,
        notifications_created: createdNotifications.length
      }
    });
  })
);

export default router;