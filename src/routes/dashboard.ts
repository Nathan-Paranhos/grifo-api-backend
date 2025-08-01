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
import { authMiddleware, requireEmpresa } from '../config/security';

const router = Router();

/**
 * @route GET /api/dashboard
 * @desc Obtém informações gerais do dashboard
 * @access Private
 */
const getDashboardStats = async (empresaId: string, vistoriadorId?: string) => {
  if (!db) {
    throw new Error('Serviço de banco de dados indisponível');
  }

  const inspectionsQuery = db.collection('vistorias').where('empresaId', '==', empresaId);
  const inspectionsSnapshot = await inspectionsQuery.get();
  const inspections = inspectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Filtra por vistoriadorId se fornecido
  let filteredInspections = inspections;
  if (vistoriadorId) {
    filteredInspections = inspections.filter((i: any) => i.vistoriadorId === vistoriadorId);
  }

  const total = filteredInspections.length;
  const pendentes = filteredInspections.filter((i: any) => i.status === 'Pendente').length;
  const concluidas = filteredInspections.filter((i: any) => i.status === 'Concluída').length;
  const emAndamento = filteredInspections.filter((i: any) => i.status === 'Em Andamento').length;

  logger.info(`Retornando estatísticas do dashboard: ${total} inspeções`);

  return {
    overview: {
      total,
      pendentes,
      concluidas,
      emAndamento
    }
  };
};

router.get('/', authMiddleware, requireEmpresa, async (req: Request, res: Response) => {
  const { empresaId, vistoriadorId } = req.query;
  
  logger.info(`Solicitação de informações gerais do dashboard para empresaId: ${req.user?.empresaId}${vistoriadorId ? `, vistoriadorId: ${vistoriadorId}` : ''}`);
  
  try {
    const empresaId = req.user?.empresaId;
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
  requireEmpresa,
  validateRequest({ query: commonQuerySchema }),
  async (req: Request, res: Response) => {
    const { empresaId, vistoriadorId } = req.query;
    
    logger.info(`Solicitação de estatísticas do dashboard para empresaId: ${req.user?.empresaId}${vistoriadorId ? `, vistoriadorId: ${vistoriadorId}` : ''}`);
    
    try {
      const empresaId = req.user?.empresaId;
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