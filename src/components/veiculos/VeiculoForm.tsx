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
    marca: veiculo?.marca || '',
    modelo: veiculo?.modelo || '',
    ano: veiculo?.ano || new Date().getFullYear(),
    cor: veiculo?.cor || '',
    observacoes: veiculo?.observacoes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'ano') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || new Date().getFullYear(),
      }));
    } else if (name === 'observacoes') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase(),
      }));
    }
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
            marca: '',
            modelo: '',
            ano: new Date().getFullYear(),
            cor: '',
            observacoes: '',
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
          <label htmlFor="marca" className="block text-sm font-medium text-gray-700 mb-1">
            Marca <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="marca"
            name="marca"
            value={formData.marca}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="FIAT"
          />
        </div>

        <div>
          <label htmlFor="modelo" className="block text-sm font-medium text-gray-700 mb-1">
            Modelo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="modelo"
            name="modelo"
            value={formData.modelo}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="UNO"
          />
        </div>

        <div>
          <label htmlFor="ano" className="block text-sm font-medium text-gray-700 mb-1">
            Ano <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="ano"
            name="ano"
            value={formData.ano}
            onChange={handleChange}
            required
            min="1900"
            max={new Date().getFullYear() + 1}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="2024"
          />
        </div>

        <div>
          <label htmlFor="cor" className="block text-sm font-medium text-gray-700 mb-1">
            Cor
          </label>
          <input
            type="text"
            id="cor"
            name="cor"
            value={formData.cor}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="BRANCO"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Informações adicionais sobre o veículo..."
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
