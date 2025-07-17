import { Router, Request, Response } from 'express';
import { authMiddleware } from '../config/security';
import { validateRequest, userSchema } from '../utils/validation';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';
import { z } from 'zod';

const router = Router();

// Schema para validação de usuário
const createUserSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  role: z.enum(['admin', 'vistoriador', 'usuario']),
  ativo: z.boolean().optional().default(true)
});

const updateUserSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'vistoriador', 'usuario']).optional(),
  ativo: z.boolean().optional()
});

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Lista usuários da empresa
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, vistoriador, usuario]
 *         description: Filtrar por role
 *       - in: query
 *         name: ativo
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limite de resultados
 *     responses:
 *       200:
 *         description: Lista de usuários
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { role, ativo, limit } = req.query;
    const empresaId = (req as any).user.empresaId;
    
    logger.info(`Buscando usuários para empresa ${empresaId}`, { role, ativo, limit });
    
    // Simula busca no banco de dados
    const mockUsers = [
      {
        id: '1',
        empresaId,
        nome: 'Nathan Silva',
        email: 'nathan@empresa.com',
        role: 'admin',
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        empresaId,
        nome: 'João Vistoriador',
        email: 'joao@empresa.com',
        role: 'vistoriador',
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        empresaId,
        nome: 'Maria Vistoriadora',
        email: 'maria@empresa.com',
        role: 'vistoriador',
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    let filteredUsers = mockUsers;
    
    // Aplica filtros
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    if (ativo !== undefined) {
      const isActive = ativo === 'true';
      filteredUsers = filteredUsers.filter(user => user.ativo === isActive);
    }
    
    // Aplica limite
    if (limit) {
      const limitNum = parseInt(limit as string);
      filteredUsers = filteredUsers.slice(0, limitNum);
    }
    
    sendSuccess(res, filteredUsers);
  } catch (error) {
    logger.error('Erro ao buscar usuários:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
});

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Retorna dados de um usuário específico
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Dados do usuário
 *       404:
 *         description: Usuário não encontrado
 */
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const empresaId = (req as any).user.empresaId;
    
    logger.info(`Buscando usuário ${id} para empresa ${empresaId}`);
    
    // Simula busca no banco de dados
    const mockUser = {
      id,
      empresaId,
      nome: 'Nathan Silva',
      email: 'nathan@empresa.com',
      role: 'admin',
      ativo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    sendSuccess(res, mockUser);
  } catch (error) {
    logger.error('Erro ao buscar usuário:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
});

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Cria um novo usuário
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, vistoriador, usuario]
 *               ativo:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 */
router.post('/', authMiddleware, validateRequest({ body: createUserSchema }), async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const empresaId = (req as any).user.empresaId;
    
    logger.info('Criando novo usuário', { userData, empresaId });
    
    // Simula criação no banco de dados
    const newUser = {
      id: Date.now().toString(),
      empresaId,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    sendSuccess(res, newUser, 201);
  } catch (error) {
    logger.error('Erro ao criar usuário:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
});

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Atualiza um usuário existente
 *     tags:
 *       - Usuários
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, vistoriador, usuario]
 *               ativo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 */
router.put('/:id', authMiddleware, validateRequest({ body: updateUserSchema }), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const empresaId = (req as any).user.empresaId;
    
    logger.info(`Atualizando usuário ${id}`, { updateData, empresaId });
    
    // Simula atualização no banco de dados
    // Aqui você faria a validação se o usuário pertence à empresa
    
    sendSuccess(res, null, 200);
  } catch (error) {
    logger.error('Erro ao atualizar usuário:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
});

export default router;