import { listLocaisTrabalho } from '@/lib/actions/cadastros.actions';
import LocaisManager from '@/components/cadastros/LocaisManager';
import UploadLocais from '@/components/upload/UploadLocais';

export default async function LocaisPage() {
  const resultado = await listLocaisTrabalho();
  const locais = resultado.success ? resultado.data || [] : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Cadastro de Locais de Trabalho</h1>
        <p className="text-gray-600 mt-2">Gerencie os locais de trabalho disponíveis para os veículos</p>
      </div>

      <div className="space-y-8">
        <LocaisManager locais={locais} />
        <UploadLocais />
      </div>
    </div>
  );
}
