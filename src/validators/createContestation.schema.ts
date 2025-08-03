import { z } from 'zod';

export const createContestationSchema = z.object({
  body: z.object({
    inspectionId: z.string().min(1, 'ID da vistoria é obrigatório'),
    motivo: z.string().min(1, 'Motivo é obrigatório'),
    detalhes: z.string().optional(),
    clienteId: z.string().optional()
  })
});