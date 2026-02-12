import { z } from 'zod';

export const statusVeiculoSchema = z.enum(['OPERAÇÃO', 'MANUTENÇÃO']);

export const veiculoSchema = z.object({
  prefixo: z.string()
    .min(1, 'Prefixo é obrigatório')
    .max(20, 'Prefixo deve ter no máximo 20 caracteres')
    .transform(val => val.toUpperCase().trim()),
  
  placa: z.string()
    .min(1, 'Placa é obrigatória')
    .max(20, 'Placa deve ter no máximo 20 caracteres')
    .transform(val => val.toUpperCase().trim()),
  
  modelo: z.string()
    .max(100, 'Modelo deve ter no máximo 100 caracteres')
    .transform(val => val.toUpperCase().trim())
    .optional(),
  
  local_trabalho_id: z.string()
    .optional()
    .transform(val => val === '' ? undefined : val)
    .pipe(z.string().uuid('ID do local de trabalho inválido').optional()),
  
  status: statusVeiculoSchema
    .default('OPERAÇÃO')
    .optional(),
  
  nome_motorista: z.string()
    .max(200, 'Nome do motorista deve ter no máximo 200 caracteres')
    .transform(val => val.toUpperCase().trim())
    .optional(),
  
  telefone_motorista: z.string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional(),
});

export const updateVeiculoSchema = veiculoSchema.partial();

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
  'SUBSTITUÍDO POR',
]);

export const ordemManutencaoSchema = z.object({
  numero_ordem: z.string()
    .min(1, 'Número da ordem é obrigatório')
    .max(20, 'Número da ordem deve ter no máximo 20 caracteres')
    .transform(val => val.toUpperCase().trim()),
  
  veiculo_id: z.string()
    .uuid('ID do veículo inválido'),
  
  status: statusOrdemSchema
    .default('EM MANUTENÇÃO')
    .optional(),
  
  descricao: z.string()
    .min(1, 'Descrição é obrigatória')
    .transform(val => val.toUpperCase().trim()),
  
  observacoes: z.string()
    .transform(val => val.toUpperCase().trim())
    .optional(),
  
  veiculo_substituto_id: z.string()
    .optional()
    .transform(val => val === '' ? undefined : val)
    .pipe(z.string().uuid('ID do veículo substituto inválido').optional()),
  
  nome_motorista: z.string()
    .max(200, 'Nome do motorista deve ter no máximo 200 caracteres')
    .transform(val => val.toUpperCase().trim())
    .optional(),
  
  telefone_motorista: z.string()
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .optional(),
});

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

export const gerenciaSchema = z.object({
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .transform(val => val.toUpperCase().trim()),
  
  descricao: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .transform(val => val.toUpperCase().trim())
    .optional(),
  
  ativo: z.boolean()
    .default(true)
    .optional(),
});

export const updateGerenciaSchema = gerenciaSchema.partial();

export type VeiculoInput = z.infer<typeof veiculoSchema>;
export type UpdateVeiculoInput = z.infer<typeof updateVeiculoSchema>;
export type OrdemManutencaoInput = z.infer<typeof ordemManutencaoSchema>;
export type UpdateOrdemInput = z.infer<typeof updateOrdemSchema>;
export type StatusOrdemInput = z.infer<typeof statusOrdemSchema>;
export type StatusVeiculoInput = z.infer<typeof statusVeiculoSchema>;
export type GerenciaInput = z.infer<typeof gerenciaSchema>;
export type UpdateGerenciaInput = z.infer<typeof updateGerenciaSchema>;
