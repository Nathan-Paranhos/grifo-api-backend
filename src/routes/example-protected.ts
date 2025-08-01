import express from 'express';
import { verifyFirebaseToken, AuthenticatedRequest } from '../middleware/verifyFirebaseToken';
import { requireEmpresa } from '../middleware/requireEmpresa';
import { getDb } from '../config/firebase';
import logger from '../config/logger';

const router = express.Router();
const db = getDb();

/**
 * @route GET /api/v1/inspections
 * @desc Exemplo de rota protegida usando os novos middlewares
 * @access Private (requer Firebase token com empresaId)
 */
router.get('/inspections', 
  verifyFirebaseToken, 
  requireEmpresa, 
  async (req: AuthenticatedRequest, res) => {
    const { empresaId } = req.user!;

    if (!empresaId) {
      return res.status(403).json({ error: 'Empresa não identificada' });
    }

    try {
      const snapshot = await db
        .collection('empresas')
        .doc(empresaId)
        .collection('vistorias')
        .get();

      const result = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      logger.info(`Inspeções recuperadas para empresa ${empresaId}: ${result.length} registros`);
      
      res.json({
        success: true,
        data: result,
        total: result.length
      });
    } catch (err: any) {
      logger.error('Erro ao buscar inspeções:', err);
      res.status(500).json({ 
        error: 'Erro interno ao buscar inspeções' 
      });
    }
  }
);

/**
 * @route POST /api/v1/inspections
 * @desc Criar nova inspeção
 * @access Private (requer Firebase token com empresaId)
 */
router.post('/inspections',
  verifyFirebaseToken,
  requireEmpresa,
  async (req: AuthenticatedRequest, res) => {
    const { empresaId, uid } = req.user!;
    const inspectionData = req.body;

    if (!empresaId) {
      return res.status(403).json({ error: 'Empresa não identificada' });
    }

    try {
      const newInspection = {
        ...inspectionData,
        empresaId,
        createdBy: uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await db
        .collection('empresas')
        .doc(empresaId)
        .collection('vistorias')
        .add(newInspection);

      logger.info(`Nova inspeção criada: ${docRef.id} para empresa ${empresaId}`);

      res.status(201).json({
        success: true,
        data: {
          id: docRef.id,
          ...newInspection
        }
      });
    } catch (err: any) {
      logger.error('Erro ao criar inspeção:', err);
      res.status(500).json({ 
        error: 'Erro interno ao criar inspeção' 
      });
    }
  }
);

export default router;