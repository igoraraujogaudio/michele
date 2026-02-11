export type StatusOrdem = 
  | 'EM MANUTENÇÃO'
  | 'AGUARDANDO PEÇA'
  | 'REPARO PARCIAL'
  | 'PRONTO'
  | 'FORNECEDOR EXTERNO'
  | 'PARADO PRONTO CJ'
  | 'PARADO PRONTO CG'
  | 'PARADO EM MANUTENÇÃO CJ'
  | 'PARADO EM MANUTENÇÃO CG';

export interface Veiculo {
  id: string;
  prefixo: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrdemManutencao {
  id: string;
  numero_ordem: string;
  veiculo_id: string;
  status: StatusOrdem;
  descricao: string;
  observacoes: string | null;
  is_reserva: boolean;
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

export interface CreateVeiculoDTO {
  prefixo: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor?: string;
  observacoes?: string;
}

export interface UpdateVeiculoDTO {
  prefixo?: string;
  placa?: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  cor?: string;
  observacoes?: string;
}

export interface CreateOrdemDTO {
  numero_ordem: string;
  veiculo_id: string;
  descricao: string;
  observacoes?: string;
  is_reserva?: boolean;
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
