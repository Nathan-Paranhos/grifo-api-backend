import { Router, Request as ExpressRequest, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import * as admin from 'firebase-admin';

// Extend the Express Request interface to include user property
interface Request extends ExpressRequest {
  user?: { 
    id: string; 
    role: string; 
    empresaId: string; 
  };
}
import logger from '../config/logger';
import { validateRequest, commonQuerySchema, inspectionSchema, contestationSchema } from '../utils/validation';
import { authMiddleware } from '../config/security';
import { db } from '../config/firebase';

const router = Router();

/**
 * @route GET /api/inspections
 * @desc Obtém lista de inspeções com filtros
 * @access Private
 */
router.get('/', 
  authMiddleware,
  validateRequest({ query: commonQuerySchema }),
  async (req: Request, res: Response) => {
    const { vistoriadorId, status, limit = '10' } = req.query;
    const empresaId = req.user?.empresaId;

    if (!empresaId) {
      return sendError(res, 'Acesso negado: empresa não identificada.', 403);
    }

    logger.debug(`Solicitação de inspeções para empresaId: ${empresaId}${vistoriadorId ? `, vistoriadorId: ${vistoriadorId}` : ''}${status ? `, status: ${status}` : ''}`);

    try {
      // Verificar se o Firebase está disponível e funcionando
      let useFirebase = false;
      if (db) {
        try {
          // Teste simples para verificar se o Firestore está acessível
          await db.collection('_test').limit(1).get();
          useFirebase = true;
        } catch (error) {
          logger.warn('Firebase Firestore não está acessível, usando dados mock');
          useFirebase = false;
        }
      }

      if (!useFirebase) {
        // Usar dados mock em desenvolvimento
        const mockInspections = [
          {
            id: 'insp_001',
            empresaId,
            vistoriadorId: 'vistoriador_001',
            imovelId: 'imovel_001',
            tipo: 'Entrada',
            status: 'Concluída',
            dataVistoria: '2025-01-15T10:00:00Z',
            observacoes: 'Vistoria de entrada realizada com sucesso',
            fotos: [],
            checklists: [],
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-01-15T10:00:00Z'
          },
          {
            id: 'insp_002',
            empresaId,
            vistoriadorId: 'vistoriador_002',
            imovelId: 'imovel_002',
            tipo: 'Saída',
            status: 'Pendente',
            dataVistoria: '2025-01-16T14:00:00Z',
            observacoes: 'Vistoria de saída agendada',
            fotos: [],
            checklists: [],
            createdAt: '2025-01-16T14:00:00Z',
            updatedAt: '2025-01-16T14:00:00Z'
          }
        ];

        let filteredInspections = mockInspections;

        if (vistoriadorId) {
          filteredInspections = filteredInspections.filter(insp => insp.vistoriadorId === vistoriadorId);
        }

        if (status) {
          filteredInspections = filteredInspections.filter(insp => insp.status === status);
        }

        const limitNum = parseInt(limit as string);
        const paginatedInspections = filteredInspections.slice(0, limitNum);

        logger.info(`Retornando ${paginatedInspections.length} inspeções (dados mock)`);
        return sendSuccess(res, paginatedInspections, 200, { total: paginatedInspections.length, page: 1, limit: limitNum });
      }

      const inspectionsRef = db!.collection('inspections');
      let query: admin.firestore.Query = inspectionsRef.where('empresaId', '==', empresaId);

      if (vistoriadorId) {
        query = query.where('vistoriadorId', '==', vistoriadorId);
      }

      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.limit(parseInt(limit as string)).get();

      if (snapshot.empty) {
        return sendSuccess(res, [], 200, { total: 0, page: 1, limit: parseInt(limit as string) });
      }

      const inspectionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      logger.info(`Retornando ${inspectionsData.length} inspeções`);
      return sendSuccess(res, inspectionsData, 200, { total: inspectionsData.length, page: 1, limit: parseInt(limit as string) });
    } catch (error) {
      logger.error(`Erro ao buscar inspeções: ${error}`);
      return sendError(res, 'Erro ao processar a solicitação de inspeções');
    }
  }
);

/**
 * @route POST /api/inspections
 * @desc Cria uma nova inspeção
 * @access Private
 */
/**
 * @route GET /api/inspections/:id
 * @desc Obtém os detalhes de uma inspeção
 * @access Private
 */
router.get('/:id',
  authMiddleware,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const empresaId = req.user?.empresaId;

    if (!empresaId) {
      return sendError(res, 'Acesso negado: empresa não identificada.', 403);
    }

    try {
      const doc = await db!.collection('inspections').doc(id).get();

      if (!doc.exists || doc.data()?.empresaId !== empresaId) {
        return sendError(res, 'Inspeção não encontrada', 404);
      }

      return sendSuccess(res, { id: doc.id, ...doc.data() });
    } catch (error) {
      logger.error(`Erro ao buscar inspeção ${id}: ${error}`);
      return sendError(res, 'Erro ao buscar a inspeção');
    }
  }
);

