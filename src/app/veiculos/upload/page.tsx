import UploadVeiculos from '@/components/upload/UploadVeiculos';
import Link from 'next/link';

export default function UploadVeiculosPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Link
            href="/veiculos"
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            ← Voltar para Veículos
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Upload de Veículos</h1>
        <p className="text-gray-600 mt-2">Faça upload em massa de veículos via Excel</p>
      </div>

      <UploadVeiculos />
    </div>
  );
}
