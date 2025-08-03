import { z } from 'zod';

export const listInspectionsQuerySchema = z.object({
    limit: z.preprocess((val) => Number(val || 20), z.number().min(1)),
    offset: z.preprocess((val) => Number(val || 0), z.number().min(0)),
    status: z.enum(['pendente', 'em_andamento', 'concluida', 'cancelada']).optional(),
    tipo: z.enum(['entrada', 'saida', 'vistoria_preventiva']).optional(),
    vistoriadorId: z.string().optional(),
    imovelId: z.string().optional(),
    dataInicio: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date().optional()),
    dataFim: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date().optional()),
});