'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createOrdemManutencao } from '@/lib/actions/ordens.actions';
import { Button } from '@/components/ui/Button';
import type { Veiculo, StatusOrdem } from '@/lib/types/database.types';

interface NovaOrdemFormProps {
  veiculosDisponiveis: Veiculo[];
}

const STATUS_OPTIONS: StatusOrdem[] = [
  'EM MANUTENÇÃO',
  'AGUARDANDO PEÇA',
  'REPARO PARCIAL',
  'PRONTO',
  'FORNECEDOR EXTERNO',
  'PARADO PRONTO CJ',
  'PARADO PRONTO CG',
  'PARADO EM MANUTENÇÃO CJ',
  'PARADO EM MANUTENÇÃO CG',
];

export default function NovaOrdemForm({ veiculosDisponiveis }: NovaOrdemFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<Veiculo | null>(null);
  const [reservaDesignada, setReservaDesignada] = useState(false);
  
  const [formData, setFormData] = useState({
    numero_ordem: '',
    veiculo_id: '',
    status: 'EM MANUTENÇÃO' as StatusOrdem,
    descricao: '',
    observacoes: '',
    is_reserva: false,
    nome_motorista: '',
    telefone_motorista: '',
  });

  useEffect(() => {
    if (formData.veiculo_id) {
      const veiculo = veiculosDisponiveis.find(v => v.id === formData.veiculo_id);
      setVeiculoSelecionado(veiculo || null);
    } else {
      setVeiculoSelecionado(null);
    }
  }, [formData.veiculo_id, veiculosDisponiveis]);

  const veiculosReserva = veiculosDisponiveis.filter(v => v.id !== formData.veiculo_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const dataToSubmit = {
        ...formData,
        is_reserva: reservaDesignada,
      };

      const result = await createOrdemManutencao(dataToSubmit);

      if (result.success) {
        router.push('/ordens');
        router.refresh();
      } else {
        setError(result.error || 'Erro ao criar ordem de manutenção');
      }
    } catch (err) {
      setError('Erro inesperado ao criar ordem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações da Ordem</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="numero_ordem" className="block text-sm font-medium text-gray-700 mb-1">
              Número da Ordem <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="numero_ordem"
              value={formData.numero_ordem}
              onChange={(e) => setFormData(prev => ({ ...prev, numero_ordem: e.target.value.toUpperCase() }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
              placeholder="OM-001"
            />
          </div>

          <div>
            <label htmlFor="veiculo_id" className="block text-sm font-medium text-gray-700 mb-1">
              Veículo <span className="text-red-500">*</span>
            </label>
            <select
              id="veiculo_id"
              value={formData.veiculo_id}
              onChange={(e) => setFormData(prev => ({ ...prev, veiculo_id: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um veículo</option>
              {veiculosDisponiveis.map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.prefixo} - {veiculo.placa} {veiculo.modelo ? `(${veiculo.modelo})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as StatusOrdem }))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="nome_motorista" className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Motorista
            </label>
            <input
              type="text"
              id="nome_motorista"
              value={formData.nome_motorista}
              onChange={(e) => setFormData(prev => ({ ...prev, nome_motorista: e.target.value.toUpperCase() }))}
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
              value={formData.telefone_motorista}
              onChange={(e) => setFormData(prev => ({ ...prev, telefone_motorista: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(11) 98765-4321"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição do Problema <span className="text-red-500">*</span>
          </label>
          <textarea
            id="descricao"
            value={formData.descricao}
            onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
            required
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Descreva o problema do veículo..."
          />
        </div>

        <div className="mt-4">
          <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <textarea
            id="observacoes"
            value={formData.observacoes}
            onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Informações adicionais..."
          />
        </div>
      </div>

      {veiculoSelecionado && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-md font-semibold text-blue-900 mb-3">Informações do Veículo Selecionado</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-blue-600 font-medium">Prefixo</p>
              <p className="text-blue-900 font-semibold">{veiculoSelecionado.prefixo}</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Placa</p>
              <p className="text-blue-900 font-semibold">{veiculoSelecionado.placa}</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Modelo</p>
              <p className="text-blue-900 font-semibold">{veiculoSelecionado.modelo || 'N/A'}</p>
            </div>
            <div>
              <p className="text-blue-600 font-medium">Local de Trabalho</p>
              <p className="text-blue-900 font-semibold">{veiculoSelecionado.local_trabalho}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Veículo Reserva</h2>
        
        <div className="mb-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={reservaDesignada}
              onChange={(e) => {
                setReservaDesignada(e.target.checked);
                if (!e.target.checked) {
                  setFormData(prev => ({ ...prev, is_reserva: false }));
                }
              }}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Designar veículo reserva</span>
          </label>
        </div>

        {reservaDesignada && (
          <div>
            <label htmlFor="veiculo_reserva" className="block text-sm font-medium text-gray-700 mb-1">
              Veículo Reserva <span className="text-red-500">*</span>
            </label>
            <select
              id="veiculo_reserva"
              required={reservaDesignada}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um veículo reserva</option>
              {veiculosReserva.map((veiculo) => (
                <option key={veiculo.id} value={veiculo.id}>
                  {veiculo.prefixo} - {veiculo.placa} {veiculo.modelo ? `(${veiculo.modelo})` : ''}
                </option>
              ))}
            </select>
            {veiculosReserva.length === 0 && (
              <p className="mt-2 text-sm text-orange-600">
                Nenhum veículo disponível para reserva
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={loading} className="flex-1">
          Abrir Ordem de Manutenção
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          className="flex-1"
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
