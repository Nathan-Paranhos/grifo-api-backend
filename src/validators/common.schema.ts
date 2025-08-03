import { z } from 'zod';

export const commonQuerySchema = z.object({
  vistoriadorId: z.string().optional(),
});

export const paginationSchema = z.object({
  limit: z.preprocess((val) => Number(val || 20), z.number().min(1)),
  offset: z.preprocess((val) => Number(val || 0), z.number().min(0)),
});