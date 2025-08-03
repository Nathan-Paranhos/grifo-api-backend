import { z } from 'zod';

export const updateInspectionSchema = z.object({
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