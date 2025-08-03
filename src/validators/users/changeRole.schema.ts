import { z } from 'zod';

export const changeRoleSchema = z.object({
  body: z.object({
    papel: z.enum(['admin', 'gerente', 'vistoriador', 'proprietario'])
  })
});