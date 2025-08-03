import { z } from 'zod';

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(['agendada', 'em_andamento', 'concluida', 'cancelada'])
  })
});