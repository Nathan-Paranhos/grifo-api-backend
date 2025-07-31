import { Router, Response } from 'express';
import { Request } from '../config/security';
import { authMiddleware } from '../config/security';
import { validateRequest, userSchema } from '../utils/validation';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../config/logger';
import { z } from 'zod';
import * as admin from 'firebase-admin';
import { getDb, setCustomClaims } from '../config/firebase';

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
    
    // Buscar usuários no Firestore
    const db = getDb();
    let query: admin.firestore.Query = db.collection('users').where('empresaId', '==', empresaId);
    
    // Aplicar filtros
    if (role) {
      query = query.where('role', '==', role);
    }
    
    if (ativo !== undefined) {
      const isActive = ativo === 'true';
      query = query.where('ativo', '==', isActive);
    }
    
    // Aplicar limite
    if (limit) {
      const limitNum = parseInt(limit as string);
      query = query.limit(limitNum);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      logger.info('Nenhum usuário encontrado');
      return sendSuccess(res, []);
    }
    
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    logger.info(`Encontrados ${users.length} usuários`);
    sendSuccess(res, users);
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
    
    // Buscar usuário no Firestore
    const db = getDb();
    const userDoc = await db.collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      logger.warn(`Usuário ${id} não encontrado`);
      return sendError(res, 'Usuário não encontrado', 404);
    }
    
    const userData = userDoc.data();
    
    // Verificar se o usuário pertence à empresa
    if (userData?.empresaId !== empresaId) {
      logger.warn(`Usuário ${id} não pertence à empresa ${empresaId}`);
      return sendError(res, 'Acesso negado', 403);
    }
    
    const user = {
      id: userDoc.id,
      ...userData
    };
    
    sendSuccess(res, user);
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
    const currentUser = (req as any).user;
    
    // Verificar se o usuário atual tem permissão para criar usuários
    if (currentUser.role !== 'admin') {
      return sendError(res, 'Acesso negado: apenas administradores podem criar usuários', 403);
    }
    
    logger.info('Criando novo usuário', { userData, empresaId });
    
    // Verificar se já existe um usuário com o mesmo email
    const db = getDb();
    const existingUserQuery = await db.collection('users')
      .where('email', '==', userData.email)
      .where('empresaId', '==', empresaId)
      .get();
    
    if (!existingUserQuery.empty) {
      return sendError(res, 'Já existe um usuário com este email', 400);
    }
    
    // Criar usuário no Firestore
    const newUserData = {
      empresaId,
      ...userData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('users').add(newUserData);
    
    const newUser = {
      id: docRef.id,
      ...newUserData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    logger.info(`Usuário criado com sucesso: ${docRef.id}`);
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
    const currentUser = (req as any).user;
    
    logger.info(`Atualizando usuário ${id}`, { updateData, empresaId });
    
    // Verificar se o usuário existe e pertence à empresa
    const db = getDb();
    const userDoc = await db.collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      logger.warn(`Usuário ${id} não encontrado`);
      return sendError(res, 'Usuário não encontrado', 404);
    }
    
    const userData = userDoc.data();
    
    if (userData?.empresaId !== empresaId) {
      logger.warn(`Usuário ${id} não pertence à empresa ${empresaId}`);
      return sendError(res, 'Acesso negado', 403);
    }
    
    // Verificar permissões: admin pode atualizar qualquer usuário, outros só podem atualizar a si mesmos
    if (currentUser.role !== 'admin' && currentUser.id !== id) {
      return sendError(res, 'Acesso negado: você só pode atualizar seu próprio perfil', 403);
    }
    
    // Se está alterando o email, verificar se já existe outro usuário com o mesmo email
    if (updateData.email && updateData.email !== userData?.email) {
      const existingUserQuery = await getDb().collection('users')
        .where('email', '==', updateData.email)
        .where('empresaId', '==', empresaId)
        .get();
      
      if (!existingUserQuery.empty) {
        return sendError(res, 'Já existe um usuário com este email', 400);
      }
    }
    
    // Atualizar usuário no Firestore
    const updatePayload = {
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await getDb().collection('users').doc(id).update(updatePayload);
    
    // Buscar usuário atualizado
    const updatedUserDoc = await getDb().collection('users').doc(id).get();
    const updatedUser = {
      id: updatedUserDoc.id,
      ...updatedUserDoc.data()
    };
    
    logger.info(`Usuário ${id} atualizado com sucesso`);
    sendSuccess(res, updatedUser);
  } catch (error) {
    logger.error('Erro ao atualizar usuário:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
});

// Schema para validação de set claims
const setClaimsSchema = z.object({
  uid: z.string().min(1, 'UID é obrigatório'),
  empresaId: z.string().min(1, 'EmpresaId é obrigatório'),
  role: z.enum(['admin', 'user'], { required_error: 'Role deve ser admin ou user' })
});

/**
 * @openapi
 * /users/set-claims:
 *   post:
 *     summary: Define custom claims para um usuário
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
 *             required:
 *               - uid
 *               - empresaId
 *               - role
 *             properties:
 *               uid:
 *                 type: string
 *                 description: UID do usuário no Firebase
 *               empresaId:
 *                 type: string
 *                 description: ID da empresa
 *               role:
 *                 type: string
 *                 enum: [admin, user]
 *                 description: Role do usuário
 *     responses:
 *       200:
 *         description: Claims setados com sucesso
 *       403:
 *         description: Acesso negado - apenas admins
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/set-claims', authMiddleware, validateRequest({ body: setClaimsSchema }), async (req: Request, res: Response) => {
  try {
    const { uid, empresaId, role } = req.body;
    const user = req.user;

    // Verificar se o usuário é admin
    if (!user || user.role !== 'admin') {
      logger.warn('Tentativa de acesso negado ao endpoint set-claims:', {
        userId: user?.id,
        userRole: user?.role,
        targetUid: uid
      });
      return sendError(res, 'Acesso negado. Apenas administradores podem setar claims.', 403);
    }

    // Verificar se o admin tem acesso à empresa
    if (user.empresaId !== empresaId) {
      logger.warn('Admin tentando setar claims para empresa diferente:', {
        adminId: user.id,
        adminEmpresaId: user.empresaId,
        targetEmpresaId: empresaId
      });
      return sendError(res, 'Acesso negado. Você só pode setar claims para sua própria empresa.', 403);
    }

    // Setar os custom claims
    const result = await setCustomClaims(uid, empresaId, role);

    logger.info('Custom claims setados com sucesso:', {
      adminId: user.id,
      targetUid: uid,
      empresaId,
      role
    });

    return sendSuccess(res, result, 200);
  } catch (error: any) {
    logger.error('Erro ao setar custom claims:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    return sendError(res, 'Erro interno do servidor ao setar claims', 500);
  }
});

export default router;