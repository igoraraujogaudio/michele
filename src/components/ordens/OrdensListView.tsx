'use client';

import { useState } from 'react';
import { Download, Calendar } from 'lucide-react';
import OrdensTable from './OrdensTable';
import type { OrdemComVeiculo } from '@/lib/types/database.types';
import * as XLSX from 'xlsx';

interface OrdensListViewProps {
  ordens: OrdemComVeiculo[];
}

export default function OrdensListView({ ordens: ordensIniciais }: OrdensListViewProps) {
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [ordensFiltradas, setOrdensFiltradas] = useState(ordensIniciais);

  const aplicarFiltro = () => {
    let filtradas = ordensIniciais;

    if (dataInicio) {
      filtradas = filtradas.filter(ordem => 
        new Date(ordem.data_abertura) >= new Date(dataInicio)
      );
    }

    if (dataFim) {
      filtradas = filtradas.filter(ordem => 
        new Date(ordem.data_abertura) <= new Date(dataFim + 'T23:59:59')
      );
    }

    setOrdensFiltradas(filtradas);
  };

  const limparFiltro = () => {
    setDataInicio('');
    setDataFim('');
    setOrdensFiltradas(ordensIniciais);
  };

  const exportarExcel = () => {
    const dados = ordensFiltradas.map(ordem => ({
      'Número Ordem': ordem.numero_ordem,
      'Prefixo': ordem.veiculo?.prefixo?.nome || '-',
      'Placa': ordem.veiculo?.placa || '-',
      'Modelo': ordem.veiculo?.modelo || '-',
      'Status': ordem.status,
      'Data Abertura': new Date(ordem.data_abertura).toLocaleDateString('pt-BR'),
      'Data Fechamento': ordem.data_fechamento 
        ? new Date(ordem.data_fechamento).toLocaleDateString('pt-BR') 
        : 'Em aberto',
      'Tempo Parado (min)': ordem.tempo_parado_minutos || '-',
      'Descrição': ordem.descricao,
      'Observações': ordem.observacoes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ordens');

    const colWidths = [
      { wch: 15 }, // Número Ordem
      { wch: 12 }, // Prefixo
      { wch: 12 }, // Placa
      { wch: 20 }, // Modelo
      { wch: 20 }, // Status
      { wch: 15 }, // Data Abertura
      { wch: 15 }, // Data Fechamento
      { wch: 15 }, // Tempo Parado
      { wch: 40 }, // Descrição
      { wch: 40 }, // Observações
    ];
    ws['!cols'] = colWidths;

    const dataAtual = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `ordens_manutencao_${dataAtual}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Filtros e Exportação */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline-block w-4 h-4 mr-1" />
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline-block w-4 h-4 mr-1" />
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={aplicarFiltro}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Filtrar
            </button>
            {(dataInicio || dataFim) && (
              <button
                onClick={limparFiltro}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                Limpar
              </button>
            )}
          </div>

          <button
            onClick={exportarExcel}
            disabled={ordensFiltradas.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exportar Excel ({ordensFiltradas.length})
          </button>
        </div>

        {(dataInicio || dataFim) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-900">
              <strong>Período:</strong>{' '}
              {dataInicio ? new Date(dataInicio).toLocaleDateString('pt-BR') : 'Início'} até{' '}
              {dataFim ? new Date(dataFim).toLocaleDateString('pt-BR') : 'Hoje'}
            </p>
          </div>
        )}
      </div>

      {/* Tabela */}
      <OrdensTable ordens={ordensFiltradas} />
    </div>
  );
}
