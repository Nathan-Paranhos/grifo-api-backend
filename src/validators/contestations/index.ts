import { z } from 'zod';

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

// Esquema para atualização de status de contestação
export const contestationStatusSchema = z.object({
  status: z.enum(['pendente', 'em_analise', 'aprovada', 'rejeitada']),
  resposta: z.string().optional()
});