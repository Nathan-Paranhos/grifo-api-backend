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
import { authMiddleware, requireEmpresa } from '../config/security';
import { db } from '../config/firebase';

const router = Router();

/**
 * @route GET /api/inspections
 * @desc Obtém lista de inspeções com filtros
 * @access Private
 */
router.get('/', 
  authMiddleware,
  requireEmpresa,
  validateRequest({ query: commonQuerySchema }),
  async (req: Request, res: Response) => {
    const { vistoriadorId, status, limit = '10', dataInicio, dataFim } = req.query;
    const empresaId = req.user?.empresaId;

    logger.info(`Buscando vistorias para empresa ${empresaId}`, { status, vistoriadorId, dataInicio, dataFim, limit });

    try {
      // Buscar inspeções no Firestore
      let query: admin.firestore.Query = db!.collection('inspections')
        .where('empresaId', '==', empresaId);
      
      // Aplicar filtros
      if (status) {
        query = query.where('status', '==', status);
      }
      
      if (vistoriadorId) {
        query = query.where('vistoriadorId', '==', vistoriadorId);
      }
      
      // Filtros de data (se fornecidos)
      if (dataInicio) {
        const startDate = new Date(dataInicio as string);
        query = query.where('dataVistoria', '>=', startDate);
      }
      
      if (dataFim) {
        const endDate = new Date(dataFim as string);
        query = query.where('dataVistoria', '<=', endDate);
      }
      
      // Aplicar limite
      if (limit) {
        const limitNum = parseInt(limit as string);
        query = query.limit(limitNum);
      }
      
      // Ordenar por data de criação (mais recentes primeiro)
      query = query.orderBy('createdAt', 'desc');
      
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        logger.info('Nenhuma vistoria encontrada');
        return sendSuccess(res, [], 200, { total: 0, page: 1, limit: parseInt(limit as string) });
      }
      
      const inspections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      logger.info(`Encontradas ${inspections.length} vistorias`);
      return sendSuccess(res, inspections, 200, { total: inspections.length, page: 1, limit: parseInt(limit as string) });
    } catch (error) {
      logger.error('Erro ao buscar vistorias:', error);
      return sendError(res, 'Erro interno do servidor', 500);
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
  requireEmpresa,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const empresaId = req.user?.empresaId;

    logger.info(`Buscando vistoria ${id} para empresa ${empresaId}`);

    try {
      // Buscar inspeção no Firestore
      const inspectionDoc = await db!.collection('inspections').doc(id).get();
      
      if (!inspectionDoc.exists) {
        logger.warn(`Vistoria ${id} não encontrada`);
        return sendError(res, 'Vistoria não encontrada', 404);
      }
      
      const inspectionData = inspectionDoc.data();
      
      // Verificar se a inspeção pertence à empresa
      if (inspectionData?.empresaId !== empresaId) {
        logger.warn(`Vistoria ${id} não pertence à empresa ${empresaId}`);
        return sendError(res, 'Acesso negado', 403);
      }
      
      const inspection = {
        id: inspectionDoc.id,
        ...inspectionData
      };
      
      return sendSuccess(res, inspection);
    } catch (error) {
      logger.error('Erro ao buscar vistoria:', error);
      return sendError(res, 'Erro interno do servidor', 500);
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
  requireEmpresa,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const empresaId = req.user?.empresaId;
    const currentUser = req.user;

    try {
      // Verificar se a inspeção existe e pertence à empresa
      const inspectionDoc = await db!.collection('inspections').doc(id).get();
      
      if (!inspectionDoc.exists) {
        logger.warn(`Vistoria ${id} não encontrada`);
        return sendError(res, 'Vistoria não encontrada', 404);
      }
      
      const inspectionData = inspectionDoc.data();
      
      if (inspectionData?.empresaId !== empresaId) {
        logger.warn(`Vistoria ${id} não pertence à empresa ${empresaId}`);
        return sendError(res, 'Acesso negado', 403);
      }
      
      // Verificar permissões: vistoriador só pode atualizar suas próprias inspeções
      if (currentUser?.role === 'vistoriador' && inspectionData?.vistoriadorId !== currentUser.id) {
        return sendError(res, 'Acesso negado: você só pode atualizar suas próprias vistorias', 403);
      }
      
      // Atualizar inspeção no Firestore
      const updatePayload = {
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Se está marcando como concluída, adicionar data de conclusão
      if (updateData.status === 'concluida' && !updateData.dataConclusao) {
        updatePayload.dataConclusao = admin.firestore.FieldValue.serverTimestamp();
      }
      
      await db!.collection('inspections').doc(id).update(updatePayload);
      
      // Buscar inspeção atualizada
      const updatedInspectionDoc = await db!.collection('inspections').doc(id).get();
      const updatedInspection = {
        id: updatedInspectionDoc.id,
        ...updatedInspectionDoc.data()
      };
      
      logger.info(`Vistoria ${id} atualizada com sucesso`);
      return sendSuccess(res, updatedInspection);
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
    const currentUser = req.user;

    if (!empresaId) {
      return sendError(res, 'Acesso negado: empresa não identificada.', 403);
    }

    // Verificar se o usuário tem permissão para criar inspeções
    if (!['admin', 'gerente'].includes(currentUser?.role || '')) {
      return sendError(res, 'Acesso negado: apenas administradores e gerentes podem criar vistorias', 403);
    }

    try {
      const { vistoriadorId, imovelId, tipo, status, dataVistoria, observacoes, fotos, checklists, imovel } = req.body;

      logger.info(`Criando nova inspeção para empresaId: ${empresaId}, vistoriadorId: ${vistoriadorId}, imovelId: ${imovelId}`);

      // Gerar número sequencial da vistoria
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // Buscar o último número de vistoria do mês para gerar sequencial
      const startOfMonth = new Date(currentYear, new Date().getMonth(), 1);
      const endOfMonth = new Date(currentYear, new Date().getMonth() + 1, 0, 23, 59, 59);
      
      const lastInspectionQuery = await db!.collection('inspections')
        .where('empresaId', '==', empresaId)
        .where('createdAt', '>=', startOfMonth)
        .where('createdAt', '<=', endOfMonth)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      let sequencial = 1;
      if (!lastInspectionQuery.empty) {
        const lastInspection = lastInspectionQuery.docs[0].data();
        const lastNumero = lastInspection.numero;
        const match = lastNumero.match(/-([0-9]+)$/);
        if (match) {
          sequencial = parseInt(match[1]) + 1;
        }
      }
      
      const numero = `VIST-${currentYear}${currentMonth}-${String(sequencial).padStart(3, '0')}`;

      // Verificar se o vistoriador existe e pertence à empresa
      if (vistoriadorId) {
        const vistoriadorDoc = await db!.collection('users').doc(vistoriadorId).get();
        if (!vistoriadorDoc.exists || vistoriadorDoc.data()?.empresaId !== empresaId) {
          return sendError(res, 'Vistoriador não encontrado ou não pertence à empresa', 400);
        }
      }

      const newInspectionRef = await db!.collection('inspections').add({
        empresaId,
        numero,
        vistoriadorId,
        imovelId,
        tipo,
        status: status || 'pendente',
        dataVistoria: dataVistoria || new Date().toISOString(),
        observacoes,
        fotos,
        checklists,
        imovel,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: currentUser?.id
      });

      const newInspection = {
        id: newInspectionRef.id,
        empresaId,
        numero,
        vistoriadorId,
        imovelId,
        tipo,
        status: status || 'pendente',
        dataVistoria: dataVistoria || new Date().toISOString(),
        observacoes,
        fotos,
        checklists,
        imovel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.id
      };

      logger.info(`Nova inspeção criada com ID: ${newInspectionRef.id}`);

      return sendSuccess(res, newInspection, 201, { message: 'Inspeção criada com sucesso' });
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
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { motivo, detalhes, itensContestados } = req.body;
      const empresaId = req.user?.empresaId;
      const currentUser = req.user;

      if (!empresaId) {
        return sendError(res, 'Acesso negado: empresa não identificada.', 403);
      }

      logger.info(`Registrando contestação para vistoria ${id} da empresa ${empresaId}`);

      // Verificar se a inspeção existe e pertence à empresa
      const inspectionDoc = await db!.collection('inspections').doc(id).get();
      
      if (!inspectionDoc.exists) {
        logger.warn(`Vistoria ${id} não encontrada`);
        return sendError(res, 'Vistoria não encontrada', 404);
      }
      
      const inspectionData = inspectionDoc.data();
      
      if (inspectionData?.empresaId !== empresaId) {
        logger.warn(`Vistoria ${id} não pertence à empresa ${empresaId}`);
        return sendError(res, 'Acesso negado', 403);
      }
      
      // Verificar se a inspeção está concluída (só pode contestar inspeções concluídas)
      if (inspectionData?.status !== 'concluida') {
        return sendError(res, 'Só é possível contestar vistorias concluídas', 400);
      }
      
      // Verificar se já existe uma contestação para esta inspeção
      const existingContestationQuery = await db!.collection('contestations')
        .where('inspectionId', '==', id)
        .where('status', 'in', ['pendente', 'em_analise'])
        .get();
      
      if (!existingContestationQuery.empty) {
        return sendError(res, 'Já existe uma contestação pendente para esta vistoria', 400);
      }
      
      // Validar dados obrigatórios
      if (!motivo || motivo.trim().length < 10) {
        return sendError(res, 'O motivo da contestação deve ter pelo menos 10 caracteres', 400);
      }
      
      // Criar contestação no Firestore
      const contestationData = {
        inspectionId: id,
        empresaId,
        motivo: motivo.trim(),
        detalhes: detalhes || '',
        itensContestados: itensContestados || [],
        status: 'pendente',
        dataContestacao: admin.firestore.FieldValue.serverTimestamp(),
        contestadoPor: currentUser?.id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      const docRef = await db!.collection('contestations').add(contestationData);
      
      // Atualizar status da inspeção para "contestada"
      await db!.collection('inspections').doc(id).update({
        status: 'contestada',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const contestation = {
        id: docRef.id,
        inspectionId: id,
        empresaId,
        motivo: motivo.trim(),
        detalhes: detalhes || '',
        itensContestados: itensContestados || [],
        status: 'pendente',
        dataContestacao: new Date().toISOString(),
        contestadoPor: currentUser?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      logger.info(`Contestação ${docRef.id} registrada com sucesso para vistoria ${id}`);
      return sendSuccess(res, contestation, 201, { message: 'Contestação registrada com sucesso' });
    } catch (error) {
      logger.error(`Erro ao registrar contestação: ${error}`);
      return sendError(res, 'Erro ao processar a contestação da vistoria', 500);
    }
  }
);

export default router;