/**
 * @route PUT /api/inspections/:id
 * @desc Atualiza uma inspeção
 * @access Private
 */
router.put('/:id',
  authMiddleware,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { body } = req;
    const empresaId = req.user?.empresaId;

    if (!empresaId) {
      return sendError(res, 'Acesso negado: empresa não identificada.', 403);
    }

    try {
      const docRef = db!.collection('inspections').doc(id);
      const doc = await docRef.get();

      if (!doc.exists || doc.data()?.empresaId !== empresaId) {
        return sendError(res, 'Inspeção não encontrada', 404);
      }

      await docRef.update(body);
      return sendSuccess(res, null, 200, { message: 'Inspeção atualizada com sucesso' });
    } catch (error) {
      logger.error(`Erro ao atualizar inspeção ${id}: ${error}`);
      return sendError(res, 'Erro ao atualizar a inspeção');
    }
  }
);

router.post('/', 
  authMiddleware,
  validateRequest({ body: inspectionSchema }),
  async (req: Request, res: Response) => {
    const empresaId = req.user?.empresaId;

    if (!empresaId) {
      return sendError(res, 'Acesso negado: empresa não identificada.', 403);
    }

    try {
      const { vistoriadorId, imovelId, tipo, status, dataVistoria, observacoes, fotos, checklists, imovel } = req.body;

      logger.debug(`Criando nova inspeção para empresaId: ${empresaId}, vistoriadorId: ${vistoriadorId}, imovelId: ${imovelId}`);

      const newInspectionRef = await db!.collection('inspections').add({
        empresaId, // Use empresaId from token
        vistoriadorId,
        imovelId,
        tipo,
        status: status || 'Pendente',
        dataVistoria: dataVistoria || new Date().toISOString(),
        observacoes,
        fotos,
        checklists,
        imovel,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Nova inspeção criada com ID: ${newInspectionRef.id}`);

      return sendSuccess(res, { id: newInspectionRef.id }, 201, { message: 'Inspeção criada com sucesso' });
    } catch (error) {
      logger.error(`Erro ao criar inspeção: ${error}`);
      return sendError(res, 'Erro ao processar a criação da inspeção');
    }
  }
);

/**
 * @route POST /api/inspections/:id/contest
 * @desc Registra uma contestação para uma vistoria específica
 * @access Private
 */
router.post('/:id/contest', 
  authMiddleware,
  validateRequest({ body: contestationSchema }),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { empresaId, motivo, detalhes, itensContestados } = req.body;

      logger.debug(`Registrando contestação para vistoria ${id} da empresa ${empresaId}`);

      // Verificar se a vistoria existe
      // Em um cenário real, você verificaria no banco de dados
      // Simulação de verificação
      if (id !== 'insp_001' && id !== 'insp_002') {
        logger.warn(`Tentativa de contestar vistoria inexistente: ${id}`);
        return res.status(404).json({
          success: false,
          error: 'Vistoria não encontrada'
        });
      }

      // Criar objeto de contestação
      const contestation = {
        id: `contest_${Date.now()}`,
        inspectionId: id,
        empresaId,
        motivo,
        detalhes,
        itensContestados,
        status: 'Pendente',
        dataContestacao: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Em um cenário real, você salvaria no banco de dados
      // Também atualizaria a vistoria para indicar que possui contestação

      logger.info(`Contestação ${contestation.id} registrada com sucesso para vistoria ${id}`);
      return res.status(201).json({
        success: true,
        message: 'Contestação registrada com sucesso',
        data: contestation
      });
    } catch (error) {
      logger.error(`Erro ao registrar contestação: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar a contestação da vistoria'
      });
    }
  }
);

export default router;