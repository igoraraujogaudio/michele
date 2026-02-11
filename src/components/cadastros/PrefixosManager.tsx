'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPrefixo, updatePrefixo, deletePrefixo, type Prefixo } from '@/lib/actions/cadastros.actions';
import { Button } from '@/components/ui/Button';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

interface PrefixosManagerProps {
  prefixos: Prefixo[];
}

export default function PrefixosManager({ prefixos }: PrefixosManagerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
  });

  const [editData, setEditData] = useState({
    nome: '',
    descricao: '',
    ativo: true,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createPrefixo(formData.nome, formData.descricao);

    if (result.success) {
      setFormData({ nome: '', descricao: '' });
      setShowForm(false);
      router.refresh();
    } else {
      setError(result.error || 'Erro ao criar prefixo');
    }

    setLoading(false);
  };

  const handleUpdate = async (id: string) => {
    setLoading(true);
    setError(null);

    const result = await updatePrefixo(id, editData.nome, editData.descricao, editData.ativo);

    if (result.success) {
      setEditingId(null);
      router.refresh();
    } else {
      setError(result.error || 'Erro ao atualizar prefixo');
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este prefixo?')) return;

    setLoading(true);
    setError(null);

    const result = await deletePrefixo(id);

    if (result.success) {
      router.refresh();
    } else {
      setError(result.error || 'Erro ao excluir prefixo');
    }

    setLoading(false);
  };

  const startEdit = (prefixo: Prefixo) => {
    setEditingId(prefixo.id);
    setEditData({
      nome: prefixo.nome,
      descricao: prefixo.descricao || '',
      ativo: prefixo.ativo,
    });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Prefixos Cadastrados</h2>
          <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Prefixo
          </Button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Prefixo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  placeholder="V001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  placeholder="DESCRIÇÃO DO PREFIXO"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" loading={loading}>
                Salvar
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prefixos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Nenhum prefixo cadastrado
                  </td>
                </tr>
              ) : (
                prefixos.map((prefixo) => (
                  <tr key={prefixo.id} className="hover:bg-gray-50">
                    {editingId === prefixo.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editData.nome}
                            onChange={(e) => setEditData(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded uppercase"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editData.descricao}
                            onChange={(e) => setEditData(prev => ({ ...prev, descricao: e.target.value.toUpperCase() }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded uppercase"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={editData.ativo ? 'true' : 'false'}
                            onChange={(e) => setEditData(prev => ({ ...prev, ativo: e.target.value === 'true' }))}
                            className="px-2 py-1 border border-gray-300 rounded"
                          >
                            <option value="true">Ativo</option>
                            <option value="false">Inativo</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdate(prefixo.id)}
                              disabled={loading}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {prefixo.nome}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {prefixo.descricao || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            prefixo.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {prefixo.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(prefixo)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(prefixo.id)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
