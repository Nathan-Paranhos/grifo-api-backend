import { Router, Request, Response } from 'express';
import { authMiddleware } from '../config/security';
import { validateRequest, userSchema } from '../utils/validation';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';

const router = Router();

/**
 * @openapi
 * /users/{uid}:
 *   get:
 *     summary: Retorna dados de um usuário específico
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID do usuário
 *     responses:
 *       200:
 *         description: Dados do usuário
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:uid', authMiddleware, (req: Request, res: Response) => {
  // Lógica para buscar usuário
  sendSuccess(res, { uid: req.params.uid, name: 'Nathan Silva', email: 'nathan@empresa.com' });
});

export default router;