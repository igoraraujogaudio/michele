import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { 
  VeiculoEmManutencao, 
  VeiculoDisponivel,
  ExcelVeiculoEmManutencao,
  ExcelVeiculoDisponivel
} from '@/lib/types/relatorios.types';

export function exportarVeiculosEmManutencaoParaExcel(
  veiculos: VeiculoEmManutencao[],
  nomeArquivo: string = 'veiculos_em_manutencao.xlsx'
): void {
  const dadosExcel: ExcelVeiculoEmManutencao[] = veiculos.map(v => ({
    'Prefixo': v.prefixo,
    'Placa': v.placa,
    'Marca': v.marca,
    'Modelo': v.modelo,
    'Ano': v.ano,
    'Cor': v.cor || '-',
    'Número Ordem': v.numero_ordem,
    'Status': v.status,
    'Descrição': v.descricao,
    'É Reserva': v.is_reserva ? 'SIM' : 'NÃO',
    'Nome Motorista': v.nome_motorista || '-',
    'Telefone Motorista': v.telefone_motorista || '-',
    'Data Abertura': format(new Date(v.data_abertura), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    'Tempo Parado': v.tempo_parado_formatado,
    'Dias Parados': v.dias_parados,
    'Alerta': v.nivel_alerta === 2 ? 'URGENTE' : v.nivel_alerta === 1 ? 'ALERTA' : 'NORMAL',
    'Observações': v.observacoes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dadosExcel);

  const colWidths = [
    { wch: 12 }, // Prefixo
    { wch: 10 }, // Placa
    { wch: 15 }, // Marca
    { wch: 20 }, // Modelo
    { wch: 6 },  // Ano
    { wch: 10 }, // Cor
    { wch: 15 }, // Número Ordem
    { wch: 25 }, // Status
    { wch: 40 }, // Descrição
    { wch: 10 }, // É Reserva
    { wch: 25 }, // Nome Motorista
    { wch: 18 }, // Telefone Motorista
    { wch: 18 }, // Data Abertura
    { wch: 15 }, // Tempo Parado
    { wch: 12 }, // Dias Parados
    { wch: 10 }, // Alerta
    { wch: 40 }, // Observações
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Veículos em Manutenção');

  const worksheetInfo = XLSX.utils.json_to_sheet([
    { 'Campo': 'Total de Veículos', 'Valor': veiculos.length },
    { 'Campo': 'Normais (< 24h)', 'Valor': veiculos.filter(v => v.nivel_alerta === 0).length },
    { 'Campo': 'Alerta (24h-48h)', 'Valor': veiculos.filter(v => v.nivel_alerta === 1).length },
    { 'Campo': 'Urgente (> 48h)', 'Valor': veiculos.filter(v => v.nivel_alerta === 2).length },
    { 'Campo': 'Reservas', 'Valor': veiculos.filter(v => v.is_reserva).length },
    { 'Campo': 'Data/Hora Exportação', 'Valor': format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) },
  ]);
  worksheetInfo['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, worksheetInfo, 'Resumo');

  XLSX.writeFile(workbook, nomeArquivo);
}

export function exportarVeiculosDisponiveisParaExcel(
  veiculos: VeiculoDisponivel[],
  nomeArquivo: string = 'veiculos_disponiveis.xlsx'
): void {
  const dadosExcel: ExcelVeiculoDisponivel[] = veiculos.map(v => ({
    'Prefixo': v.prefixo,
    'Placa': v.placa,
    'Marca': v.marca,
    'Modelo': v.modelo,
    'Ano': v.ano,
    'Cor': v.cor || '-',
    'Status': v.status_atual,
    'Última Ordem': v.ultima_ordem_numero || 'Nunca',
    'Status Última Ordem': v.ultima_ordem_status || '-',
    'Data Fechamento': v.ultima_ordem_data_fechamento 
      ? format(new Date(v.ultima_ordem_data_fechamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      : '-',
    'Dias Desde Última Manutenção': v.dias_desde_ultima_manutencao !== null 
      ? `${Math.floor(v.dias_desde_ultima_manutencao)} dias`
      : '-',
    'Total Manutenções': v.total_manutencoes_realizadas,
    'Tempo Total Parado (horas)': v.tempo_total_parado_minutos 
      ? `${Math.floor(v.tempo_total_parado_minutos / 60)}h ${v.tempo_total_parado_minutos % 60}min`
      : '-',
    'Observações': v.observacoes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dadosExcel);

  const colWidths = [
    { wch: 12 }, // Prefixo
    { wch: 10 }, // Placa
    { wch: 15 }, // Marca
    { wch: 20 }, // Modelo
    { wch: 6 },  // Ano
    { wch: 10 }, // Cor
    { wch: 12 }, // Status
    { wch: 15 }, // Última Ordem
    { wch: 25 }, // Status Última Ordem
    { wch: 18 }, // Data Fechamento
    { wch: 28 }, // Dias Desde Última Manutenção
    { wch: 18 }, // Total Manutenções
    { wch: 25 }, // Tempo Total Parado
    { wch: 40 }, // Observações
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Veículos Disponíveis');

  const worksheetInfo = XLSX.utils.json_to_sheet([
    { 'Campo': 'Total de Veículos Disponíveis', 'Valor': veiculos.length },
    { 'Campo': 'Com Histórico de Manutenção', 'Valor': veiculos.filter(v => v.total_manutencoes_realizadas > 0).length },
    { 'Campo': 'Sem Histórico', 'Valor': veiculos.filter(v => v.total_manutencoes_realizadas === 0).length },
    { 'Campo': 'Média de Manutenções por Veículo', 'Valor': veiculos.length > 0 
      ? (veiculos.reduce((acc, v) => acc + v.total_manutencoes_realizadas, 0) / veiculos.length).toFixed(2)
      : '0' },
    { 'Campo': 'Data/Hora Exportação', 'Valor': format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) },
  ]);
  worksheetInfo['!cols'] = [{ wch: 35 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, worksheetInfo, 'Resumo');

  XLSX.writeFile(workbook, nomeArquivo);
}

export function gerarBufferExcelVeiculosEmManutencao(veiculos: VeiculoEmManutencao[]): Buffer {
  const dadosExcel: ExcelVeiculoEmManutencao[] = veiculos.map(v => ({
    'Prefixo': v.prefixo,
    'Placa': v.placa,
    'Marca': v.marca,
    'Modelo': v.modelo,
    'Ano': v.ano,
    'Cor': v.cor || '-',
    'Número Ordem': v.numero_ordem,
    'Status': v.status,
    'Descrição': v.descricao,
    'É Reserva': v.is_reserva ? 'SIM' : 'NÃO',
    'Nome Motorista': v.nome_motorista || '-',
    'Telefone Motorista': v.telefone_motorista || '-',
    'Data Abertura': format(new Date(v.data_abertura), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    'Tempo Parado': v.tempo_parado_formatado,
    'Dias Parados': v.dias_parados,
    'Alerta': v.nivel_alerta === 2 ? 'URGENTE' : v.nivel_alerta === 1 ? 'ALERTA' : 'NORMAL',
    'Observações': v.observacoes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
  const colWidths = [
    { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 6 }, { wch: 10 },
    { wch: 15 }, { wch: 25 }, { wch: 40 }, { wch: 10 }, { wch: 25 }, { wch: 18 },
    { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 40 },
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Veículos em Manutenção');

  const worksheetInfo = XLSX.utils.json_to_sheet([
    { 'Campo': 'Total de Veículos', 'Valor': veiculos.length },
    { 'Campo': 'Normais (< 24h)', 'Valor': veiculos.filter(v => v.nivel_alerta === 0).length },
    { 'Campo': 'Alerta (24h-48h)', 'Valor': veiculos.filter(v => v.nivel_alerta === 1).length },
    { 'Campo': 'Urgente (> 48h)', 'Valor': veiculos.filter(v => v.nivel_alerta === 2).length },
    { 'Campo': 'Reservas', 'Valor': veiculos.filter(v => v.is_reserva).length },
    { 'Campo': 'Data/Hora Exportação', 'Valor': format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) },
  ]);
  worksheetInfo['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, worksheetInfo, 'Resumo');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function gerarBufferExcelVeiculosDisponiveis(veiculos: VeiculoDisponivel[]): Buffer {
  const dadosExcel: ExcelVeiculoDisponivel[] = veiculos.map(v => ({
    'Prefixo': v.prefixo,
    'Placa': v.placa,
    'Marca': v.marca,
    'Modelo': v.modelo,
    'Ano': v.ano,
    'Cor': v.cor || '-',
    'Status': v.status_atual,
    'Última Ordem': v.ultima_ordem_numero || 'Nunca',
    'Status Última Ordem': v.ultima_ordem_status || '-',
    'Data Fechamento': v.ultima_ordem_data_fechamento 
      ? format(new Date(v.ultima_ordem_data_fechamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })
      : '-',
    'Dias Desde Última Manutenção': v.dias_desde_ultima_manutencao !== null 
      ? `${Math.floor(v.dias_desde_ultima_manutencao)} dias`
      : '-',
    'Total Manutenções': v.total_manutencoes_realizadas,
    'Tempo Total Parado (horas)': v.tempo_total_parado_minutos 
      ? `${Math.floor(v.tempo_total_parado_minutos / 60)}h ${v.tempo_total_parado_minutos % 60}min`
      : '-',
    'Observações': v.observacoes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dadosExcel);
  const colWidths = [
    { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 6 }, { wch: 10 },
    { wch: 12 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 28 }, { wch: 18 },
    { wch: 25 }, { wch: 40 },
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Veículos Disponíveis');

  const worksheetInfo = XLSX.utils.json_to_sheet([
    { 'Campo': 'Total de Veículos Disponíveis', 'Valor': veiculos.length },
    { 'Campo': 'Com Histórico de Manutenção', 'Valor': veiculos.filter(v => v.total_manutencoes_realizadas > 0).length },
    { 'Campo': 'Sem Histórico', 'Valor': veiculos.filter(v => v.total_manutencoes_realizadas === 0).length },
    { 'Campo': 'Média de Manutenções por Veículo', 'Valor': veiculos.length > 0 
      ? (veiculos.reduce((acc, v) => acc + v.total_manutencoes_realizadas, 0) / veiculos.length).toFixed(2)
      : '0' },
    { 'Campo': 'Data/Hora Exportação', 'Valor': format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR }) },
  ]);
  worksheetInfo['!cols'] = [{ wch: 35 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, worksheetInfo, 'Resumo');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
