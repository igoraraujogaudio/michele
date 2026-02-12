export type StatusOrdem = 
  | 'EM MANUTENÇÃO'
  | 'AGUARDANDO PEÇA'
  | 'REPARO PARCIAL'
  | 'PRONTO'
  | 'FORNECEDOR EXTERNO'
  | 'PARADO PRONTO CJ'
  | 'PARADO PRONTO CG'
  | 'PARADO EM MANUTENÇÃO CJ'
  | 'PARADO EM MANUTENÇÃO CG'
  | 'SUBSTITUÍDO POR';

export type StatusVeiculo = 'OPERAÇÃO' | 'MANUTENÇÃO';

export interface Veiculo {
  id: string;
  prefixo_id: string | null;
  placa: string;
  modelo: string | null;
  local_trabalho_id: string | null;
  gerencia_id: string | null;
  status: StatusVeiculo;
  nome_motorista: string | null;
  telefone_motorista: string | null;
  created_at: string;
  updated_at: string;
  prefixo?: { nome: string } | null;
  local_trabalho?: { nome: string } | null;
  gerencia?: { nome: string } | null;
  marca?: string | null;
  ano?: number | null;
  cor?: string | null;
  observacoes?: string | null;
}

export interface OrdemManutencao {
  id: string;
  numero_ordem: string;
  veiculo_id: string;
  status: StatusOrdem;
  descricao: string;
  observacoes: string | null;
  veiculo_substituto_id: string | null;
  is_reserva: boolean | null;
  veiculo_reserva_id: string | null;
  nome_motorista: string | null;
  telefone_motorista: string | null;
  data_abertura: string;
  data_fechamento: string | null;
  tempo_parado_minutos: number | null;
  tempo_editado_manualmente: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface HistoricoStatus {
  id: string;
  ordem_id: string;
  status_anterior: StatusOrdem | null;
  status_novo: StatusOrdem;
  data_mudanca: string;
  observacao: string | null;
  changed_by: string | null;
}

export interface VeiculoComOrdem extends Veiculo {
  ordem_atual?: OrdemManutencao;
}

export interface OrdemComVeiculo extends OrdemManutencao {
  veiculo: Veiculo;
}

export interface Prefixo {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalTrabalho {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Gerencia {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVeiculoDTO {
  prefixo: string;
  placa: string;
  modelo?: string;
  local_trabalho_id?: string;
  status?: StatusVeiculo;
  nome_motorista?: string;
  telefone_motorista?: string;
}

export interface UpdateVeiculoDTO {
  prefixo?: string;
  placa?: string;
  modelo?: string;
  local_trabalho_id?: string;
  status?: StatusVeiculo;
  nome_motorista?: string;
  telefone_motorista?: string;
}

export interface CreateGerenciaDTO {
  nome: string;
  descricao?: string;
  ativo?: boolean;
}

export interface UpdateGerenciaDTO {
  nome?: string;
  descricao?: string;
  ativo?: boolean;
}

export interface CreateOrdemDTO {
  numero_ordem: string;
  veiculo_id: string;
  descricao: string;
  observacoes?: string;
  status?: StatusOrdem;
  is_reserva?: boolean;
  veiculo_reserva_id?: string | null;
  nome_motorista?: string;
  telefone_motorista?: string;
}

export interface UpdateOrdemDTO {
  status?: StatusOrdem;
  descricao?: string;
  observacoes?: string;
  tempo_parado_minutos?: number;
  tempo_editado_manualmente?: boolean;
  nome_motorista?: string;
  telefone_motorista?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
