import { Router, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import * as admin from 'firebase-admin';
import logger from '../config/logger';
import { validateRequest } from '../validators';
import { requireEmpresa, Request } from '../config/security';
import { db } from '../config/firebase';
import { z } from 'zod';
import { Notification, PaginatedResponse } from '../types';



const router = Router();

// Schema de validação para query de notificações
const notificationsQuerySchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
  read: z.string().optional().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
  type: z.enum(['inspection', 'contestation', 'system', 'reminder']).optional()
});

// Schema de validação para marcar como lida
const markAsReadSchema = z.object({
  id: z.string().min(1, 'ID da notificação é obrigatório')
});

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Listar notificações do usuário
 *     description: Retorna uma lista paginada de notificações do usuário autenticado
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de itens por página
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filtrar por status de leitura
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [inspection, contestation, system, reminder]
 *         description: Filtrar por tipo de notificação
 *     responses:
 *       200:
 *         description: Lista de notificações retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 message:
 *                   type: string
 *                   example: "Notificações recuperadas com sucesso"
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Token de autenticação inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/',
  requireEmpresa,
  validateRequest({ query: notificationsQuerySchema }),
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, read, type } = req.query as { page?: number; limit?: number; read?: boolean; type?: 'inspection' | 'contestation' | 'system' | 'reminder' };
    const userId = req.user?.id;
    const empresaId = req.user?.empresaId;

    if (!userId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    logger.info(`Buscando notificações para usuário ${userId}`, { page, limit, read, type });

    try {
      // Construir query base
      let query: admin.firestore.Query = db!.collection('notifications')
        .where('userId', '==', userId)
        .where('empresaId', '==', empresaId);

      // Aplicar filtros
      if (read !== undefined) {
        query = query.where('read', '==', read);
      }

      if (type) {
        query = query.where('type', '==', type);
      }

      // Ordenar por data de criação (mais recentes primeiro)
      query = query.orderBy('createdAt', 'desc');

      // Aplicar paginação
      const offset = (page - 1) * limit;
      query = query.offset(offset).limit(limit);

      const snapshot = await query.get();
      const notifications: Notification[] = [];

      snapshot.forEach(doc => {
        notifications.push({
          id: doc.id,
          ...doc.data()
        } as Notification);
      });

      // Contar total de notificações para paginação
      let countQuery: admin.firestore.Query = db!.collection('notifications')
        .where('userId', '==', userId)
        .where('empresaId', '==', empresaId);

      if (read !== undefined) {
        countQuery = countQuery.where('read', '==', read);
      }

      if (type) {
        countQuery = countQuery.where('type', '==', type);
      }

      const countSnapshot = await countQuery.get();
      const total = countSnapshot.size;
      const totalPages = Math.ceil(total / limit);

      const paginatedResponse: PaginatedResponse<Notification> = {
        data: notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

      logger.info(`Notificações recuperadas com sucesso: ${notifications.length} itens`);
      return sendSuccess(res, paginatedResponse, 'Notificações recuperadas com sucesso', 200);

    } catch (error) {
      logger.error('Erro ao buscar notificações:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Marcar notificação como lida
 *     description: Marca uma notificação específica como lida
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da notificação
 *     responses:
 *       200:
 *         description: Notificação marcada como lida com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notificação marcada como lida"
 *       400:
 *         description: ID da notificação inválido
 *       401:
 *         description: Token de autenticação inválido
 *       404:
 *         description: Notificação não encontrada
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/:id/read',
  validateRequest({ params: markAsReadSchema }),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const empresaId = req.user?.empresaId;

    if (!userId || !empresaId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    logger.info(`Marcando notificação ${id} como lida para usuário ${userId}`);

    try {
      const notificationRef = db!.collection('notifications').doc(id);
      const notificationDoc = await notificationRef.get();

      if (!notificationDoc.exists) {
        return sendError(res, 'Notificação não encontrada', 404);
      }

      const notificationData = notificationDoc.data() as Notification;

      // Verificar se a notificação pertence ao usuário
      if (notificationData.userId !== userId || notificationData.empresaId !== empresaId) {
        return sendError(res, 'Acesso negado', 403);
      }

      // Marcar como lida
      await notificationRef.update({
        read: true,
        updatedAt: new Date().toISOString()
      });

      logger.info(`Notificação ${id} marcada como lida com sucesso`);
      return sendSuccess(res, null, 'Notificação marcada como lida', 200);

    } catch (error) {
      logger.error('Erro ao marcar notificação como lida:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

/**
 * @swagger
 * /api/v1/notifications/mark-all-read:
 *   put:
 *     summary: Marcar todas as notificações como lidas
 *     description: Marca todas as notificações não lidas do usuário como lidas
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas as notificações marcadas como lidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Todas as notificações foram marcadas como lidas"
 *                 data:
 *                   type: object
 *                   properties:
 *                     updatedCount:
 *                       type: number
 *                       example: 5
 *       401:
 *         description: Token de autenticação inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.put('/mark-all-read',
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const empresaId = req.user?.empresaId;

    if (!userId || !empresaId) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    logger.info(`Marcando todas as notificações como lidas para usuário ${userId}`);

    try {
      const query = db!.collection('notifications')
        .where('userId', '==', userId)
        .where('empresaId', '==', empresaId)
        .where('read', '==', false);

      const snapshot = await query.get();
      const batch = db!.batch();
      let updatedCount = 0;

      snapshot.forEach(doc => {
        batch.update(doc.ref, {
          read: true,
          updatedAt: new Date().toISOString()
        });
        updatedCount++;
      });

      await batch.commit();

      logger.info(`${updatedCount} notificações marcadas como lidas`);
      return sendSuccess(res, { updatedCount }, 'Todas as notificações foram marcadas como lidas', 200);

    } catch (error) {
      logger.error('Erro ao marcar todas as notificações como lidas:', error);
      return sendError(res, 'Erro interno do servidor', 500);
    }
  }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: ID único da notificação
 *         userId:
 *           type: string
 *           description: ID do usuário destinatário
 *         empresaId:
 *           type: string
 *           description: ID da empresa
 *         title:
 *           type: string
 *           description: Título da notificação
 *         message:
 *           type: string
 *           description: Mensagem da notificação
 *         type:
 *           type: string
 *           enum: [inspection, contestation, system, reminder]
 *           description: Tipo da notificação
 *         read:
 *           type: boolean
 *           description: Status de leitura
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Data de criação
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Data de atualização
 *         metadata:
 *           type: object
 *           description: Dados adicionais da notificação
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           description: Página atual
 *         limit:
 *           type: integer
 *           description: Itens por página
 *         total:
 *           type: integer
 *           description: Total de itens
 *         totalPages:
 *           type: integer
 *           description: Total de páginas
 *         hasNext:
 *           type: boolean
 *           description: Tem próxima página
 *         hasPrev:
 *           type: boolean
 *           description: Tem página anterior
 */

export default router;