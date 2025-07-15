import { Router, Request, Response } from 'express';
import { authMiddleware } from '../config/security';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';

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
router.get('/:empresaId', authMiddleware, (req: Request, res: Response) => {
  // Lógica para buscar empresa
  sendSuccess(res, { empresaId: req.params.empresaId, name: 'Imobiliária XPTO' });
});

export default router;