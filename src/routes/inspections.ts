import { Router } from 'express';
import { inspectionController } from '../controllers';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../validators';
import { z } from 'zod';

const router = Router();

// Schemas de validação
const createInspectionSchema = z.object({
  body: z.object({
    imovelId: z.string().min(1, 'ID do imóvel é obrigatório'),
    tipo: z.enum(['entrada', 'saida', 'periodica'], {
      errorMap: () => ({ message: 'Tipo deve ser: entrada, saida ou periodica' })
    }),
    dataAgendada: z.string().datetime('Data agendada inválida'),
    observacoes: z.string().optional(),
    checklist: z.array(z.object({
      item: z.string(),
      categoria: z.string(),
      status: z.enum(['ok', 'problema', 'nao_aplicavel']),
      observacao: z.string().optional()
    })).optional(),
    vistoriadorId: z.string().optional()
  })
});

const updateInspectionSchema = z.object({
  body: z.object({
    status: z.enum(['agendada', 'em_andamento', 'concluida', 'cancelada']).optional(),
    observacoes: z.string().optional(),
    checklist: z.array(z.object({
      item: z.string(),
      categoria: z.string(),
      status: z.enum(['ok', 'problema', 'nao_aplicavel']),
      observacao: z.string().optional()
    })).optional(),
    dataRealizacao: z.string().datetime().optional()
  })
});

const addPhotoSchema = z.object({
  body: z.object({
    url: z.string().url('URL da foto inválida'),
    comentario: z.string().optional(),
    categoria: z.string().optional()
  })
});

const addContestationSchema = z.object({
  body: z.object({
    motivo: z.string().min(1, 'Motivo é obrigatório'),
    descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres')
  })
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['agendada', 'em_andamento', 'concluida', 'cancelada'])
  })
});

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

/**
 * GET /api/inspections
 * Lista todas as vistorias da empresa com filtros
 */
router.get('/', 
  generalLimiter,
  inspectionController.list
);

/**
 * POST /api/inspections
 * Cria uma nova vistoria
 */
router.post('/',
  createLimiter,
  requireRole(['admin', 'gerente']),
  validateRequest(createInspectionSchema),
  inspectionController.create
);

/**
 * GET /api/inspections/:id
 * Obtém detalhes de uma vistoria específica
 */
router.get('/:id',
  generalLimiter,
  inspectionController.getById
);

/**
 * PUT /api/inspections/:id
 * Atualiza uma vistoria
 */
router.put('/:id',
  generalLimiter,
  validateRequest(updateInspectionSchema),
  inspectionController.update
);

/**
 * PATCH /api/inspections/:id/status
 * Atualiza apenas o status de uma vistoria
 */
router.patch('/:id/status',
  generalLimiter,
  validateRequest(updateStatusSchema),
  inspectionController.updateStatus
);

/**
 * POST /api/inspections/:id/photos
 * Adiciona foto a uma vistoria
 */
router.post('/:id/photos',
  createLimiter,
  validateRequest(addPhotoSchema),
  inspectionController.addPhoto
);

/**
 * DELETE /api/inspections/:id/photos/:photoId
 * Remove foto de uma vistoria
 */
router.delete('/:id/photos/:photoId',
  generalLimiter,
  inspectionController.removePhoto
);

/**
 * POST /api/inspections/:id/contestations
 * Registra uma contestação para uma vistoria
 */
router.post('/:id/contestations',
  createLimiter,
  requireRole(['admin', 'gerente', 'proprietario']),
  validateRequest(addContestationSchema),
  inspectionController.addContestation
);

/**
 * GET /api/inspections/:id/contestations
 * Lista contestações de uma vistoria
 */
router.get('/:id/contestations',
  generalLimiter,
  inspectionController.getContestations
);

/**
  * DELETE /api/inspections/:id
  * Remove uma vistoria (soft delete)
  */
 router.delete('/:id',
   generalLimiter,
   requireRole(['admin', 'gerente']),
   inspectionController.remove
 );

 /**
  * GET /api/inspections/vistoriador/:vistoriadorId
  * Lista vistorias de um vistoriador específico
  */
 router.get('/vistoriador/:vistoriadorId',
   generalLimiter,
   inspectionController.getByVistoriador
 );

 /**
  * GET /api/inspections/imovel/:imovelId
  * Lista vistorias de um imóvel específico
  */
 router.get('/imovel/:imovelId',
   generalLimiter,
   inspectionController.getByImovel
 );

 /**
  * GET /api/inspections/stats
  * Obtém estatísticas de vistorias da empresa
  */
 router.get('/stats',
   generalLimiter,
   requireRole(['admin', 'gerente']),
   inspectionController.getStats
 );

 export default router;