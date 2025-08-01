import { Router, Request as ExpressRequest, Response } from 'express';

// Extend the Express Request interface to include user property
interface Request extends ExpressRequest {
  user?: { 
    id: string; 
    uid: string;
    role: string; 
    empresaId: string; 
  };
}
import { authMiddleware } from '../config/security';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';
import { validateRequest, contestationSchema, contestationStatusSchema } from '../utils/validation';
import { db } from '../config/firebase';

const router = Router();

/**
 * @route POST /api/contestations
 * @desc Registra uma nova contestação para uma vistoria
 */
router.post('/',
  authMiddleware,
  validateRequest({ body: contestationSchema }),
  async (req: Request, res: Response) => {
    try {
      const { empresaId, inspectionId, motivo, detalhes, clienteId } = req.body;
      
      if (!inspectionId) {
        logger.warn('Tentativa de criar contestação sem fornecer inspectionId');
        return sendError(res, 'ID da vistoria é obrigatório', 400);
      }

      logger.info(`Registrando contestação para vistoria ${inspectionId} da empresa ${empresaId}`);

      // Verificar se a vistoria existe
      if (!db) {
        return sendError(res, 'Serviço de banco de dados indisponível', 503);
      }
      const inspectionDoc = await db.collection('vistorias').doc(inspectionId).get();
      if (!inspectionDoc.exists) {
        return sendError(res, 'Vistoria não encontrada', 404);
      }

      // Criar objeto de contestação
      const contestation = {
        id: `contest_${Date.now()}`,
        inspectionId,
        empresaId,
        clienteId: clienteId || req.user?.uid,
        motivo,
        detalhes,
        status: 'pendente',
        dataContestacao: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Salvar contestação no Firestore
      await db.collection('contestations').doc(contestation.id).set(contestation);
      
      // Atualizar vistoria para indicar que possui contestação
      await db.collection('vistorias').doc(inspectionId).update({ 
        hasContestation: true,
        updatedAt: new Date().toISOString()
      });

      logger.info(`Contestação ${contestation.id} registrada com sucesso para vistoria ${inspectionId}`);
      return sendSuccess(res, contestation, 201, { message: 'Contestação registrada com sucesso' });
    } catch (error) {
      logger.error(`Erro ao registrar contestação: ${error}`);
      return sendError(res, 'Erro ao processar a contestação da vistoria');
    }
  }
);

/**
 * @route GET /api/contestations
 * @desc Lista todas as contestações para uma empresa
 */
router.get('/',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { empresaId, inspectionId, status, clienteId } = req.query as {
        empresaId?: string;
        inspectionId?: string;
        status?: string;
        clienteId?: string;
      };

      if (!empresaId) {
        logger.warn('Tentativa de listar contestações sem fornecer empresaId');
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }

      logger.info(`Listando contestações para empresa ${empresaId}`);

      // Construir query do Firestore
      if (!db) {
        return sendError(res, 'Serviço de banco de dados indisponível', 503);
      }
      let query = db.collection('contestations').where('empresaId', '==', empresaId);
      
      if (inspectionId) {
        query = query.where('inspectionId', '==', inspectionId);
      }
      
      if (status) {
        query = query.where('status', '==', status);
      }
      
      if (clienteId) {
        query = query.where('clienteId', '==', clienteId);
      }

      // Ordenar por data de criação (mais recentes primeiro)
      query = query.orderBy('createdAt', 'desc');

      const snapshot = await query.get();
      const contestations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Buscar informações das vistorias relacionadas
      const contestationsWithInspections = await Promise.all(
        contestations.map(async (contestation: any) => {
          try {
            if (!db) return contestation;
            const inspectionDoc = await db.collection('vistorias').doc(contestation.inspectionId).get();
            if (inspectionDoc.exists) {
              contestation.inspection = {
                id: inspectionDoc.id,
                ...inspectionDoc.data()
              };
            }
          } catch (error) {
            logger.warn(`Erro ao buscar vistoria ${contestation.inspectionId}: ${error}`);
          }
          return contestation;
        })
      );

      logger.info(`Retornando ${contestationsWithInspections.length} contestações`);
      return sendSuccess(res, contestationsWithInspections);
    } catch (error) {
      logger.error(`Erro ao listar contestações: ${error}`);
      return sendError(res, 'Erro ao buscar contestações');
    }
  }
);

/**
 * @route GET /api/contestations/:id
 * @desc Obtém detalhes de uma contestação específica
 */
