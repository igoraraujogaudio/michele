'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteVeiculo } from '@/lib/actions/veiculos.actions';
import { Button } from '@/components/ui/Button';
import { Pencil, Trash2 } from 'lucide-react';
import type { VeiculoComOrdem } from '@/lib/types/database.types';

interface VeiculoTableProps {
  veiculos: VeiculoComOrdem[];
}

export default function VeiculoTable({ veiculos }: VeiculoTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(veiculos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVeiculos = veiculos.slice(startIndex, endIndex);

  const handleDelete = async (id: string, prefixo: string) => {
    if (!confirm(`Tem certeza que deseja excluir o veículo ${prefixo}?`)) {
      return;
    }

    setDeletingId(id);
    const result = await deleteVeiculo(id);
    
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Erro ao excluir veículo');
    }
    setDeletingId(null);
  };

  const getStatus = (veiculo: VeiculoComOrdem) => {
    if (!veiculo.ordem_atual) {
      return { label: 'DISPONÍVEL', color: 'bg-green-100 text-green-800' };
    }

    const status = veiculo.ordem_atual.status;
    
    if (status === 'EM MANUTENÇÃO') {
      return { label: 'EM MANUTENÇÃO', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (status === 'AGUARDANDO PEÇA') {
      return { label: 'AGUARDANDO PEÇA', color: 'bg-orange-100 text-orange-800' };
    }
    if (status === 'PRONTO') {
      return { label: 'PRONTO', color: 'bg-blue-100 text-blue-800' };
    }
    
    return { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getLocal = (veiculo: VeiculoComOrdem) => {
    if (veiculo.ordem_atual) {
      return 'OFICINA';
    }
    return veiculo.local_trabalho || 'N/A';
  };

  if (veiculos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">Nenhum veículo cadastrado</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
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
                Motorista
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Local
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentVeiculos.map((veiculo) => {
              const status = getStatus(veiculo);
              const local = getLocal(veiculo);

              return (
                <tr key={veiculo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{veiculo.prefixo}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{veiculo.placa}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{veiculo.modelo || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {veiculo.nome_motorista || '-'}
                      {veiculo.telefone_motorista && (
                        <div className="text-xs text-gray-500">{veiculo.telefone_motorista}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.color}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{local}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => router.push(`/veiculos/${veiculo.id}/edit`)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(veiculo.id, veiculo.prefixo)}
                        disabled={deletingId === veiculo.id}
                        className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Mostrando {startIndex + 1} a {Math.min(endIndex, veiculos.length)} de {veiculos.length} veículos
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
  );
}
