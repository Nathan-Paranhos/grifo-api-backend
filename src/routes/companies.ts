import { Router } from 'express';
import { companyController } from '../controllers';
import { authenticateToken, requireRole } from '../middlewares/auth';
import { generalLimiter, createLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../validators';
import { z } from 'zod';

const router = Router();

/**
 * @route GET /api/empresas
 * @desc Lista informações básicas sobre empresas
 * @access Private
 */
router.get('/',
  authenticateToken,
  generalLimiter,
  (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'Endpoint de empresas ativo',
        availableEndpoints: [
          'GET /api/empresas - Esta página',
          'POST /api/empresas - Criar empresa',
          'GET /api/empresas/:id - Obter empresa',
          'PUT /api/empresas/:id - Atualizar empresa',
          'DELETE /api/empresas/:id - Deletar empresa'
        ]
      },
      message: 'API de empresas funcionando'
    });
  }
);

// Schemas de validação
const createCompanySchema = z.object({
  body: z.object({
    nome: z.string().min(1, 'Nome é obrigatório'),
    cnpj: z.string().regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos'),
    email: z.string().email('Email inválido'),
    telefone: z.string().optional(),
    endereco: z.object({
      logradouro: z.string(),
      numero: z.string(),
      complemento: z.string().optional(),
      bairro: z.string(),
      cidade: z.string(),
      estado: z.string(),
      cep: z.string()
    }).optional(),
    plano: z.enum(['basico', 'profissional', 'empresarial']).default('basico'),
    proprietarioId: z.string().min(1, 'ID do proprietário é obrigatório')
  })
});

const updateCompanySchema = z.object({
  body: z.object({
    nome: z.string().min(1).optional(),
    email: z.string().email().optional(),
    telefone: z.string().optional(),
    endereco: z.object({
      logradouro: z.string(),
      numero: z.string(),
      complemento: z.string().optional(),
      bairro: z.string(),
      cidade: z.string(),
      estado: z.string(),
      cep: z.string()
    }).optional()
  })
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['ativa', 'suspensa', 'cancelada'])
  })
});

const updateConfiguracoesSchema = z.object({
  body: z.object({
    configuracoes: z.object({
      limiteUsuarios: z.number().min(1).optional(),
      limiteVistorias: z.number().min(1).optional(),
      limiteFotos: z.number().min(1).optional(),
      modulosAtivos: z.array(z.string()).optional()
    })
  })
});

const updatePlanoSchema = z.object({
  body: z.object({
    plano: z.enum(['basico', 'profissional', 'empresarial'])
  })
});

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

/**
 * GET /api/companies
 * Lista todas as empresas (apenas admin)
 */
router.get('/', 
  generalLimiter,
  requireRole(['admin']),
  companyController.listAll
);

/**
 * POST /api/companies
 * Cria uma nova empresa (apenas admin)
 */
router.post('/',
  createLimiter,
  requireRole(['admin']),
  validateRequest({ body: createCompanySchema.shape.body }),
  companyController.create
);

/**
 * GET /api/companies/:id
 * Busca uma empresa específica
 */
router.get('/:id',
  generalLimiter,
  companyController.getById
);

/**
 * PUT /api/companies/:id
 * Atualiza dados de uma empresa
 */
router.put('/:id',
  generalLimiter,
  validateRequest({ body: updateCompanySchema.shape.body }),
  companyController.update
);

/**
 * PATCH /api/companies/:id/status
 * Atualiza status de uma empresa (apenas admin)
 */
router.patch('/:id/status',
  generalLimiter,
  requireRole(['admin']),
  validateRequest({ body: updateStatusSchema.shape.body }),
  companyController.updateStatus
);

/**
 * PATCH /api/companies/:id/configuracoes
 * Atualiza configurações de uma empresa (apenas admin)
 */
router.patch('/:id/configuracoes',
  generalLimiter,
  requireRole(['admin']),
  validateRequest({ body: updateConfiguracoesSchema.shape.body }),
  companyController.updateConfiguracoes
);

/**
 * PATCH /api/companies/:id/plano
 * Atualiza plano de uma empresa (apenas admin)
 */
router.patch('/:id/plano',
  generalLimiter,
  requireRole(['admin']),
  validateRequest({ body: updatePlanoSchema.shape.body }),
  companyController.updatePlano
);

/**
 * DELETE /api/companies/:id
 * Remove uma empresa (apenas admin)
 */
router.delete('/:id',
  generalLimiter,
  requireRole(['admin']),
  companyController.delete
);

export default router;