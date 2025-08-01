import { Router, Request as ExpressRequest, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import * as admin from 'firebase-admin';
import { db } from '../config/firebase';

// Extend the Express Request interface to include user property
interface Request extends ExpressRequest {
  user?: { 
    id: string; 
    role: string; 
    empresaId: string; 
  };
}
import logger from '../config/logger';
import { validateRequest, commonQuerySchema, propertySchema } from '../utils/validation';
import { authMiddleware } from '../config/security';

const router = Router();

/**
 * @route GET /api/properties
 * @desc Obtém lista de propriedades com filtros
 * @access Private
 */
router.get('/', 
  authMiddleware,
  validateRequest({ query: commonQuerySchema }),
  async (req: Request, res: Response) => {
    const { search, limit = '10' } = req.query;
    const empresaId = req.user?.empresaId;

    if (!empresaId) {
      return sendError(res, 'Acesso negado: empresa não identificada.', 403);
    }

    logger.info(`Solicitação de propriedades para empresaId: ${empresaId}${search ? `, termo de busca: ${search}` : ''}`);

    try {
      // Verificar se o Firebase está disponível e funcionando
      let useFirebase = false;
      if (db) {
        try {
          // Verificar se o Firestore está acessível
    await db.collection('empresas').limit(1).get();
          useFirebase = true;
        } catch (error) {
          logger.warn('Firebase Firestore não está acessível, usando dados mock');
          useFirebase = false;
        }
      }

      if (!useFirebase) {
        logger.error('Firebase Firestore não está disponível');
        return sendError(res, 'Serviço temporariamente indisponível', 503);
      }

      const propertiesRef = db!.collection('imoveis');
      let query: admin.firestore.Query = propertiesRef.where('empresaId', '==', empresaId);

      const snapshot = await query.limit(parseInt(limit as string)).get();

      if (snapshot.empty) {
        return sendSuccess(res, [], 200, { total: 0, page: 1, limit: parseInt(limit as string) });
      }

      let propertiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (search) {
        const searchTerm = (search as string).toLowerCase();
        propertiesData = propertiesData.filter((prop: any) => 
          prop.enderecoCompleto?.toLowerCase().includes(searchTerm) ||
          prop.proprietario?.nome?.toLowerCase().includes(searchTerm)
        );
      }

      logger.info(`Retornando ${propertiesData.length} propriedades`);
      return sendSuccess(res, propertiesData, 200, { total: propertiesData.length, page: 1, limit: parseInt(limit as string) });
    } catch (error) {
      logger.error(`Erro ao buscar propriedades: ${error}`);
      return sendError(res, 'Erro ao processar a solicitação de propriedades');
    }
  }
);

/**
 * @route GET /api/properties/:id
 * @desc Obtém detalhes de uma propriedade específica
 * @access Private
 */
router.get('/:id', 
  authMiddleware,
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const empresaId = req.user?.empresaId;

    if (!empresaId) {
      return sendError(res, 'Acesso negado: empresa não identificada.', 403);
    }

    try {
      const doc = await db!.collection('imoveis').doc(id).get();

      if (!doc.exists || doc.data()?.empresaId !== empresaId) {
        return sendError(res, 'Propriedade não encontrada', 404);
      }

      return sendSuccess(res, { id: doc.id, ...doc.data() });
    } catch (error) {
      logger.error(`Erro ao buscar propriedade ${id}: ${error}`);
      return sendError(res, 'Erro ao buscar a propriedade');
    }
  }
);

/**
 * @route POST /api/properties
 * @desc Cadastra uma nova propriedade
 * @access Private
 */
router.post('/', 
  authMiddleware, 
  validateRequest({ body: propertySchema }), 
  async (req: Request, res: Response) => {
    const newPropertyData = req.body;
    const empresaId = req.user?.empresaId;

    if (!empresaId) {
      return sendError(res, 'Acesso negado: empresa não identificada.', 403);
    }

    try {
      const propertyWithOwner = {
        ...newPropertyData,
        empresaId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await db!.collection('imoveis').add(propertyWithOwner);
      
      logger.info(`Nova propriedade cadastrada com id: ${docRef.id} para empresa: ${empresaId}`);
      sendSuccess(res, { id: docRef.id, ...propertyWithOwner }, 201, { message: 'Propriedade cadastrada com sucesso.' });
    } catch (error) {
      logger.error(`Erro ao cadastrar nova propriedade: ${error}`);
      return sendError(res, 'Erro ao cadastrar a propriedade.');
    }
  }
);

/**
 * @route PUT /api/properties/:id
 * @desc Atualiza uma propriedade existente
 * @access Private
 */
router.put('/:id', 
  authMiddleware, 
  validateRequest({ body: propertySchema.partial() }), 
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;
    const empresaId = req.user?.empresaId;

    if (!empresaId) {
      return sendError(res, 'Acesso negado: empresa não identificada.', 403);
    }

    try {
      // Verifica se a propriedade existe e pertence à empresa
      const doc = await db!.collection('imoveis').doc(id).get();

      if (!doc.exists || doc.data()?.empresaId !== empresaId) {
        return sendError(res, 'Propriedade não encontrada', 404);
      }

      const updatedData = {
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db!.collection('imoveis').doc(id).update(updatedData);
      
      logger.info(`Propriedade ${id} atualizada para empresa: ${empresaId}`);
      sendSuccess(res, null, 200, { message: 'Propriedade atualizada com sucesso.' });
    } catch (error) {
      logger.error(`Erro ao atualizar propriedade ${id}: ${error}`);
      return sendError(res, 'Erro ao atualizar a propriedade.');
    }
  }
);

export default router;