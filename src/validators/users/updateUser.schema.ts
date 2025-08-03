import { z } from 'zod';

export const updateUserSchema = z.object({
  body: z.object({
    nome: z.string().min(1).optional(),
    email: z.string().email().optional(),
    telefone: z.string().optional(),
    papel: z.enum(['admin', 'gerente', 'vistoriador', 'proprietario']).optional()
  })
});