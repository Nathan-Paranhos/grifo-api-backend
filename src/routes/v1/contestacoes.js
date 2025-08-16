import express from 'express';
import { z } from 'zod';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import {
  asyncHandler,
  AppError,
  ValidationError,
  NotFoundError,
  AuthorizationError
} from '../../middleware/errorHandler.js';
import { validateRequest, commonSchemas } from '../../middleware/validation.js';
import {
  authSupabase,
  requireRole
} from '../../middleware/auth.js';

const router = express.Router();

// Validation schemas
const contestacaoSchemas = {
  getContestacao: {
    params: z.object({
      id: commonSchemas.uuid
    })
  },
  createContestacao: {
    body: z.object({
      vistoria_id: commonSchemas.uuid,
      item_vistoria_id: commonSchemas.uuid.optional(),
      tipo: z.enum(['item', 'geral', 'procedimento']),
      motivo: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres'),
      descricao: z
        .string()
        .min(20, 'Descrição deve ter pelo menos 20 caracteres'),
      evidencias: z.array(z.string().url()).optional(),
      prioridade: z.enum(['baixa', 'media', 'alta']).default('media')
    })
  },
  updateContestacao: {
    params: z.object({
      id: commonSchemas.uuid
    }),
    body: z.object({
      motivo: z
        .string()
        .min(10, 'Motivo deve ter pelo menos 10 caracteres')
        .optional(),
      descricao: z
        .string()
        .min(20, 'Descrição deve ter pelo menos 20 caracteres')
        .optional(),
      evidencias: z.array(z.string().url()).optional(),
      prioridade: z.enum(['baixa', 'media', 'alta']).optional()
    })
  },
  respondContestacao: {
    params: z.object({
      id: commonSchemas.uuid
    }),
    body: z.object({
      resposta: z
        .string()
        .min(10, 'Resposta deve ter pelo menos 10 caracteres'),
      status: z.enum(['aceita', 'rejeitada', 'em_analise']),
      observacoes: z.string().optional()
    })
  },
  addComment: {
    params: z.object({
      id: commonSchemas.uuid
    }),
    body: z.object({
      comentario: z
        .string()
        .min(5, 'Comentário deve ter pelo menos 5 caracteres')
    })
  }
};

/**
 * @swagger
 * /api/v1/contestacoes:
 *   get:
 *     tags: [Contestações]
 *     summary: Listar contestações
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pendente, em_analise, aceita, rejeitada]
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [item, geral, procedimento]
 *     responses:
 *       200:
 *         description: Lista de contestações
 */
