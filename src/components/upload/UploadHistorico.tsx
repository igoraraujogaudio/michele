'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadHistorico, type UploadHistoricoResult } from '@/lib/actions/upload-historico.actions';
import { Button } from '@/components/ui/Button';
import { Upload, FileText, CheckCircle, XCircle, Info } from 'lucide-react';

export default function UploadHistorico() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadHistoricoResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await uploadHistorico(file);
      
      if (response.success && response.data) {
        setResult(response.data);
        router.refresh();
      } else {
        setError(response.error || 'Erro ao fazer upload');
      }
    } catch (err) {
      setError('Erro inesperado ao processar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const file = files.find(f => 
      f.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      f.type === 'application/vnd.ms-excel' ||
      f.name.endsWith('.xlsx') ||
      f.name.endsWith('.xls')
    );

    if (file) {
      handleUpload(file);
    } else {
      setError('Por favor, envie um arquivo Excel (.xlsx ou .xls)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Upload de Histórico de Manutenção</h2>
          <p className="text-gray-600 mt-1">Importe histórico de manutenção em massa via Excel</p>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">
            Arraste um arquivo Excel aqui ou clique para selecionar
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Formatos aceitos: .xlsx, .xls
          </p>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload-historico"
          />
          <label
            htmlFor="file-upload-historico"
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Selecionar Arquivo
          </label>
        </div>

        {loading && (
          <div className="text-center py-4 mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Processando histórico...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-green-900 font-semibold">Upload concluído!</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-3">
              <div>
                <p><strong>Total de registros:</strong> {result.total}</p>
                <p><strong>Ordens criadas:</strong> {result.detalhes.ordensCriadas}</p>
              </div>
              <div>
                <p><strong>Veículos criados:</strong> {result.detalhes.veiculosCriados}</p>
                <p><strong>Prefixos criados:</strong> {result.detalhes.prefixosCriados}</p>
                <p><strong>Locais criados:</strong> {result.detalhes.locaisCriados}</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold text-gray-900 mb-2">Erros encontrados ({result.errors.length}):</h4>
                <ul className="text-sm text-red-600 space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.slice(0, 20).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {result.errors.length > 20 && (
                    <li className="text-gray-600">... e mais {result.errors.length - 20} erros</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          <FileText className="w-5 h-5 inline mr-2" />
          Formato do Arquivo
        </h3>
        <p className="text-blue-800 mb-4">
          O arquivo Excel deve conter as seguintes colunas:
        </p>
        <div className="bg-white rounded border border-blue-200 p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Coluna</th>
                <th className="text-left py-2">Obrigatório</th>
                <th className="text-left py-2">Descrição</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">ENTRADA</td>
                <td className="py-2">Não</td>
                <td className="py-2">Data de entrada (DD/MM/AAAA)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">PREFIXO</td>
                <td className="py-2">Sim</td>
                <td className="py-2">Prefixo do veículo</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">PLACA</td>
                <td className="py-2">Sim</td>
                <td className="py-2">Placa do veículo</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">MODELO</td>
                <td className="py-2">Não</td>
                <td className="py-2">Modelo do veículo</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">BASE</td>
                <td className="py-2">Sim</td>
                <td className="py-2">Local de trabalho</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">DEFEITO</td>
                <td className="py-2">Não</td>
                <td className="py-2">Tipo de defeito</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">MOTIVO</td>
                <td className="py-2">Não</td>
                <td className="py-2">Descrição do motivo</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">STATUS2</td>
                <td className="py-2">Não</td>
                <td className="py-2">Status da ordem</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">DATA DE LIBERAÇÃO NA OFICINA</td>
                <td className="py-2">Não</td>
                <td className="py-2">Data de fechamento (DD/MM/AAAA)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">PREFIXO DO RESERVA</td>
                <td className="py-2">Não</td>
                <td className="py-2">Prefixo do veículo substituto</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">OBSERVAÇÃO</td>
                <td className="py-2">Não</td>
                <td className="py-2">Observações adicionais</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-blue-900 text-sm flex items-start gap-2">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Importante:</strong> Veículos, prefixos e locais de trabalho que não existirem 
              serão criados automaticamente durante a importação. O sistema irá mapear os status 
              do Excel para os status do sistema automaticamente.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
