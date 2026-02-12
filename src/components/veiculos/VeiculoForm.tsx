'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createVeiculo, updateVeiculo, listLocaisTrabalhoAtivos } from '@/lib/actions/veiculos.actions';
import { listGerenciasAtivas } from '@/lib/actions/gerencias.actions';
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
  const [semPlaca, setSemPlaca] = useState(false);
  const [formData, setFormData] = useState({
    prefixo: veiculo?.prefixo?.nome || '',
    placa: veiculo?.placa || '',
    modelo: veiculo?.modelo || '',
    local_trabalho_id: veiculo?.local_trabalho_id || '',
    gerencia_id: veiculo?.gerencia_id || '',
    nome_motorista: veiculo?.nome_motorista || '',
    telefone_motorista: veiculo?.telefone_motorista || '',
  });

  const [locais, setLocais] = useState<any[]>([]);
  const [gerencias, setGerencias] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const locaisResult = await listLocaisTrabalhoAtivos();
      const gerenciasResult = await listGerenciasAtivas();
      
      if (locaisResult.success) setLocais(locaisResult.data || []);
      if (gerenciasResult.success) setGerencias(gerenciasResult.data || []);
    };
    
    loadData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Campos text devem ser em CAIXA ALTA
    if (e.target instanceof HTMLInputElement) {
      let processedValue = value.toUpperCase();
      
      // Formatação automática de placa (ABC-1234 ou ABC1D23) - APENAS se não for "sem placa"
      if (name === 'placa' && !semPlaca) {
        // Remove caracteres não alfanuméricos
        processedValue = processedValue.replace(/[^A-Z0-9]/g, '');
        
        // Adiciona hífen automaticamente
        if (processedValue.length >= 4) {
          // Formato antigo: ABC1234 -> ABC-1234
          if (processedValue.length <= 7 && /^[A-Z]{3}[0-9]{4}$/.test(processedValue)) {
            processedValue = processedValue.slice(0, 3) + '-' + processedValue.slice(3);
          }
          // Formato novo: ABC1D23 -> ABC1D23 (sem hífen)
          else if (processedValue.length === 7 && /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(processedValue)) {
            // Mantém sem hífen para formato novo
          }
          // Formato mercosul: ABC1D23 -> ABC1D-23
          else if (processedValue.length === 7 && /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(processedValue)) {
            processedValue = processedValue.slice(0, 5) + '-' + processedValue.slice(5);
          }
          // Adiciona hífen após 3 caracteres para outros casos
          else if (processedValue.length > 3) {
            processedValue = processedValue.slice(0, 3) + '-' + processedValue.slice(3, 7);
          }
        }
      }
      
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: processedValue,
        };
        
        // Se mudou o prefixo e está marcado "sem placa", sincroniza a placa
        if (name === 'prefixo' && semPlaca) {
          newData.placa = processedValue;
        }
        
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSemPlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setSemPlaca(checked);
    
    if (checked) {
      // Se marcar "sem placa", copia o prefixo para a placa
      setFormData(prev => ({
        ...prev,
        placa: prev.prefixo,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validação de formato de placa no front-end (apenas se não for "sem placa")
      if (!semPlaca && formData.placa) {
        const placaRegex = /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/;
        if (!placaRegex.test(formData.placa)) {
          setError('Formato de placa inválido. Use ABC-1234 ou ABC1D34. Para veículos sem placa, marque a opção "Veículo sem placa".');
          setLoading(false);
          return;
        }
      }

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
            local_trabalho_id: '',
            gerencia_id: '',
            nome_motorista: '',
            telefone_motorista: '',
          });
          setSemPlaca(false);
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
            placeholder="VAN-01"
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
            disabled={semPlaca}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase ${
              semPlaca ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            placeholder={semPlaca ? 'Prefixo será usado como placa' : 'ABC-1234'}
          />
          <div className="mt-2 flex items-center">
            <input
              type="checkbox"
              id="semPlaca"
              checked={semPlaca}
              onChange={handleSemPlacaChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="semPlaca" className="ml-2 text-sm text-gray-600">
              Veículo sem placa (usar prefixo como identificador)
            </label>
          </div>
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
            Local de Trabalho
          </label>
          <select
            id="local_trabalho_id"
            name="local_trabalho_id"
            value={formData.local_trabalho_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione um local (opcional)</option>
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
          <label htmlFor="gerencia_id" className="block text-sm font-medium text-gray-700 mb-1">
            Gerência
          </label>
          <select
            id="gerencia_id"
            name="gerencia_id"
            value={formData.gerencia_id}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Selecione uma gerência (opcional)</option>
            {gerencias.map((gerencia) => (
              <option key={gerencia.id} value={gerencia.id}>
                {gerencia.nome}
              </option>
            ))}
          </select>
          {gerencias.length === 0 && (
            <p className="mt-1 text-xs text-orange-600">
              Nenhuma gerência cadastrada. <a href="/cadastros/gerencias" className="text-blue-600 hover:underline">Cadastrar gerências</a>
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
