import { Router } from 'express';
import { contestationController } from '../controllers/ContestationController';
import { requireEmpresa } from '../middlewares/auth';
import { validateRequest } from '../validators';
import { createContestationSchema } from '../validators/createContestation.schema';
import { updateStatusSchema } from '../validators/contestations/updateStatus.schema';

const router = Router();

router.post('/',
  requireEmpresa,
  validateRequest({ body: createContestationSchema.shape.body }),
  contestationController.create
);

router.get('/',
  requireEmpresa,
  contestationController.list
);

router.get('/stats',
    requireEmpresa,
    contestationController.getStats
);

router.get('/:id',
    requireEmpresa,
    contestationController.getById
);

router.put('/:id/status',
    requireEmpresa,
    validateRequest({ body: updateStatusSchema.shape.body }),
    contestationController.updateStatus
);

export default router;