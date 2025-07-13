import { Router, Request, Response } from 'express';
import { authMiddleware } from '../config/security';
import { validateRequest, contestationSchema, contestationStatusSchema } from '../utils/validation';
import { z } from 'zod';
import logger from '../config/logger';

const router = Router();

/**
 * @route POST /api/contestations
 * @desc Registra uma nova contestação para uma vistoria
 * @access Private
 */
router.post('/', 
  authMiddleware,
  validateRequest({ body: contestationSchema }),
  (req: Request, res: Response) => {
    try {
      const { empresaId, motivo, detalhes, itensContestados } = req.body;
      const { inspectionId } = req.query as { inspectionId?: string };

      if (!inspectionId) {
        logger.warn('Tentativa de criar contestação sem fornecer inspectionId');
        return res.status(400).json({
          success: false,
          error: 'inspectionId é obrigatório'
        });
      }

      logger.debug(`Registrando contestação para vistoria ${inspectionId} da empresa ${empresaId}`);

      // Simular verificação se a vistoria existe
      // Em produção: const inspection = await db.collection('inspections').doc(inspectionId).get();
      
      // Criar objeto de contestação
      const contestation = {
        id: `contest_${Date.now()}`,
        inspectionId,
        empresaId,
        motivo,
        detalhes,
        itensContestados,
        status: 'Pendente',
        dataContestacao: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Em produção: await db.collection('contestations').doc(contestation.id).set(contestation);
      // Em produção: await db.collection('inspections').doc(inspectionId).update({ hasContestation: true });

      logger.info(`Contestação ${contestation.id} registrada com sucesso para vistoria ${inspectionId}`);
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

/**
 * @route GET /api/contestations
 * @desc Lista todas as contestações para uma empresa
 * @access Private
 */
router.get('/',
  authMiddleware,
  (req: Request, res: Response) => {
    try {
      const { empresaId, inspectionId, status } = req.query as { 
        empresaId?: string;
        inspectionId?: string;
        status?: string;
      };

      if (!empresaId) {
        logger.warn('Tentativa de listar contestações sem fornecer empresaId');
        return res.status(400).json({
          success: false,
          error: 'empresaId é obrigatório'
        });
      }

      logger.debug(`Listando contestações para empresa ${empresaId}`);

      // Simular busca de contestações
      const contestations = [
        {
          id: 'contest_1',
          inspectionId: 'insp_1',
          empresaId,
          motivo: 'Informações incorretas',
          detalhes: 'Metragem do imóvel está incorreta',
          itensContestados: [
            {
              categoria: 'Características',
              item: 'Metragem',
              motivoContestacao: 'Valor incorreto',
              evidencia: 'https://example.com/evidence1.jpg'
            }
          ],
          status: 'Pendente',
          dataContestacao: '2023-10-15T14:30:00.000Z',
          createdAt: '2023-10-15T14:30:00.000Z',
          updatedAt: '2023-10-15T14:30:00.000Z'
        },
        {
          id: 'contest_2',
          inspectionId: 'insp_2',
          empresaId,
          motivo: 'Fotos insuficientes',
          detalhes: 'Faltam fotos do banheiro',
          itensContestados: [
            {
              categoria: 'Fotos',
              item: 'Banheiro',
              motivoContestacao: 'Ausência de fotos',
              evidencia: null
            }
          ],
          status: 'Resolvida',
          dataContestacao: '2023-10-10T09:15:00.000Z',
          createdAt: '2023-10-10T09:15:00.000Z',
          updatedAt: '2023-10-12T11:20:00.000Z'
        }
      ];

      // Filtrar por inspectionId se fornecido
      let filteredContestations = contestations;
      if (inspectionId) {
        filteredContestations = filteredContestations.filter(c => c.inspectionId === inspectionId);
      }

      // Filtrar por status se fornecido
      if (status) {
        filteredContestations = filteredContestations.filter(c => c.status === status);
      }

      logger.info(`Retornando ${filteredContestations.length} contestações`);
      return res.status(200).json({
        success: true,
        data: filteredContestations
      });
    } catch (error) {
      logger.error(`Erro ao listar contestações: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar a solicitação'
      });
    }
  }
);

/**
 * @route GET /api/contestations/:id
 * @desc Obtém detalhes de uma contestação específica
 * @access Private
 */
router.get('/:id',
  authMiddleware,
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { empresaId } = req.query as { empresaId?: string };

      if (!empresaId) {
        logger.warn('Tentativa de acessar contestação sem fornecer empresaId');
        return res.status(400).json({
          success: false,
          error: 'empresaId é obrigatório'
        });
      }

      logger.debug(`Buscando contestação ${id} para empresa ${empresaId}`);

      // Simular busca de contestação
      const contestation = {
        id,
        inspectionId: 'insp_1',
        empresaId,
        motivo: 'Informações incorretas',
        detalhes: 'Metragem do imóvel está incorreta',
        itensContestados: [
          {
            categoria: 'Características',
            item: 'Metragem',
            motivoContestacao: 'Valor incorreto',
            evidencia: 'https://example.com/evidence1.jpg'
          }
        ],
        status: 'Pendente',
        dataContestacao: '2023-10-15T14:30:00.000Z',
        createdAt: '2023-10-15T14:30:00.000Z',
        updatedAt: '2023-10-15T14:30:00.000Z',
        // Incluir histórico de atualizações
        historico: [
          {
            data: '2023-10-15T14:30:00.000Z',
            status: 'Pendente',
            comentario: 'Contestação registrada',
            usuario: 'sistema'
          }
        ]
      };

      logger.info(`Contestação ${id} encontrada`);
      return res.status(200).json({
        success: true,
        data: contestation
      });
    } catch (error) {
      logger.error(`Erro ao buscar contestação: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar a solicitação'
      });
    }
  }
);

/**
 * @route PATCH /api/contestations/:id/status
 * @desc Atualiza o status de uma contestação
 * @access Private
 */
router.patch('/:id/status',
  authMiddleware,
  validateRequest({
    body: contestationStatusSchema
  }),
  (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, comentario } = req.body;
      const { empresaId } = req.query as { empresaId?: string };

      if (!empresaId) {
        logger.warn('Tentativa de atualizar contestação sem fornecer empresaId');
        return res.status(400).json({
          success: false,
          error: 'empresaId é obrigatório'
        });
      }

      logger.debug(`Atualizando status da contestação ${id} para ${status}`);

      // Simular atualização de contestação
      // Em produção: await db.collection('contestations').doc(id).update({ 
      //   status, 
      //   updatedAt: new Date().toISOString(),
      //   historico: admin.firestore.FieldValue.arrayUnion({
      //     data: new Date().toISOString(),
      //     status,
      //     comentario,
      //     usuario: req.user.id
      //   })
      // });

      logger.info(`Status da contestação ${id} atualizado para ${status}`);
      return res.status(200).json({
        success: true,
        message: 'Status da contestação atualizado com sucesso',
        data: {
          id,
          status,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error(`Erro ao atualizar status da contestação: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Erro ao processar a solicitação'
      });
    }
  }
);

export default router;