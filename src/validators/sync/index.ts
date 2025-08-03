import { z } from 'zod';

// Esquema para validação de sincronização
export const syncSchema = z.object({
  pendingInspections: z.array(
    z.object({
      id: z.string(),
      empresaId: z.string(),
      imovelId: z.string(),
      tipo: z.enum(['entrada', 'saida', 'manutencao']),
      fotos: z.array(z.string()).optional(),
      checklist: z.record(z.string()).optional(),
      observacoes: z.string().optional(),
      createdAt: z.string(),
      status: z.enum(['pending', 'synced', 'error'])
    })
  ),
  vistoriadorId: z.string().min(1, { message: 'vistoriadorId é obrigatório' }),
  empresaId: z.string().min(1, { message: 'empresaId é obrigatório' })
});

// Esquema para verificação de status de sincronização
export const syncStatusSchema = z.object({
  empresaId: z.string().min(1, { message: 'ID da empresa é obrigatório' }),
  vistoriadorId: z.string().optional()
});