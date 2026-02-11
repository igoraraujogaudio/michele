import { listPrefixos } from '@/lib/actions/cadastros.actions';
import PrefixosManager from '@/components/cadastros/PrefixosManager';
import UploadPrefixos from '@/components/upload/UploadPrefixos';

export default async function PrefixosPage() {
  const resultado = await listPrefixos();
  const prefixos = resultado.success ? resultado.data || [] : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cadastro de Prefixos</h1>
        <p className="text-gray-600 mt-2">Gerencie os prefixos disponíveis para os veículos</p>
      </div>

      <div className="space-y-8">
        <PrefixosManager prefixos={prefixos} />
        <UploadPrefixos />
      </div>
    </div>
  );
}
