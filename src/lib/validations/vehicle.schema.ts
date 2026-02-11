import { z } from 'zod'

export const vehicleSchema = z.object({
  plate: z.string()
    .min(7, 'Placa deve ter no mínimo 7 caracteres')
    .max(10, 'Placa deve ter no máximo 10 caracteres')
    .regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/, 'Formato de placa inválido'),
  brand: z.string()
    .min(2, 'Marca deve ter no mínimo 2 caracteres')
    .max(100, 'Marca deve ter no máximo 100 caracteres'),
  model: z.string()
    .min(2, 'Modelo deve ter no mínimo 2 caracteres')
    .max(100, 'Modelo deve ter no máximo 100 caracteres'),
  year: z.number()
    .int('Ano deve ser um número inteiro')
    .min(1900, 'Ano deve ser maior que 1900')
    .max(new Date().getFullYear() + 1, 'Ano inválido'),
  color: z.string().max(50).optional().nullable(),
  status: z.enum(['available', 'in_maintenance', 'unavailable']).default('available'),
})

export const updateVehicleSchema = vehicleSchema.partial()

export type VehicleInput = z.infer<typeof vehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
