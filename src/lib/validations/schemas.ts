import { z } from 'zod';

export const veiculoSchema = z.object({
  prefixo: z.string()
    .min(1, 'Prefixo é obrigatório')
    .max(20, 'Prefixo deve ter no máximo 20 caracteres')
    .transform(val => val.toUpperCase().trim()),
  
  placa: z.string()
    .min(7, 'Placa inválida')
    .max(8, 'Placa inválida')
    .regex(/^[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}$/, 'Formato de placa inválido (ABC-1234 ou ABC1D23)')
    .transform(val => val.toUpperCase().trim()),
  
  marca: z.string()
    .min(1, 'Marca é obrigatória')
    .max(100, 'Marca deve ter no máximo 100 caracteres')
    .transform(val => val.toUpperCase().trim()),
  
  modelo: z.string()
    .min(1, 'Modelo é obrigatório')
    .max(100, 'Modelo deve ter no máximo 100 caracteres')
    .transform(val => val.toUpperCase().trim()),
  
  ano: z.number()
    .int('Ano deve ser um número inteiro')
    .min(1900, 'Ano inválido')
    .max(2100, 'Ano inválido'),
  
  cor: z.string()
    .max(50, 'Cor deve ter no máximo 50 caracteres')
    .transform(val => val.toUpperCase().trim())
    .optional(),
  
  local_trabalho: z.string()
    .min(1, 'Local de trabalho é obrigatório')
    .max(200, 'Local de trabalho deve ter no máximo 200 caracteres')
    .transform(val => val.toUpperCase().trim()),
  
  nome_motorista: z.string()
    .max(200, 'Nome do motorista deve ter no máximo 200 caracteres')
    .transform(val => val.toUpperCase().trim())
    .optional(),
  
  telefone_motorista: z.string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional(),
  
  observacoes: z.string()
    .transform(val => val.toUpperCase().trim())
    .optional(),
});

export const updateVeiculoSchema = veiculoSchema.partial();

export const ordemManutencaoSchema = z.object({
  numero_ordem: z.string()
    .min(1, 'Número da ordem é obrigatório')
    .max(20, 'Número da ordem deve ter no máximo 20 caracteres')
    .transform(val => val.toUpperCase().trim()),
  
  veiculo_id: z.string()
    .uuid('ID do veículo inválido'),
  
  descricao: z.string()
    .min(1, 'Descrição é obrigatória')
    .transform(val => val.toUpperCase().trim()),
  
  observacoes: z.string()
    .transform(val => val.toUpperCase().trim())
    .optional(),
  
  is_reserva: z.boolean()
    .default(false)
    .optional(),
  
  nome_motorista: z.string()
    .max(200, 'Nome do motorista deve ter no máximo 200 caracteres')
    .transform(val => val.toUpperCase().trim())
    .optional(),
  
  telefone_motorista: z.string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional(),
});

export const statusOrdemSchema = z.enum([
  'EM MANUTENÇÃO',
  'AGUARDANDO PEÇA',
  'REPARO PARCIAL',
  'PRONTO',
  'FORNECEDOR EXTERNO',
  'PARADO PRONTO CJ',
  'PARADO PRONTO CG',
  'PARADO EM MANUTENÇÃO CJ',
  'PARADO EM MANUTENÇÃO CG',
]);

export const updateOrdemSchema = z.object({
  status: statusOrdemSchema.optional(),
  descricao: z.string()
    .min(1, 'Descrição é obrigatória')
    .transform(val => val.toUpperCase().trim())
    .optional(),
  observacoes: z.string()
    .transform(val => val.toUpperCase().trim())
    .optional(),
  tempo_parado_minutos: z.number()
    .int('Tempo deve ser um número inteiro')
    .min(0, 'Tempo não pode ser negativo')
    .optional(),
  tempo_editado_manualmente: z.boolean()
    .optional(),
  nome_motorista: z.string()
    .max(200, 'Nome do motorista deve ter no máximo 200 caracteres')
    .transform(val => val.toUpperCase().trim())
    .optional(),
  telefone_motorista: z.string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional(),
});

export type VeiculoInput = z.infer<typeof veiculoSchema>;
export type UpdateVeiculoInput = z.infer<typeof updateVeiculoSchema>;
export type OrdemManutencaoInput = z.infer<typeof ordemManutencaoSchema>;
export type UpdateOrdemInput = z.infer<typeof updateOrdemSchema>;
export type StatusOrdemInput = z.infer<typeof statusOrdemSchema>;