router.get(
  '/',
  authSupabase,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      tipo,
      vistoria_id: vistoriaId,
      search
    } = req.query;
    const offset = (page - 1) * limit;
    const empresaId = req.user.app_metadata.empresa_id;
    const userType = req.userType;
    const userData = req.user;

    let query = supabase
      .from('contestacoes')
      .select(
        `
        id,
        tipo,
        motivo,
        descricao,
        status,
        prioridade,
        created_at,
        updated_at,
        vistorias!inner(
          id,
          data_vistoria,
          tipo_vistoria,
          imoveis!inner(
            id,
            endereco,
            cidade
          )
        ),
        app_users!contestacoes_solicitante_id_fkey(
          id,
          name,
          email
        ),
        portal_users!contestacoes_respondido_por_fkey(
          id,
          name,
          email
        ),
        itens_vistoria(
          id,
          categoria,
          item,
          estado
        )
      `,
        { count: 'exact' }
      )
      .eq('empresa_id', empresaId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    // Filter by user type and permissions
    if (userType === 'app_user') {
      // App users can only see their own contestations
      query = query.eq('solicitante_id', userData.id);
    } else if (userType === 'portal_user' && userData.role === 'inspector') {
      // Inspectors can see contestations for their inspections
      query = query.eq('vistorias.vistoriador_id', userData.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    if (vistoriaId) {
      query = query.eq('vistoria_id', vistoriaId);
    }

    if (search) {
      query = query.or(`motivo.ilike.%${search}%,descricao.ilike.%${search}%`);
    }

    const { data: contestacoes, error, count } = await query;

    if (error) {
      logger.error('Error fetching contestacoes:', error);
      throw new AppError('Erro ao buscar contestações', 500);
    }

    res.json({
      success: true,
      data: contestacoes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/contestacoes/{id}:
 *   get:
 *     tags: [Contestações]
 *     summary: Obter contestação por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Dados da contestação
 */
router.get(
  '/:id',
  authSupabase,
  validateRequest(contestacaoSchemas.getContestacao),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const empresaId = req.user.app_metadata.empresa_id;
    const userType = req.userType;
    const userData = req.user;

    let query = supabase
      .from('contestacoes')
      .select(
        `
        id,
        tipo,
        motivo,
        descricao,
        status,
        prioridade,
        evidencias,
        resposta,
        observacoes_resposta,
        data_resposta,
        created_at,
        updated_at,
        vistorias!inner(
          id,
          data_vistoria,
          tipo_vistoria,
          status as vistoria_status,
          imoveis!inner(
            id,
            endereco,
            cidade,
            tipo_imovel
          ),
          portal_users!vistorias_vistoriador_id_fkey(
            id,
            name,
            email
          )
        ),
        app_users!contestacoes_solicitante_id_fkey(
          id,
          name,
          email,
          phone
        ),
        portal_users!contestacoes_respondido_por_fkey(
          id,
          name,
          email
        ),
        itens_vistoria(
          id,
          categoria,
          item,
          estado,
          observacoes,
          foto_url
        )
      `
      )
      .eq('id', id)
      .eq('empresa_id', empresaId);

    // Apply user-specific filters
    if (userType === 'app_user') {
      query = query.eq('solicitante_id', userData.id);
    } else if (userType === 'portal_user' && userData.role === 'inspector') {
      query = query.eq('vistorias.vistoriador_id', userData.id);
    }

    const { data: contestacao, error } = await query.single();

    if (error || !contestacao) {
      throw new NotFoundError('Contestação não encontrada');
    }

    res.json({
      success: true,
      data: contestacao
    });
  })
);

/**
 * @swagger
 * /api/v1/contestacoes:
 *   post:
 *     tags: [Contestações]
 *     summary: Criar nova contestação
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Contestação criada com sucesso
 */
router.post(
  '/',
  authSupabase,

  validateRequest(contestacaoSchemas.createContestacao),
  asyncHandler(async (req, res) => {
    const contestacaoData = req.body;
    const empresaId = req.user.app_metadata.empresa_id;
    const userId = req.user.id;

    // Verify inspection belongs to company and user
    const { data: vistoria, error: vistoriaError } = await supabase
      .from('vistorias')
      .select('id, status, solicitante_id')
      .eq('id', contestacaoData.vistoria_id)
      .eq('empresa_id', empresaId)
      .single();

    if (vistoriaError || !vistoria) {
      throw new ValidationError(
        'Vistoria não encontrada ou não pertence à empresa'
      );
    }

    // Only the requester can create contestations for their inspections
    if (vistoria.solicitante_id !== userId) {
      throw new AuthorizationError(
        'Você só pode contestar suas próprias vistorias'
      );
    }

    // Can only contest completed inspections
    if (vistoria.status !== 'concluida') {
      throw new ValidationError('Só é possível contestar vistorias concluídas');
    }

    // Verify item belongs to inspection if specified
    if (contestacaoData.item_vistoria_id) {
      const { data: item, error: itemError } = await supabase
        .from('itens_vistoria')
        .select('id')
        .eq('id', contestacaoData.item_vistoria_id)
        .eq('vistoria_id', contestacaoData.vistoria_id)
        .single();

      if (itemError || !item) {
        throw new ValidationError('Item de vistoria não encontrado');
      }
    }

    // Check if there's already a pending contestation for this inspection
    const { data: existingContestacao } = await supabase
      .from('contestacoes')
      .select('id')
      .eq('vistoria_id', contestacaoData.vistoria_id)
      .eq('solicitante_id', userId)
      .in('status', ['pendente', 'em_analise'])
      .single();

    if (existingContestacao) {
      throw new ValidationError(
        'Já existe uma contestação pendente para esta vistoria'
      );
    }

    const { data: contestacao, error } = await supabase
      .from('contestacoes')
      .insert({
        ...contestacaoData,
        empresa_id: empresaId,
        solicitante_id: userId,
        status: 'pendente',
        created_at: new Date().toISOString()
      })
      .select(
        `
        id,
        tipo,
        motivo,
        descricao,
        status,
        prioridade,
        created_at,
        vistorias!inner(
          id,
          data_vistoria,
          imoveis!inner(
            endereco,
            cidade
          )
        )
      `
      )
      .single();

    if (error) {
      logger.error('Error creating contestacao:', error);
      throw new AppError('Erro ao criar contestação', 500);
    }

    logger.info('Contestacao created successfully', {
      contestacaoId: contestacao.id,
      createdBy: userId,
      empresaId
    });

    res.status(201).json({
      success: true,
      message: 'Contestação criada com sucesso',
      data: contestacao
    });
  })
);

/**
 * @swagger
 * /api/v1/contestacoes/{id}:
 *   put:
 *     tags: [Contestações]
 *     summary: Atualizar contestação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Contestação atualizada com sucesso
 */
router.put(
  '/:id',
  authSupabase,

  validateRequest(contestacaoSchemas.updateContestacao),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const empresaId = req.user.app_metadata.empresa_id;
    const userId = req.user.id;

    // Get current contestacao
    const { data: currentContestacao, error: fetchError } = await supabase
      .from('contestacoes')
      .select('id, status, solicitante_id')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single();

    if (fetchError || !currentContestacao) {
      throw new NotFoundError('Contestação não encontrada');
    }

    // Only the creator can update their contestation
    if (currentContestacao.solicitante_id !== userId) {
      throw new AuthorizationError(
        'Você só pode atualizar suas próprias contestações'
      );
    }

    // Can only update pending contestations
    if (currentContestacao.status !== 'pendente') {
      throw new ValidationError(
        'Só é possível atualizar contestações pendentes'
      );
    }

    const { data: contestacao, error } = await supabase
      .from('contestacoes')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating contestacao:', error);
      throw new AppError('Erro ao atualizar contestação', 500);
    }

    logger.info('Contestacao updated successfully', {
      contestacaoId: id,
      updatedBy: userId,
      empresaId
    });

    res.json({
      success: true,
      message: 'Contestação atualizada com sucesso',
      data: contestacao
    });
  })
);

