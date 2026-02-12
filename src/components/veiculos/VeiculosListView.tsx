'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, Download, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import VeiculoForm from '@/components/veiculos/VeiculoForm';
import VeiculoTable from '@/components/veiculos/VeiculoTable';
import { Button } from '@/components/ui/Button';
import { exportVeiculosToExcel } from '@/lib/utils/export-veiculos';
import type { VeiculoComOrdem } from '@/lib/types/database.types';
import Link from 'next/link';

interface VeiculosListViewProps {
  veiculos: VeiculoComOrdem[];
}

export default function VeiculosListView({ veiculos }: VeiculosListViewProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [localFilter, setLocalFilter] = useState<string>('all');

  // Filtrar veículos
  const veiculosFiltrados = useMemo(() => {
    return veiculos.filter((veiculo) => {
      const matchesSearch = 
        veiculo.prefixo?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        veiculo.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        veiculo.nome_motorista?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || veiculo.status === statusFilter;
      
      const matchesLocal = localFilter === 'all' || 
        (veiculo.ordem_atual ? 'OFICINA' : veiculo.local_trabalho?.nome) === localFilter;

      return matchesSearch && matchesStatus && matchesLocal;
    });
  }, [veiculos, searchTerm, statusFilter, localFilter]);

  // Obter opções únicas para filtros
  const statusOptions = useMemo(() => {
    const statuses = new Set(veiculos.map(v => v.status));
    return Array.from(statuses);
  }, [veiculos]);

  const localOptions = useMemo(() => {
    const locais = new Set(
      veiculos.map(v => v.ordem_atual ? 'OFICINA' : v.local_trabalho?.nome || 'N/A')
    );
    return Array.from(locais);
  }, [veiculos]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  const handleExportExcel = () => {
    exportVeiculosToExcel(veiculosFiltrados, 'veiculos.xlsx');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Veículos</h1>
            <p className="text-gray-600 mt-2">
              {veiculosFiltrados.length} veículo{veiculosFiltrados.length !== 1 ? 's' : ''} encontrado{veiculosFiltrados.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/veiculos/upload"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload em Massa
            </Link>
            <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Cadastrar Veículo
            </Button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar por prefixo, placa, modelo ou motorista..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filtro Status */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Local */}
            <div>
              <select
                value={localFilter}
                onChange={(e) => setLocalFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os Locais</option>
                {localOptions.map((local) => (
                  <option key={local} value={local}>
                    {local}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botão Exportar */}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleExportExcel}
              variant="secondary"
              className="flex items-center gap-2"
              disabled={veiculosFiltrados.length === 0}
            >
              <Download className="w-4 h-4" />
              Exportar para Excel ({veiculosFiltrados.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <VeiculoTable veiculos={veiculosFiltrados} />

      {/* Modal de Cadastro */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title="Cadastrar Novo Veículo"
        size="lg"
      >
        <VeiculoForm onSuccess={handleModalClose} />
      </Modal>
    </div>
  );
}
