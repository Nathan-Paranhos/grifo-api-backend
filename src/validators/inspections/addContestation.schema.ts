import { z } from 'zod';

export const addContestationSchema = z.object({
  body: z.object({
    motivo: z.string().min(1, 'Motivo é obrigatório'),
    descricao: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres')
  })
});