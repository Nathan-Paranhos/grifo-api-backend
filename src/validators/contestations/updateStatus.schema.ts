import * as z from 'zod';

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pendente', 'em_analise', 'aprovada', 'rejeitada']),
    resposta: z.string().optional(),
  }),
});