import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    nome: z.string().min(1).optional(),
    telefone: z.string().optional()
  })
});