router.get('/:id',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { empresaId } = req.query as { empresaId?: string };

      if (!empresaId) {
        logger.warn('Tentativa de acessar contestação sem fornecer empresaId');
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }

      logger.info(`Buscando contestação ${id} para empresa ${empresaId}`);

      if (!db) {
        return sendError(res, 'Serviço de banco de dados indisponível', 503);
      }
      const contestationDoc = await db.collection('contestations').doc(id).get();
      
      if (!contestationDoc.exists) {
        return sendError(res, 'Contestação não encontrada', 404);
      }

      const contestation = {
        id: contestationDoc.id,
        ...contestationDoc.data()
      };

      // Verificar se a contestação pertence à empresa
      if ((contestation as any).empresaId !== empresaId) {
        return sendError(res, 'Acesso negado', 403);
      }

      // Buscar informações da vistoria relacionada
      try {
        if (db) {
          const inspectionDoc = await db.collection('vistorias').doc((contestation as any).inspectionId).get();
          if (inspectionDoc.exists) {
            (contestation as any).inspection = {
              id: inspectionDoc.id,
              ...inspectionDoc.data()
            };
          }
        }
      } catch (error) {
        logger.warn(`Erro ao buscar vistoria relacionada: ${error}`);
      }

      logger.info(`Contestação ${id} encontrada`);
      return sendSuccess(res, contestation);
    } catch (error) {
      logger.error(`Erro ao buscar contestação: ${error}`);
      return sendError(res, 'Erro ao buscar contestação');
    }
  }
);

/**
 * @route PUT /api/contestations/:id/status
 * @desc Atualiza o status de uma contestação
 */
router.put('/:id/status',
  authMiddleware,
  validateRequest({
    body: contestationStatusSchema
  }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, resposta } = req.body;
      const { empresaId } = req.query as { empresaId?: string };

      if (!empresaId) {
        logger.warn('Tentativa de atualizar contestação sem fornecer empresaId');
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }

      logger.info(`Atualizando status da contestação ${id} para ${status}`);

      // Verificar se a contestação existe
      if (!db) {
        return sendError(res, 'Serviço de banco de dados indisponível', 503);
      }
      const contestationDoc = await db.collection('contestations').doc(id).get();
      
      if (!contestationDoc.exists) {
        return sendError(res, 'Contestação não encontrada', 404);
      }

      // Verificar se a contestação pertence à empresa
      const contestationData = contestationDoc.data();
      if (contestationData?.empresaId !== empresaId) {
        return sendError(res, 'Acesso negado', 403);
      }

      // Atualizar contestação
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (resposta) {
        updateData.respostaAdmin = resposta;
        updateData.dataResposta = new Date().toISOString();
      }

      await db.collection('contestations').doc(id).update(updateData);

      logger.info(`Status da contestação ${id} atualizado para ${status}`);
      return sendSuccess(res, { id, status, updatedAt: updateData.updatedAt }, 200, { message: 'Status da contestação atualizado com sucesso' });
    } catch (error) {
      logger.error(`Erro ao atualizar status da contestação: ${error}`);
      return sendError(res, 'Erro ao atualizar contestação');
    }
  }
);

/**
 * @route GET /api/contestations/stats
 * @desc Obtém estatísticas de contestações
 */
router.get('/stats',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { empresaId } = req.query as { empresaId?: string };

      if (!empresaId) {
        return sendError(res, 'ID da empresa é obrigatório', 400);
      }

      logger.info(`Buscando estatísticas de contestações para empresa ${empresaId}`);

      if (!db) {
        return sendError(res, 'Serviço de banco de dados indisponível', 503);
      }
      const snapshot = await db.collection('contestations')
        .where('empresaId', '==', empresaId)
        .get();

      const contestations = snapshot.docs.map(doc => doc.data());

      const stats = {
        total: contestations.length,
        pendente: contestations.filter(c => c.status === 'pendente').length,
        em_analise: contestations.filter(c => c.status === 'em_analise').length,
        aprovada: contestations.filter(c => c.status === 'aprovada').length,
        rejeitada: contestations.filter(c => c.status === 'rejeitada').length,
      };

      return sendSuccess(res, stats);
    } catch (error) {
      logger.error(`Erro ao buscar estatísticas de contestações: ${error}`);
      return sendError(res, 'Erro ao buscar estatísticas');
    }
  }
);

export default router;