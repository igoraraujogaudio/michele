'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadPrefixos, type UploadResult } from '@/lib/actions/upload.actions';
import { gerarTemplatePrefixos } from '@/lib/utils/excel-templates';
import { Button } from '@/components/ui/Button';
import { Upload, Download, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function UploadPrefixos() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await uploadPrefixos(file);
      
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
      f.name.endsWith('.xls') ||
      f.name.endsWith('.csv')
    );

    if (file) {
      handleUpload(file);
    } else {
      setError('Por favor, envie um arquivo Excel (.xlsx, .xls ou .csv)');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const downloadTemplate = () => {
    const buffer = gerarTemplatePrefixos();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_prefixos.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upload de Prefixos</h2>
            <p className="text-gray-600 mt-1">Faça upload em massa de prefixos via Excel</p>
          </div>
          <Button onClick={downloadTemplate} variant="secondary" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Baixar Template
          </Button>
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
            Formatos aceitos: .xlsx, .xls, .csv
          </p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Selecionar Arquivo
          </label>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Processando arquivo...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-green-900 font-semibold">Upload concluído!</h3>
            </div>
            <div className="text-sm text-gray-700">
              <p>Total de registros: {result.total}</p>
              <p>Registros inseridos: {result.success}</p>
              <p>Erros: {result.errors.length}</p>
            </div>
            {result.errors.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold text-gray-900 mb-2">Erros encontrados:</h4>
                <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
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
                <th className="text-left py-2">Exemplo</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2">NOME</td>
                <td className="py-2">Sim</td>
                <td className="py-2">V001</td>
              </tr>
              <tr className="border-b">
                <td className="py-2">DESCRIÇÃO</td>
                <td className="py-2">Não</td>
                <td className="py-2">Prefixo padrão</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-blue-700 text-sm mt-3">
          Dica: Use nomes em CAIXA ALTA. O sistema converterá automaticamente.
        </p>
      </div>
    </div>
  );
}
