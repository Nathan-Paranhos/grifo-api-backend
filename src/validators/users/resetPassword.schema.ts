import { z } from 'zod';

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido')
  })
});