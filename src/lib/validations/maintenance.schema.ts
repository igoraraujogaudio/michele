import { z } from 'zod'

export const maintenanceOrderSchema = z.object({
  vehicle_id: z.string().uuid('ID do veículo inválido'),
  order_number: z.string()
    .min(1, 'Número da ordem é obrigatório')
    .max(20, 'Número da ordem deve ter no máximo 20 caracteres'),
  description: z.string()
    .min(10, 'Descrição deve ter no mínimo 10 caracteres')
    .max(5000, 'Descrição muito longa'),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).default('pending'),
  priority: z.number()
    .int('Prioridade deve ser um número inteiro')
    .min(1, 'Prioridade mínima é 1')
    .max(5, 'Prioridade máxima é 5')
    .default(1),
  estimated_hours: z.number()
    .positive('Horas estimadas devem ser positivas')
    .optional()
    .nullable(),
  actual_hours: z.number()
    .positive('Horas reais devem ser positivas')
    .optional()
    .nullable(),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
})

export const updateMaintenanceOrderSchema = maintenanceOrderSchema.partial().extend({
  id: z.string().uuid(),
})

export const startMaintenanceSchema = z.object({
  id: z.string().uuid(),
  start_date: z.string().datetime().optional(),
})

export const completeMaintenanceSchema = z.object({
  id: z.string().uuid(),
  actual_hours: z.number().positive('Horas reais devem ser positivas'),
  end_date: z.string().datetime().optional(),
  notes: z.string().max(5000).optional().nullable(),
})

export type MaintenanceOrderInput = z.infer<typeof maintenanceOrderSchema>
export type UpdateMaintenanceOrderInput = z.infer<typeof updateMaintenanceOrderSchema>
export type StartMaintenanceInput = z.infer<typeof startMaintenanceSchema>
export type CompleteMaintenanceInput = z.infer<typeof completeMaintenanceSchema>
