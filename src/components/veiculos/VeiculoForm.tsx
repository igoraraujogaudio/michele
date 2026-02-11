'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createVeiculo, updateVeiculo } from '@/lib/actions/veiculos.actions';
import { Button } from '@/components/ui/Button';
import type { Veiculo } from '@/lib/types/database.types';

interface VeiculoFormProps {
  veiculo?: Veiculo;
  onSuccess?: () => void;
}

export default function VeiculoForm({ veiculo, onSuccess }: VeiculoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    prefixo: veiculo?.prefixo || '',
    placa: veiculo?.placa || '',
    modelo: veiculo?.modelo || '',
    local_trabalho: veiculo?.local_trabalho || '',
    nome_motorista: veiculo?.nome_motorista || '',
    telefone_motorista: veiculo?.telefone_motorista || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Todos os campos devem ser em CAIXA ALTA
    setFormData(prev => ({
      ...prev,
      [name]: value.toUpperCase(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = veiculo
        ? await updateVeiculo(veiculo.id, formData)
        : await createVeiculo(formData);

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
        
        if (!veiculo) {
          setFormData({
            prefixo: '',
            placa: '',
            modelo: '',
            local_trabalho: '',
            nome_motorista: '',
            telefone_motorista: '',
          });
        }
      } else {
        setError(result.error || 'Erro ao salvar veículo');
      }
    } catch (err) {
      setError('Erro inesperado ao salvar veículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {veiculo ? 'Editar Veículo' : 'Cadastrar Novo Veículo'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="prefixo" className="block text-sm font-medium text-gray-700 mb-1">
            Prefixo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="prefixo"
            name="prefixo"
            value={formData.prefixo}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="V001"
          />
        </div>

        <div>
          <label htmlFor="placa" className="block text-sm font-medium text-gray-700 mb-1">
            Placa <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="placa"
            name="placa"
            value={formData.placa}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="ABC1234"
          />
        </div>

        <div>
          <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-1">
            Modelo
          </label>
          <input
            type="text"
            id="modelo"
            name="modelo"
            value={formData.modelo}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="FIAT UNO"
          />
        </div>

        <div>
          <label htmlFor="local_trabalho" className="block text-sm font-medium text-gray-700 mb-1">
            Local de Trabalho <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="local_trabalho"
            name="local_trabalho"
            value={formData.local_trabalho}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="SEDE"
          />
        </div>

        <div>
          <label htmlFor="nome_motorista" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Motorista
          </label>
          <input
            type="text"
            id="nome_motorista"
            name="nome_motorista"
            value={formData.nome_motorista}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="JOÃO DA SILVA"
          />
        </div>

        <div>
          <label htmlFor="telefone_motorista" className="block text-sm font-medium text-gray-700 mb-1">
            Telefone do Motorista
          </label>
          <input
            type="text"
            id="telefone_motorista"
            name="telefone_motorista"
            value={formData.telefone_motorista}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="(11) 98765-4321"
          />
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button type="submit" loading={loading} className="flex-1">
          {veiculo ? 'Atualizar Veículo' : 'Cadastrar Veículo'}
        </Button>
        {veiculo && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}
