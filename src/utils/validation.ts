import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// Esquema para validação de parâmetros de consulta comuns
export const commonQuerySchema = z.object({
  empresaId: z.string().min(1, { message: 'empresaId é obrigatório' }),
  vistoriadorId: z.string().optional(),
  limit: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 10),
  page: z.string().optional().transform((val: string | undefined) => val ? parseInt(val) : 1),
});

// Esquema para validação de inspeções
export const inspectionSchema = z.object({
  empresaId: z.string().min(1, { message: 'empresaId é obrigatório' }),
  vistoriadorId: z.string().min(1, { message: 'vistoriadorId é obrigatório' }),
  imovelId: z.string().min(1, { message: 'imovelId é obrigatório' }),
  tipo: z.string().min(1, { message: 'tipo é obrigatório' }),
  status: z.string().optional(),
  dataVistoria: z.string().optional(),
  observacoes: z.string().optional(),
  fotos: z.array(
    z.object({
      url: z.string(),
      descricao: z.string().optional(),
      categoria: z.string().optional(),
    })
  ).optional(),
  checklists: z.array(
    z.object({
      categoria: z.string(),
      itens: z.array(
        z.object({
          item: z.string(),
          status: z.string(),
          observacao: z.string().optional(),
        })
      ),
    })
  ).optional(),
  imovel: z.object({
    endereco: z.string(),
    bairro: z.string(),
    cidade: z.string(),
    estado: z.string(),
    cep: z.string(),
    tipo: z.string(),
    areaTotal: z.number().optional(),
    areaConstruida: z.number().optional(),
    proprietario: z.object({
      nome: z.string(),
      telefone: z.string().optional(),
      email: z.string().email().optional(),
    }).optional(),
    inquilino: z.object({
      nome: z.string(),
      telefone: z.string().optional(),
      email: z.string().email().optional(),
    }).optional(),
  }).optional(),
});

// Esquema para validação de sincronização
export const syncSchema = z.object({
  pendingInspections: z.array(
    z.object({
      id: z.string(),
      empresaId: z.string(),
      imovelId: z.string(),
      tipo: z.enum(['entrada', 'saida', 'manutencao']),
      fotos: z.array(z.string()).optional(),
      checklist: z.record(z.string()).optional(),
      observacoes: z.string().optional(),
      createdAt: z.string(),
      status: z.enum(['pending', 'synced', 'error'])
    })
  ),
  vistoriadorId: z.string().min(1, { message: 'vistoriadorId é obrigatório' }),
  empresaId: z.string().min(1, { message: 'empresaId é obrigatório' })
});

// Esquema para verificação de status de sincronização
export const syncStatusSchema = z.object({
  empresaId: z.string().min(1, { message: 'ID da empresa é obrigatório' }),
  vistoriadorId: z.string().optional()
});

// Esquema para validação de contestações
export const contestationSchema = z.object({
  empresaId: z.string().min(1, { message: 'empresaId é obrigatório' }),
  inspectionId: z.string().min(1, { message: 'inspectionId é obrigatório' }),
  motivo: z.string().min(1, { message: 'motivo é obrigatório' }),
  detalhes: z.string().optional(),
  clienteId: z.string().optional(),
  evidencias: z.array(
    z.object({
      tipo: z.enum(['foto', 'documento']),
      url: z.string().url(),
    })
  ).optional(),
});

// Esquema para validação de usuários
export const userSchema = z.object({
  nome: z.string(),
  email: z.string().email(),
  empresaId: z.string(),
  role: z.enum(['admin', 'gerente', 'vistoriador']),
});

// Esquema para validação de imóveis
export const propertySchema = z.object({
  endereco: z.string().min(1, { message: 'Endereço é obrigatório' }),
  bairro: z.string().min(1, { message: 'Bairro é obrigatório' }),
  cidade: z.string().min(1, { message: 'Cidade é obrigatória' }),
  estado: z.string().min(1, { message: 'Estado é obrigatório' }),
  cep: z.string().min(8, { message: 'CEP deve ter pelo menos 8 caracteres' }),
  tipo: z.string().min(1, { message: 'Tipo é obrigatório' }),
  areaTotal: z.number().positive().optional(),
  areaConstruida: z.number().positive().optional(),
  descricao: z.string().optional(),
  enderecoCompleto: z.string().optional(),
  proprietario: z.object({
    nome: z.string().min(1, { message: 'Nome do proprietário é obrigatório' }),
    telefone: z.string().optional(),
    email: z.string().email().optional(),
    cpf: z.string().optional(),
    rg: z.string().optional(),
  }).optional(),
  inquilino: z.object({
    nome: z.string().optional(),
    telefone: z.string().optional(),
    email: z.string().email().optional(),
    cpf: z.string().optional(),
    rg: z.string().optional(),
  }).optional(),
  valorAluguel: z.number().positive().optional(),
  valorIptu: z.number().positive().optional(),
  observacoes: z.string().optional(),
  ativo: z.boolean().default(true),
});

// Esquema para criação de usuários
export const createUserSchema = z.object({
  nome: z.string().min(1, { message: 'Nome é obrigatório' }),
  email: z.string().email({ message: 'Email inválido' }),
  role: z.enum(['admin', 'gerente', 'vistoriador'], { message: 'Role deve ser admin, gerente ou vistoriador' }),
  telefone: z.string().optional(),
  ativo: z.boolean().default(true),
});

// Esquema para atualização de usuários
export const updateUserSchema = z.object({
  nome: z.string().min(1, { message: 'Nome é obrigatório' }).optional(),
  email: z.string().email({ message: 'Email inválido' }).optional(),
  role: z.enum(['admin', 'gerente', 'vistoriador'], { message: 'Role deve ser admin, gerente ou vistoriador' }).optional(),
  telefone: z.string().optional(),
  ativo: z.boolean().optional(),
});

// Esquema para atualização de status de contestação
export const contestationStatusSchema = z.object({
  status: z.enum(['pendente', 'em_analise', 'aprovada', 'rejeitada']),
  resposta: z.string().optional()
});

// Middleware para validar requisições
export const validateRequest = ({
  body,
  query,
  params
}: {
  body?: z.ZodType<any, any>;
  query?: z.ZodType<any, any>;
  params?: z.ZodType<any, any>;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validar corpo da requisição se schema fornecido
      if (body) {
        const validatedBody = body.parse(req.body);
        req.body = validatedBody;
      }
      
      // Validar parâmetros de consulta se schema fornecido
      if (query) {
        const validatedQuery = query.parse(req.query);
        req.query = validatedQuery;
      }
      
      // Validar parâmetros de rota se schema fornecido
      if (params) {
        const validatedParams = params.parse(req.params);
        req.params = validatedParams;
      }
      
      next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const zodError = error as z.ZodError;
        logger.warn(`Validação falhou: ${JSON.stringify(zodError.errors)}`);
        return res.status(400).json({
          success: false,
          error: 'Dados inválidos',
          details: zodError.errors.map((e: z.ZodIssue) => ({
            path: e.path.join('.'),
            message: e.message
          }))
        });
      }
      
      logger.error(`Erro de validação: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor durante validação'
      });
    }
  };
};