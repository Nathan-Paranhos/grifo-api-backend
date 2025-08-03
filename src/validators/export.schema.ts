import { z } from 'zod';

export const exportQuerySchema = z.object({
  format: z.enum(['excel', 'pdf', 'csv']).default('excel'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  status: z.string().optional(),
  vistoriadorId: z.string().optional(),
  propertyType: z.string().optional(),
});