/**
 * @swagger
 * /api/v1/contestacoes/{id}/respond:
 *   post:
 *     tags: [Contestações]
 *     summary: Responder contestação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Resposta enviada com sucesso
 */
router.post(
  '/:id/respond',
  authSupabase,

  requireRole(['admin', 'manager']),
  validateRequest(contestacaoSchemas.respondContestacao),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { resposta, status, observacoes } = req.body;
    const empresaId = req.user.app_metadata.empresa_id;
    const userId = req.user.id;

    // Get current contestacao
    const { data: currentContestacao, error: fetchError } = await supabase
      .from('contestacoes')
      .select('id, status')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single();

    if (fetchError || !currentContestacao) {
      throw new NotFoundError('Contestação não encontrada');
    }

    // Can only respond to pending or under analysis contestations
    if (!['pendente', 'em_analise'].includes(currentContestacao.status)) {
      throw new ValidationError('Esta contestação já foi respondida');
    }

    const { data: contestacao, error } = await supabase
      .from('contestacoes')
      .update({
        status,
        resposta,
        observacoes_resposta: observacoes,
        respondido_por: userId,
        data_resposta: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select(
        `
        id,
        tipo,
        motivo,
        status,
        resposta,
        data_resposta,
        vistorias!inner(
          id,
          imoveis!inner(
            endereco,
            cidade
          )
        ),
        app_users!contestacoes_solicitante_id_fkey(
          name,
          email
        )
      `
      )
      .single();

    if (error) {
      logger.error('Error responding to contestacao:', error);
      throw new AppError('Erro ao responder contestação', 500);
    }

    logger.info('Contestacao responded successfully', {
      contestacaoId: id,
      respondedBy: userId,
      newStatus: status,
      empresaId
    });

    res.json({
      success: true,
      message: 'Resposta enviada com sucesso',
      data: contestacao
    });
  })
);

