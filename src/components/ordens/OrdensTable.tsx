'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Eye } from 'lucide-react';
import type { OrdemComVeiculo } from '@/lib/types/database.types';

interface OrdensTableProps {
  ordens: OrdemComVeiculo[];
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os Status' },
  { value: 'AGUARDANDO PEÇA', label: 'Aguardando Peça' },
  { value: 'EM MANUTENÇÃO', label: 'Em Manutenção' },
  { value: 'PRONTO', label: 'Pronto' },
  { value: 'REPARO PARCIAL', label: 'Reparo Parcial' },
];

export default function OrdensTable({ ordens }: OrdensTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrdens = useMemo(() => {
    return ordens.filter((ordem) => {
      const matchesSearch = 
        ordem.numero_ordem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ordem.veiculo?.prefixo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ordem.veiculo?.placa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ordem.descricao?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || ordem.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [ordens, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRONTO':
        return 'bg-green-100 text-green-800';
      case 'EM MANUTENÇÃO':
        return 'bg-blue-100 text-blue-800';
      case 'AGUARDANDO PEÇA':
        return 'bg-yellow-100 text-yellow-800';
      case 'REPARO PARCIAL':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por número, veículo, placa ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full md:w-64">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Mostrando {filteredOrdens.length} de {ordens.length} ordens
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número Ordem
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Veículo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data Abertura
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredOrdens.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Nenhuma ordem encontrada com os filtros aplicados'
                    : 'Nenhuma ordem cadastrada'}
                </td>
              </tr>
            ) : (
              filteredOrdens.map((ordem) => (
                <tr key={ordem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {ordem.numero_ordem}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ordem.veiculo?.prefixo} - {ordem.veiculo?.placa}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {ordem.descricao}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ordem.status)}`}>
                      {ordem.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(ordem.data_abertura), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/ordens/${ordem.id}`}
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Ver detalhes
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
