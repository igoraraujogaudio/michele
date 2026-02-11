'use client';

import { useState, useEffect, useCallback } from 'react';
import { getVeiculosEmManutencao } from '@/lib/actions/relatorios.actions';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Download, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { VeiculoEmManutencao } from '@/lib/types/relatorios.types';
import type { StatusOrdem } from '@/lib/types/database.types';

type SortField = 'prefixo' | 'placa' | 'status' | 'data_abertura' | 'tempo_parado_minutos';
type SortDirection = 'asc' | 'desc';

export default function RelatorioManutencaoPage() {
  const [veiculos, setVeiculos] = useState<VeiculoEmManutencao[]>([]);
  const [filteredVeiculos, setFilteredVeiculos] = useState<VeiculoEmManutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filtroStatus, setFiltroStatus] = useState<string>('');
  const [filtroLocalTrabalho, setFiltroLocalTrabalho] = useState<string>('');
  
  const [sortField, setSortField] = useState<SortField>('tempo_parado_minutos');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getLocalTrabalho = useCallback((veiculo: VeiculoEmManutencao): string => {
    const status = veiculo.status;
    
    if (status === 'PARADO PRONTO CJ' || status === 'PARADO EM MANUTENÇÃO CJ') {
      return 'CAMPO JORDÃO';
    }
    if (status === 'PARADO PRONTO CG' || status === 'PARADO EM MANUTENÇÃO CG') {
      return 'CAMPO GRANDE';
    }
    if (status === 'FORNECEDOR EXTERNO') {
      return 'FORNECEDOR EXTERNO';
    }
    return 'OFICINA';
  }, []);

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...veiculos];

    if (filtroStatus) {
      filtered = filtered.filter(v => v.status === filtroStatus);
    }

    if (filtroLocalTrabalho) {
      filtered = filtered.filter(v => getLocalTrabalho(v) === filtroLocalTrabalho);
    }

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'prefixo':
          aValue = a.prefixo;
          bValue = b.prefixo;
          break;
        case 'placa':
          aValue = a.placa;
          bValue = b.placa;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'data_abertura':
          aValue = new Date(a.data_abertura).getTime();
          bValue = new Date(b.data_abertura).getTime();
          break;
        case 'tempo_parado_minutos':
          aValue = a.tempo_parado_atual_minutos;
          bValue = b.tempo_parado_atual_minutos;
          break;
        default:
          aValue = a.prefixo;
          bValue = b.prefixo;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredVeiculos(filtered);
    setCurrentPage(1);
  }, [veiculos, filtroStatus, filtroLocalTrabalho, sortField, sortDirection, getLocalTrabalho]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    const result = await getVeiculosEmManutencao();
    
    if (result.success && result.data) {
      setVeiculos(result.data);
    } else {
      setError(result.error || 'Erro ao carregar dados');
    }
    
    setLoading(false);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    
    try {
      const params = new URLSearchParams();
      if (filtroStatus) params.append('status', filtroStatus);
      
      const response = await fetch(`/api/relatorios/em-manutencao?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio_manutencao_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status: StatusOrdem) => {
    switch (status) {
      case 'EM MANUTENÇÃO':
        return 'bg-yellow-100 text-yellow-800';
      case 'AGUARDANDO PEÇA':
        return 'bg-orange-100 text-orange-800';
      case 'PRONTO':
        return 'bg-blue-100 text-blue-800';
      case 'REPARO PARCIAL':
        return 'bg-purple-100 text-purple-800';
      case 'FORNECEDOR EXTERNO':
        return 'bg-indigo-100 text-indigo-800';
      case 'PARADO PRONTO CJ':
      case 'PARADO PRONTO CG':
        return 'bg-green-100 text-green-800';
      case 'PARADO EM MANUTENÇÃO CJ':
      case 'PARADO EM MANUTENÇÃO CG':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNivelAlertaColor = (nivel: number) => {
    switch (nivel) {
      case 2:
        return 'bg-red-100 text-red-800';
      case 1:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getNivelAlertaLabel = (nivel: number) => {
    switch (nivel) {
      case 2:
        return 'URGENTE';
      case 1:
        return 'ALERTA';
      default:
        return 'NORMAL';
    }
  };

  const statusOptions = [
    { value: 'EM MANUTENÇÃO', label: 'EM MANUTENÇÃO' },
    { value: 'AGUARDANDO PEÇA', label: 'AGUARDANDO PEÇA' },
    { value: 'REPARO PARCIAL', label: 'REPARO PARCIAL' },
    { value: 'PRONTO', label: 'PRONTO' },
    { value: 'FORNECEDOR EXTERNO', label: 'FORNECEDOR EXTERNO' },
    { value: 'PARADO PRONTO CJ', label: 'PARADO PRONTO CJ' },
    { value: 'PARADO PRONTO CG', label: 'PARADO PRONTO CG' },
    { value: 'PARADO EM MANUTENÇÃO CJ', label: 'PARADO EM MANUTENÇÃO CJ' },
    { value: 'PARADO EM MANUTENÇÃO CG', label: 'PARADO EM MANUTENÇÃO CG' },
  ];

  const locaisTrabalho = Array.from(new Set(veiculos.map(v => getLocalTrabalho(v)))).sort();
  const localOptions = locaisTrabalho.map(local => ({ value: local, label: local }));

  const totalPages = Math.ceil(filteredVeiculos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVeiculos = filteredVeiculos.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8">
            <p className="text-red-600">{error}</p>
            <Button onClick={loadData} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatório de Manutenção</h1>
            <p className="text-gray-600 mt-1">
              {filteredVeiculos.length} veículo(s) em manutenção
            </p>
          </div>
          <Button
            onClick={exportToExcel}
            loading={exporting}
            variant="success"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Status"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              options={statusOptions}
            />
            <Select
              label="Local de Trabalho"
              value={filtroLocalTrabalho}
              onChange={(e) => setFiltroLocalTrabalho(e.target.value)}
              options={localOptions}
            />
          </div>
        </div>

        {filteredVeiculos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">Nenhum veículo encontrado com os filtros aplicados</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('prefixo')}
                    >
                      <div className="flex items-center gap-1">
                        Prefixo
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('placa')}
                    >
                      <div className="flex items-center gap-1">
                        Placa
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Local Trabalho
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('data_abertura')}
                    >
                      <div className="flex items-center gap-1">
                        Data Abertura
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('tempo_parado_minutos')}
                    >
                      <div className="flex items-center gap-1">
                        Tempo Parado
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Alerta
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentVeiculos.map((veiculo) => (
                    <tr key={veiculo.veiculo_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{veiculo.prefixo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{veiculo.placa}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getLocalTrabalho(veiculo)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(veiculo.status)}`}>
                          {veiculo.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {format(new Date(veiculo.data_abertura), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {veiculo.tempo_parado_formatado}
                          <div className="text-xs text-gray-500">{veiculo.dias_parados} dia(s)</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getNivelAlertaColor(veiculo.nivel_alerta)}`}>
                          {getNivelAlertaLabel(veiculo.nivel_alerta)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredVeiculos.length)} de {filteredVeiculos.length} veículos
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm"
                  >
                    Anterior
                  </Button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm"
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
