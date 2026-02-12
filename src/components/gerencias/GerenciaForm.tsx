'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createGerencia, updateGerencia } from '@/lib/actions/gerencias.actions';
import { Button } from '@/components/ui/Button';
import type { Gerencia } from '@/lib/types/database.types';

interface GerenciaFormProps {
  gerencia?: Gerencia;
  onSuccess?: () => void;
}

export default function GerenciaForm({ gerencia, onSuccess }: GerenciaFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: gerencia?.nome || '',
    descricao: gerencia?.descricao || '',
    ativo: gerencia?.ativo ?? true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      const processedValue = value.toUpperCase();
      setFormData(prev => ({
        ...prev,
        [name]: processedValue,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = gerencia
        ? await updateGerencia(gerencia.id, formData)
        : await createGerencia(formData);

      if (result.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.refresh();
        }
        
        if (!gerencia) {
          setFormData({
            nome: '',
            descricao: '',
            ativo: true,
          });
        }
      } else {
        setError(result.error || 'Erro ao salvar gerência');
      }
    } catch (err) {
      setError('Erro inesperado ao salvar gerência');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {gerencia ? 'Editar Gerência' : 'Cadastrar Nova Gerência'}
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="NOME DA GERÊNCIA"
          />
        </div>

        <div>
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            id="descricao"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="DESCRIÇÃO DA GERÊNCIA"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="ativo"
            name="ativo"
            checked={formData.ativo}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="ativo" className="ml-2 block text-sm text-gray-700">
            Ativo
          </label>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <Button type="submit" loading={loading} className="flex-1">
          {gerencia ? 'Atualizar Gerência' : 'Cadastrar Gerência'}
        </Button>
        {gerencia && (
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
