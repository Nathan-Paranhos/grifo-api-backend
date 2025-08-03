import { Router } from 'express';
import { inspectionController } from '../controllers';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../validators';
import {
  createInspectionSchema,
  updateInspectionSchema,
  addPhotoSchema,
  addContestationSchema,
  updateStatusSchema
} from '../validators/inspections';

const router = Router();

router.use(authenticateToken);

router.get('/', generalLimiter, inspectionController.list);

router.post('/',
  createLimiter,
  requireRole(['admin', 'gerente']),
  validateRequest({ body: createInspectionSchema.shape.body }),
  inspectionController.create
);

router.get('/stats',
  generalLimiter,
  requireRole(['admin', 'gerente']),
  inspectionController.getStats
);

router.get('/vistoriador/:vistoriadorId', generalLimiter, inspectionController.getByVistoriador);

router.get('/imovel/:imovelId', generalLimiter, inspectionController.getByImovel);

router.get('/:id', generalLimiter, inspectionController.getById);

router.put('/:id',
  generalLimiter,
  requireRole(['admin', 'gerente', 'vistoriador']),
  validateRequest({ body: updateInspectionSchema.shape.body }),
  inspectionController.update
);

router.patch('/:id/status',
  generalLimiter,
  requireRole(['admin', 'gerente', 'vistoriador']),
  validateRequest({ body: updateStatusSchema.shape.body }),
  inspectionController.updateStatus
);



router.post('/:id/photos',
  createLimiter,
  requireRole(['admin', 'gerente', 'vistoriador']),
  validateRequest({ body: addPhotoSchema.shape.body }),
  inspectionController.addPhoto
);

router.delete('/:id/photos/:photoId', generalLimiter, inspectionController.removePhoto);

router.post('/:id/contestations',
  createLimiter,
  requireRole(['admin', 'gerente', 'cliente']),
  validateRequest({ body: addContestationSchema.shape.body }),
  inspectionController.addContestation
);



export default router;