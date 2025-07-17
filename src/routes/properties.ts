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

    logger.debug(`Solicitação de propriedades para empresaId: ${empresaId}${search ? `, termo de busca: ${search}` : ''}`);

    try {
      // Verificar se o Firebase está disponível e funcionando
      let useFirebase = false;
      if (db) {
        try {
          // Teste simples para verificar se o Firestore está acessível
          await db.collection('_test').limit(1).get();
          useFirebase = true;
        } catch (error) {
          logger.warn('Firebase Firestore não está acessível, usando dados mock');
          useFirebase = false;
        }
      }

      if (!useFirebase) {
        // Usar dados mock em desenvolvimento
        const mockProperties = [
          {
            id: 'imovel_001',
            empresaId,
            enderecoCompleto: 'Rua das Flores, 123 - Centro - São Paulo/SP',
            proprietario: {
              nome: 'João Silva',
              email: 'joao@email.com',
              telefone: '(11) 99999-9999'
            },
            tipo: 'Apartamento',
            quartos: 2,
            banheiros: 1,
            area: 65,
            valorAluguel: 1500,
            status: 'Ocupado',
            createdAt: '2025-01-15T10:00:00Z',
            updatedAt: '2025-01-15T10:00:00Z'
          },
          {
            id: 'imovel_002',
            empresaId,
            enderecoCompleto: 'Av. Paulista, 456 - Bela Vista - São Paulo/SP',
            proprietario: {
              nome: 'Maria Santos',
              email: 'maria@email.com',
              telefone: '(11) 88888-8888'
            },
            tipo: 'Casa',
            quartos: 3,
            banheiros: 2,
            area: 120,
            valorAluguel: 2500,
            status: 'Disponível',
            createdAt: '2025-01-16T14:00:00Z',
            updatedAt: '2025-01-16T14:00:00Z'
          }
        ];

        let propertiesData = mockProperties;

        if (search) {
          const searchTerm = (search as string).toLowerCase();
          propertiesData = propertiesData.filter((prop: any) => 
            prop.enderecoCompleto?.toLowerCase().includes(searchTerm) ||
            prop.proprietario?.nome?.toLowerCase().includes(searchTerm)
          );
        }

        const limitNum = parseInt(limit as string);
        const paginatedProperties = propertiesData.slice(0, limitNum);

        logger.info(`Retornando ${paginatedProperties.length} propriedades (dados mock)`);
        return sendSuccess(res, paginatedProperties, 200, { total: paginatedProperties.length, page: 1, limit: limitNum });
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