/**
 * @swagger
 * /api/v1/contestacoes/{id}/status:
 *   patch:
 *     tags: [Contestações]
 *     summary: Atualizar status da contestação
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 */
router.patch(
  '/:id/status',
  authSupabase,

  requireRole(['admin', 'manager']),
  validateRequest({
    params: z.object({ id: commonSchemas.uuid }),
    body: z.object({
      status: z.enum(['pendente', 'em_analise', 'aceita', 'rejeitada'])
    })
  }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const empresaId = req.user.app_metadata.empresa_id;
    const userId = req.user.id;

    // Get current contestacao
    const { data: currentContestacao, error: fetchError } = await supabase
      .from('contestacoes')
      .select('id, status')
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .single();

    if (fetchError || !currentContestacao) {
      throw new NotFoundError('Contestação não encontrada');
    }

    // Validate status transitions
    const validTransitions = {
      pendente: ['em_analise', 'aceita', 'rejeitada'],
      em_analise: ['aceita', 'rejeitada', 'pendente'],
      aceita: [], // Final status
      rejeitada: ['em_analise'] // Can reopen for analysis
    };

    if (!validTransitions[currentContestacao.status].includes(status)) {
      throw new ValidationError(
        `Não é possível alterar status de '${currentContestacao.status}' para '${status}'`
      );
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString()
    };

    // Set analysis start date when moving to em_analise
    if (status === 'em_analise' && currentContestacao.status === 'pendente') {
      updateData.data_inicio_analise = new Date().toISOString();
    }

    const { data: contestacao, error } = await supabase
      .from('contestacoes')
      .update(updateData)
      .eq('id', id)
      .eq('empresa_id', empresaId)
      .select()
      .single();

    if (error) {
      logger.error('Error updating contestacao status:', error);
      throw new AppError('Erro ao atualizar status da contestação', 500);
    }

    logger.info('Contestacao status updated successfully', {
      contestacaoId: id,
      newStatus: status,
      updatedBy: userId,
      empresaId
    });

    res.json({
      success: true,
      message: 'Status da contestação atualizado com sucesso',
      data: contestacao
    });
  })
);

/**
 * @swagger
 * /api/v1/contestacoes/stats:
 *   get:
 *     tags: [Contestações]
 *     summary: Obter estatísticas das contestações
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estatísticas das contestações
 */
router.get(
  '/stats',
  authSupabase,
  asyncHandler(async (req, res) => {
    const empresaId = req.user.app_metadata.empresa_id;
    const userType = req.userType;
    const userData = req.user;

    let baseQuery = supabase
      .from('contestacoes')
      .select('*', { count: 'exact' })
      .eq('empresa_id', empresaId);

    // Apply user-specific filters
    if (userType === 'app_user') {
      baseQuery = baseQuery.eq('solicitante_id', userData.id);
    }

    // Get various stats in parallel
    const [
      totalResult,
      pendenteResult,
      emAnaliseResult,
      aceitaResult,
      rejeitadaResult
    ] = await Promise.all([
      baseQuery,
      supabase
        .from('contestacoes')
        .select('id', { count: 'exact' })
        .eq('empresa_id', empresaId)
        .eq('status', 'pendente'),
      supabase
        .from('contestacoes')
        .select('id', { count: 'exact' })
        .eq('empresa_id', empresaId)
        .eq('status', 'em_analise'),
      supabase
        .from('contestacoes')
        .select('id', { count: 'exact' })
        .eq('empresa_id', empresaId)
        .eq('status', 'aceita'),
      supabase
        .from('contestacoes')
        .select('id', { count: 'exact' })
        .eq('empresa_id', empresaId)
        .eq('status', 'rejeitada')
    ]);

    const stats = {
      total: totalResult.count || 0,
      pendente: pendenteResult.count || 0,
      em_analise: emAnaliseResult.count || 0,
      aceita: aceitaResult.count || 0,
      rejeitada: rejeitadaResult.count || 0
    };

    res.json({
      success: true,
      data: stats
    });
  })
);

export default router;
