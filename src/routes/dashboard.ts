import { Router, Request as ExpressRequest, Response } from 'express';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

// Extend the Express Request interface to include user property
interface Request extends ExpressRequest {
  user?: { 
    id: string; 
    role: string; 
    empresaId: string; 
  };
}
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';
import { validateRequest, commonQuerySchema } from '../utils/validation';
import { authMiddleware } from '../config/security';

const router = Router();

/**
 * @route GET /api/dashboard
 * @desc Obtém informações gerais do dashboard
 * @access Private
 */
const getDashboardStats = async (empresaId: string, vistoriadorId?: string) => {
  const inspectionsRef = db!.collection('inspections');
  let query: admin.firestore.Query = inspectionsRef.where('empresaId', '==', empresaId);

  if (vistoriadorId) {
    query = query.where('vistoriadorId', '==', vistoriadorId);
  }

  const snapshot = await query.get();
  const inspections = snapshot.docs.map(doc => doc.data());

  const total = inspections.length;
  const pendentes = inspections.filter(i => i.status === 'Pendente').length;
  const concluidas = inspections.filter(i => i.status === 'Finalizado').length;
  const emAndamento = inspections.filter(i => i.status === 'Em Andamento').length;

  return {
    overview: {
      total,
      pendentes,
      concluidas,
      emAndamento
    }
  };
};

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const { empresaId, vistoriadorId } = req.query;
  
  logger.debug(`Solicitação de informações gerais do dashboard para empresaId: ${empresaId}${vistoriadorId ? `, vistoriadorId: ${vistoriadorId}` : ''}`);
  
  try {
    const empresaId = req.user?.empresaId;
    if (!empresaId) {
      return sendError(res, 'Acesso negado: empresa não identificada.', 403);
    }
    const stats = await getDashboardStats(empresaId, req.query.vistoriadorId as string | undefined);
    logger.info(`Informações gerais do dashboard retornadas com sucesso`);
    return sendSuccess(res, stats);
  } catch (error) {
    logger.error(`Erro ao obter informações gerais do dashboard: ${error}`);
    return sendError(res, 'Erro ao processar a solicitação de informações do dashboard');
  }
});

/**
 * @route GET /api/dashboard/stats
 * @desc Obtém estatísticas do dashboard
 * @access Private
 */
router.get('/stats', 
  authMiddleware,
  validateRequest({ query: commonQuerySchema }),
  async (req: Request, res: Response) => {
    const { empresaId, vistoriadorId } = req.query;
    
    logger.debug(`Solicitação de estatísticas do dashboard para empresaId: ${empresaId}${vistoriadorId ? `, vistoriadorId: ${vistoriadorId}` : ''}`);
    
    try {
      const empresaId = req.user?.empresaId;
      if (!empresaId) {
        return sendError(res, 'Acesso negado: empresa não identificada.', 403);
      }
      const stats = await getDashboardStats(empresaId, req.query.vistoriadorId as string | undefined);
      logger.info(`Estatísticas do dashboard retornadas com sucesso`);
      return sendSuccess(res, stats);
    } catch (error) {
      logger.error(`Erro ao obter estatísticas do dashboard: ${error}`);
      return sendError(res, 'Erro ao processar a solicitação de estatísticas do dashboard');
    }
  }
);

export default router;