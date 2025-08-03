import { z } from 'zod';

export const createInspectionSchema = z.object({
  body: z.object({
    imovelId: z.string().min(1, 'ID do imóvel é obrigatório'),
    tipo: z.enum(['entrada', 'saida', 'periodica'], {
      errorMap: () => ({ message: 'Tipo deve ser: entrada, saida ou periodica' })
    }),
    dataAgendada: z.string().datetime('Data agendada inválida'),
    observacoes: z.string().optional(),
    checklist: z.array(z.object({
      item: z.string(),
      categoria: z.string(),
      status: z.enum(['ok', 'problema', 'nao_aplicavel']),
      observacao: z.string().optional()
    })).optional(),
    vistoriadorId: z.string().optional()
  })
});