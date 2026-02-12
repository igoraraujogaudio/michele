import * as XLSX from 'xlsx';

interface VeiculoExport {
  prefixo?: { nome: string } | null;
  placa: string;
  modelo: string | null;
  local_trabalho?: { nome: string } | null;
  status: string;
  nome_motorista: string | null;
  telefone_motorista: string | null;
}

export function exportVeiculosToExcel(veiculos: VeiculoExport[], filename: string = 'veiculos.xlsx') {
  const data = veiculos.map(v => ({
    'Prefixo': v.prefixo?.nome || '-',
    'Placa': v.placa,
    'Modelo': v.modelo || '-',
    'Local de Trabalho': v.local_trabalho?.nome || '-',
    'Status': v.status,
    'Motorista': v.nome_motorista || '-',
    'Telefone': v.telefone_motorista || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Veículos');

  // Ajustar largura das colunas
  const colWidths = [
    { wch: 15 }, // Prefixo
    { wch: 12 }, // Placa
    { wch: 20 }, // Modelo
    { wch: 25 }, // Local de Trabalho
    { wch: 15 }, // Status
    { wch: 25 }, // Motorista
    { wch: 15 }, // Telefone
  ];
  ws['!cols'] = colWidths;

  XLSX.writeFile(wb, filename);
}
