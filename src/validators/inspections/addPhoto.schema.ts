import { z } from 'zod';

export const addPhotoSchema = z.object({
  body: z.object({
    url: z.string().url('URL da foto inválida'),
    comentario: z.string().optional(),
    categoria: z.string().optional()
  })
});