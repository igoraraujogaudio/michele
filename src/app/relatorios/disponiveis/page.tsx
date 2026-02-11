'use client';

import { useState, useEffect } from 'react';
import { Download, Filter, X } from 'lucide-react';

interface VeiculoDisponivel {
  veiculo_id: string;
  prefixo: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string | null;
  local_trabalho: string | null;
  observacoes: string | null;
  status_atual: string;
}

export default function RelatorioDisponiveisPage() {
  const [veiculos, setVeiculos] = useState<VeiculoDisponivel[]>([]);
  const [veiculosFiltrados, setVeiculosFiltrados] = useState<VeiculoDisponivel[]>([]);
  const [locaisTrabalho, setLocaisTrabalho] = useState<string[]>([]);
  const [filtroLocal, setFiltroLocal] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    carregarVeiculos();
  }, []);

  useEffect(() => {
    if (filtroLocal) {
      setVeiculosFiltrados(
        veiculos.filter(v => v.local_trabalho === filtroLocal)
      );
    } else {
      setVeiculosFiltrados(veiculos);
    }
  }, [filtroLocal, veiculos]);

  async function carregarVeiculos() {
    try {
      setLoading(true);
      const response = await fetch('/api/relatorios/disponiveis');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar veículos disponíveis');
      }

      const data = await response.json();
      setVeiculos(data.veiculos || []);
      setVeiculosFiltrados(data.veiculos || []);
      
      const locaisUnicos = Array.from(
        new Set(
          (data.veiculos || [])
            .map((v: VeiculoDisponivel) => v.local_trabalho)
            .filter((local: string | null): local is string => !!local)
        )
      ).sort() as string[];
      
      setLocaisTrabalho(locaisUnicos);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      alert('Erro ao carregar veículos disponíveis');
    } finally {
      setLoading(false);
    }
  }

  async function exportarExcel() {
    try {
      setExporting(true);
      const url = filtroLocal 
        ? `/api/export/disponiveis?local=${encodeURIComponent(filtroLocal)}`
        : '/api/export/disponiveis';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erro ao exportar relatório');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `veiculos_disponiveis_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  }

  function limparFiltro() {
    setFiltroLocal('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando veículos disponíveis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Relatório de Veículos Disponíveis
        </h1>
        <p className="text-gray-600">
          Veículos que não estão em manutenção
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
          <div className="flex-1 w-full md:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline-block w-4 h-4 mr-1" />
              Filtrar por Local de Trabalho
            </label>
            <div className="flex gap-2">
              <select
                value={filtroLocal}
                onChange={(e) => setFiltroLocal(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos os locais</option>
                {locaisTrabalho.map((local) => (
                  <option key={local} value={local}>
                    {local}
                  </option>
                ))}
              </select>
              {filtroLocal && (
                <button
                  onClick={limparFiltro}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  title="Limpar filtro"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={exportarExcel}
            disabled={exporting || veiculosFiltrados.length === 0}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Download className="w-5 h-5" />
            {exporting ? 'Exportando...' : 'Exportar Excel'}
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-lg font-semibold text-blue-900">
            Total de Veículos Disponíveis: {veiculosFiltrados.length}
          </p>
          {filtroLocal && (
            <p className="text-sm text-blue-700 mt-1">
              Filtrado por: {filtroLocal}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {veiculosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-lg">Nenhum veículo disponível encontrado</p>
            {filtroLocal && (
              <button
                onClick={limparFiltro}
                className="mt-4 text-blue-600 hover:text-blue-800 underline"
              >
                Limpar filtro
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prefixo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Modelo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Local de Trabalho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ano
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {veiculosFiltrados.map((veiculo) => (
                  <tr key={veiculo.veiculo_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {veiculo.prefixo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {veiculo.placa}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {veiculo.modelo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {veiculo.local_trabalho || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {veiculo.marca}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {veiculo.ano}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {veiculo.cor || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
