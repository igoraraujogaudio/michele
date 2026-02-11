'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createVeiculo, updateVeiculo, listPrefixosAtivos, listLocaisTrabalhoAtivos } from '@/lib/actions/veiculos.actions';
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
    prefixo_id: veiculo?.prefixo_id || '',
    placa: veiculo?.placa || '',
    modelo: veiculo?.modelo || '',
    local_trabalho_id: veiculo?.local_trabalho_id || '',
    nome_motorista: veiculo?.nome_motorista || '',
    telefone_motorista: veiculo?.telefone_motorista || '',
  });

  const [prefixos, setPrefixos] = useState<any[]>([]);
  const [locais, setLocais] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const prefixosResult = await listPrefixosAtivos();
      const locaisResult = await listLocaisTrabalhoAtivos();
      
      if (prefixosResult.success) setPrefixos(prefixosResult.data || []);
      if (locaisResult.success) setLocais(locaisResult.data || []);
    };
    
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Campos text devem ser em CAIXA ALTA
    if (e.target instanceof HTMLInputElement) {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase(),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
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
            prefixo_id: '',
            placa: '',
            modelo: '',
            local_trabalho_id: '',
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
          <label htmlFor="prefixo_id" className="block text-sm font-medium text-gray-700 mb-1">
            Prefixo <span className="text-red-500">*</span>
          </label>
          <select
            id="prefixo_id"
            name="prefixo_id"
            value={formData.prefixo_id}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um prefixo</option>
            {prefixos.map((prefixo) => (
              <option key={prefixo.id} value={prefixo.id}>
                {prefixo.nome}
              </option>
            ))}
          </select>
          {prefixos.length === 0 && (
            <p className="mt-1 text-xs text-orange-600">
              Nenhum prefixo cadastrado. <a href="/cadastros/prefixos" className="text-blue-600 hover:underline">Cadastrar prefixos</a>
            </p>
          )}
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
          <label htmlFor="local_trabalho_id" className="block text-sm font-medium text-gray-700 mb-1">
            Local de Trabalho <span className="text-red-500">*</span>
          </label>
          <select
            id="local_trabalho_id"
            name="local_trabalho_id"
            value={formData.local_trabalho_id}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um local de trabalho</option>
            {locais.map((local) => (
              <option key={local.id} value={local.id}>
                {local.nome}
              </option>
            ))}
          </select>
          {locais.length === 0 && (
            <p className="mt-1 text-xs text-orange-600">
              Nenhum local cadastrado. <a href="/cadastros/locais" className="text-blue-600 hover:underline">Cadastrar locais</a>
            </p>
          )}
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
