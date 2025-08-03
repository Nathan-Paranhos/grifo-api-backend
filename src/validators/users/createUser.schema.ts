import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    nome: z.string().min(1, 'Nome é obrigatório'),
    papel: z.enum(['admin', 'gerente', 'vistoriador', 'proprietario'], {
      errorMap: () => ({ message: 'Papel deve ser: admin, gerente, vistoriador ou proprietario' })
    }),
    telefone: z.string().optional(),
    senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional()
  })
});