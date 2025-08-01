import { Router, Response } from 'express';
import { authenticateToken, Request } from '../config/security';
import { validateRequest } from '../utils/validation';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { getDb } from '../config/firebase';

const router = Router();

/**
 * @openapi
 * /empresas/{empresaId}:
 *   get:
 *     summary: Retorna dados de uma empresa específica
 *     tags:
 *       - Empresas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: empresaId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da empresa
 *     responses:
 *       200:
 *         description: Dados da empresa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 *       404:
 *         description: Empresa não encontrada
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { ativo, limit } = req.query;
    const userRole = req.user?.role;
    
    // Apenas admins podem listar todas as empresas
    if (userRole !== 'admin') {
      return sendError(res, 'Acesso negado', 403);
    }
    
    logger.info('Buscando empresas', { ativo, limit });
    
    // Buscar empresas no Firestore
    const db = getDb();
    let query: admin.firestore.Query = db.collection('companies');
    
    // Aplicar filtros
    if (ativo !== undefined) {
      const isActive = ativo === 'true';
      query = query.where('ativo', '==', isActive);
    }
    
    // Aplicar limite
    if (limit) {
      const limitNum = parseInt(limit as string);
      query = query.limit(limitNum);
    }
    
    // Ordenar por data de criação
    query = query.orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      logger.info('Nenhuma empresa encontrada');
      return sendSuccess(res, []);
    }
    
    const companies = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    logger.info(`Encontradas ${companies.length} empresas`);
    sendSuccess(res, companies);
  } catch (error) {
    logger.error('Erro ao buscar empresas:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userEmpresaId = req.user?.empresaId;
    const userRole = req.user?.role;
    
    // Usuários só podem ver sua própria empresa, exceto admins
    if (userRole !== 'admin' && userEmpresaId !== id) {
      return sendError(res, 'Acesso negado', 403);
    }
    
    logger.info(`Buscando empresa ${id}`);
    
    // Buscar empresa no Firestore
    const db = getDb();
    const companyDoc = await db.collection('companies').doc(id).get();
    
    if (!companyDoc.exists) {
      logger.warn(`Empresa ${id} não encontrada`);
      return sendError(res, 'Empresa não encontrada', 404);
    }
    
    const company = {
      id: companyDoc.id,
      ...companyDoc.data()
    };
    
    sendSuccess(res, company);
  } catch (error) {
    logger.error('Erro ao buscar empresa:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
});

export default router;