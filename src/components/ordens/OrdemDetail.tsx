'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrdemManutencao, updateOrdemStatus } from '@/lib/actions/ordens.actions';
import { Button } from '@/components/ui/Button';
import { Clock, Edit2, Save, X } from 'lucide-react';
import type { OrdemComVeiculo, StatusOrdem } from '@/lib/types/database.types';

interface OrdemDetailProps {
  ordem: OrdemComVeiculo;
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

const STATUS_ENCERRAMENTO: StatusOrdem[] = [
  'PRONTO',
  'REPARO PARCIAL',
  'PARADO PRONTO CJ',
  'PARADO PRONTO CG',
];

export default function OrdemDetail({ ordem: ordemInicial }: OrdemDetailProps) {
  const router = useRouter();
  const [ordem, setOrdem] = useState(ordemInicial);
  const [tempoAtual, setTempoAtual] = useState(0);
  const [editandoTempo, setEditandoTempo] = useState(false);
  const [tempoManual, setTempoManual] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [novoStatus, setNovoStatus] = useState(ordem.status);
  const [observacao, setObservacao] = useState(ordem.observacoes || '');

  const ordemEncerrada = !!ordem.data_fechamento;

  useEffect(() => {
    if (ordemEncerrada && ordem.tempo_parado_minutos) {
      setTempoAtual(ordem.tempo_parado_minutos);
      return;
    }

    if (!ordemEncerrada) {
      const calcularTempo = () => {
        const inicio = new Date(ordem.data_abertura);
        const agora = new Date();
        const diffMs = agora.getTime() - inicio.getTime();
        const minutos = Math.floor(diffMs / 60000);
        setTempoAtual(minutos);
      };

      calcularTempo();
      const interval = setInterval(calcularTempo, 60000);

      return () => clearInterval(interval);
    }
  }, [ordem.data_abertura, ordem.tempo_parado_minutos, ordemEncerrada]);

  const formatarTempo = (minutos: number) => {
    const dias = Math.floor(minutos / 1440);
    const horas = Math.floor((minutos % 1440) / 60);
    const mins = minutos % 60;

    const partes = [];
    if (dias > 0) partes.push(`${dias}d`);
    if (horas > 0) partes.push(`${horas}h`);
    if (mins > 0 || partes.length === 0) partes.push(`${mins}m`);

    return partes.join(' ');
  };

  const handleSalvarTempoManual = async () => {
    setLoading(true);
    setError(null);

    try {
      const minutos = parseInt(tempoManual);
      if (isNaN(minutos) || minutos < 0) {
        setError('Tempo inválido');
        setLoading(false);
        return;
      }

      const result = await updateOrdemManutencao(ordem.id, {
        tempo_parado_minutos: minutos,
        tempo_editado_manualmente: true,
      });

      if (result.success && result.data) {
        setOrdem(prev => ({ ...prev, ...result.data }));
        setTempoAtual(minutos);
        setEditandoTempo(false);
        router.refresh();
      } else {
        setError(result.error || 'Erro ao salvar tempo');
      }
    } catch (err) {
      setError('Erro inesperado ao salvar tempo');
    } finally {
      setLoading(false);
    }
  };

  const handleAtualizarStatus = async () => {
    if (novoStatus === ordem.status) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await updateOrdemStatus(ordem.id, novoStatus, observacao);

      if (result.success && result.data) {
        setOrdem(prev => ({ ...prev, ...result.data }));
        router.refresh();
      } else {
        setError(result.error || 'Erro ao atualizar status');
      }
    } catch (err) {
      setError('Erro inesperado ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarObservacao = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateOrdemManutencao(ordem.id, {
        observacoes: observacao,
      });

      if (result.success && result.data) {
        setOrdem(prev => ({ ...prev, ...result.data }));
        router.refresh();
      } else {
        setError(result.error || 'Erro ao salvar observação');
      }
    } catch (err) {
      setError('Erro inesperado ao salvar observação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {ordemEncerrada && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium">
            ✓ Ordem encerrada em {new Date(ordem.data_fechamento!).toLocaleString('pt-BR')}
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ordem #{ordem.numero_ordem}</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Dados do Veículo</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Prefixo:</span>
                <span className="ml-2 text-sm font-semibold text-gray-900">{ordem.veiculo.prefixo}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Placa:</span>
                <span className="ml-2 text-sm font-semibold text-gray-900">{ordem.veiculo.placa}</span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Modelo:</span>
                <span className="ml-2 text-sm font-semibold text-gray-900">
                  {ordem.veiculo.modelo || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Local de Trabalho:</span>
                <span className="ml-2 text-sm font-semibold text-gray-900">{ordem.veiculo.local_trabalho}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Informações da Ordem</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Data Abertura:</span>
                <span className="ml-2 text-sm font-semibold text-gray-900">
                  {new Date(ordem.data_abertura).toLocaleString('pt-BR')}
                </span>
              </div>
              {ordem.nome_motorista && (
                <div>
                  <span className="text-sm text-gray-600">Motorista:</span>
                  <span className="ml-2 text-sm font-semibold text-gray-900">{ordem.nome_motorista}</span>
                </div>
              )}
              {ordem.telefone_motorista && (
                <div>
                  <span className="text-sm text-gray-600">Telefone:</span>
                  <span className="ml-2 text-sm font-semibold text-gray-900">{ordem.telefone_motorista}</span>
                </div>
              )}
              {ordem.is_reserva && (
                <div>
                  <span className="text-sm text-gray-600">Reserva:</span>
                  <span className="ml-2 text-sm font-semibold text-green-600">Sim</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Tempo Parado</h3>
            {!editandoTempo && (
              <button
                onClick={() => {
                  setEditandoTempo(true);
                  setTempoManual(tempoAtual.toString());
                }}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                <Edit2 className="w-4 h-4" />
                Editar manualmente
              </button>
            )}
          </div>

          {editandoTempo ? (
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={tempoManual}
                onChange={(e) => setTempoManual(e.target.value)}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Minutos"
              />
              <span className="text-sm text-gray-600">minutos</span>
              <Button
                onClick={handleSalvarTempoManual}
                loading={loading}
                className="px-3 py-1 text-sm"
              >
                <Save className="w-4 h-4 mr-1" />
                Salvar
              </Button>
              <button
                onClick={() => setEditandoTempo(false)}
                className="text-gray-600 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{formatarTempo(tempoAtual)}</span>
              {ordem.tempo_editado_manualmente && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Editado manualmente
                </span>
              )}
              {!ordemEncerrada && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded animate-pulse">
                  Em andamento
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status e Observações</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status Atual
            </label>
            <select
              id="status"
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as StatusOrdem)}
              disabled={ordemEncerrada || loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {STATUS_ENCERRAMENTO.includes(novoStatus) && novoStatus !== ordem.status && (
              <p className="mt-2 text-sm text-orange-600">
                ⚠️ Ao salvar este status, a ordem será encerrada automaticamente
              </p>
            )}
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição do Problema
            </label>
            <textarea
              id="descricao"
              value={ordem.descricao}
              disabled
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
          </div>

          <div>
            <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              id="observacoes"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              disabled={loading}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Adicione observações sobre a manutenção..."
            />
          </div>

          <div className="flex gap-3">
            {novoStatus !== ordem.status && (
              <Button
                onClick={handleAtualizarStatus}
                loading={loading}
                disabled={ordemEncerrada}
              >
                Atualizar Status
              </Button>
            )}
            {observacao !== (ordem.observacoes || '') && (
              <Button
                onClick={handleSalvarObservacao}
                loading={loading}
                variant="secondary"
              >
                Salvar Observações
              </Button>
            )}
            <Button
              onClick={() => router.push('/ordens')}
              variant="secondary"
            >
              Voltar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
