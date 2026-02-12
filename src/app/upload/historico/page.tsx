import UploadHistorico from '@/components/upload/UploadHistorico';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function UploadHistoricoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/ordens"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Ordens
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Importar Histórico de Manutenção
        </h1>
        <p className="text-gray-600 mt-2">
          Importe registros históricos de manutenção em massa
        </p>
      </div>

      <UploadHistorico />
    </div>
  );
}
