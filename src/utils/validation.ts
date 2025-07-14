import { z } from 'zod';

// Esquema de validação para inspeções
export const inspectionSchema = z.object({
  id: z.string().min(1, { message: 'ID é obrigatório' }),
  empresaId: z.string().min(1, { message: 'ID da empresa é obrigatório' }),
  vistoriadorId: z.string().min(1, { message: 'ID do vistoriador é obrigatório' }),
  imovelId: z.string().min(1, { message: 'ID do imóvel é obrigatório' }),
  tipo: z.enum(['entrada', 'saida', 'manutencao'], {
    errorMap: () => ({ message: 'Tipo deve ser entrada, saida ou manutencao' }),
  }),
  fotos: z.array(z.string()).min(1, { message: 'Pelo menos uma foto é obrigatória' }),
  checklist: z.record(z.string()),
  observacoes: z.string().optional(),
  createdAt: z.string().datetime({ message: 'Data de criação inválida' }),
  status: z.enum(['pending', 'synced', 'error'], {
    errorMap: () => ({ message: 'Status deve ser pending, synced ou error' }),
  }),
});

// Tipo inferido do esquema
export type InspectionType = z.infer<typeof inspectionSchema>;

// Função para validar uma inspeção
export function validateInspection(data: unknown) {
  try {
    return {
      success: true,
      data: inspectionSchema.parse(data),
      errors: null,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return {
      success: false,
      data: null,
      errors: [{ path: '', message: 'Erro de validação desconhecido' }],
    };
  }
}