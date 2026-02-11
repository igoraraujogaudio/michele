import type { StatusOrdem } from './database.types';

export interface VeiculoEmManutencao {
  veiculo_id: string;
  prefixo: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string | null;
  ordem_id: string;
  numero_ordem: string;
  status: StatusOrdem;
  descricao: string;
  observacoes: string | null;
  is_reserva: boolean;
  nome_motorista: string | null;
  telefone_motorista: string | null;
  data_abertura: string;
  tempo_parado_minutos: number | null;
  tempo_editado_manualmente: boolean;
  tempo_parado_atual_minutos: number;
  tempo_parado_formatado: string;
  dias_parados: number;
  nivel_alerta: number; // 0=normal, 1=alerta, 2=urgente
  created_at: string;
  updated_at: string;
}

export interface VeiculoDisponivel {
  veiculo_id: string;
  prefixo: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string | null;
  observacoes: string | null;
  status_atual: string; // 'DISPONÍVEL'
  ultima_ordem_numero: string | null;
  ultima_ordem_status: StatusOrdem | null;
  ultima_ordem_data_fechamento: string | null;
  ultima_ordem_tempo_parado: number | null;
  dias_desde_ultima_manutencao: number | null;
  total_manutencoes_realizadas: number;
  tempo_total_parado_minutos: number;
  created_at: string;
  updated_at: string;
}

export interface FiltrosVeiculosEmManutencao {
  status?: StatusOrdem;
  nivel_alerta?: number;
  is_reserva?: boolean;
}

export interface FiltrosVeiculosDisponiveis {
  marca?: string;
  modelo?: string;
  ano_min?: number;
  ano_max?: number;
}

export interface ExcelVeiculoEmManutencao {
  Prefixo: string;
  Placa: string;
  Marca: string;
  Modelo: string;
  Ano: number;
  Cor: string;
  'Número Ordem': string;
  Status: string;
  Descrição: string;
  'É Reserva': string;
  'Nome Motorista': string;
  'Telefone Motorista': string;
  'Data Abertura': string;
  'Tempo Parado': string;
  'Dias Parados': number;
  Alerta: string;
  Observações: string;
}

export interface ExcelVeiculoDisponivel {
  Prefixo: string;
  Placa: string;
  Marca: string;
  Modelo: string;
  Ano: number;
  Cor: string;
  Status: string;
  'Última Ordem': string;
  'Status Última Ordem': string;
  'Data Fechamento': string;
  'Dias Desde Última Manutenção': string;
  'Total Manutenções': number;
  'Tempo Total Parado (horas)': string;
  Observações: string;
}
