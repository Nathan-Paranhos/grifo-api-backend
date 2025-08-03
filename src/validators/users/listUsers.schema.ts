import * as z from 'zod';

export const listUsersQuerySchema = z.object({
  limit: z.preprocess((val) => Number(val || 20), z.number().min(1)),
  offset: z.preprocess((val) => Number(val || 0), z.number().min(0)),
  papel: z.enum(['admin', 'vistoriador', 'cliente']).optional(),
  ativo: z.preprocess((val) => {
    if (val === 'true') return true;
    if (val === 'false') return false;
    return undefined;
  }, z.boolean().optional()),
});