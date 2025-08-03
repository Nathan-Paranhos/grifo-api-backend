import { z } from 'zod';

export const propertySchema = z.object({
  body: z.object({
    enderecoCompleto: z.string().min(1, 'Endereço é obrigatório'),
    proprietario: z.object({
      nome: z.string().min(1, 'Nome do proprietário é obrigatório')
    }).optional()
    // Add other property fields as needed
  })
});