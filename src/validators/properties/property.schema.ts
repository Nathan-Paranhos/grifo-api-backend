import { z } from 'zod';

export const propertySchema = z.object({
  body: z.object({
    endereco: z.string().min(1, 'Endereço é obrigatório'),
    bairro: z.string().min(1, 'Bairro é obrigatório'),
    cidade: z.string().min(1, 'Cidade é obrigatória'),
    estado: z.string().min(1, 'Estado é obrigatório'),
    cep: z.string().min(8, 'CEP deve ter pelo menos 8 caracteres'),
    tipo: z.string().min(1, 'Tipo é obrigatório'),
    areaTotal: z.number().positive().optional(),
    areaConstruida: z.number().positive().optional(),
    descricao: z.string().optional(),
    enderecoCompleto: z.string().optional(),
    proprietario: z.object({
      nome: z.string().min(1, 'Nome do proprietário é obrigatório'),
      telefone: z.string().optional(),
      email: z.string().email('Email inválido').optional(),
      cpf: z.string().optional(),
      rg: z.string().optional()
    }).optional(),
    inquilino: z.object({
      nome: z.string().optional(),
      telefone: z.string().optional(),
      email: z.string().email('Email inválido').optional(),
      cpf: z.string().optional(),
      rg: z.string().optional()
    }).optional(),
    valorAluguel: z.number().positive().optional(),
    valorIptu: z.number().positive().optional(),
    observacoes: z.string().optional(),
    ativo: z.boolean().optional()
  })
});