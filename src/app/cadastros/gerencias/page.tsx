import { listGerencias } from '@/lib/actions/gerencias.actions';
import GerenciaForm from '@/components/gerencias/GerenciaForm';
import GerenciaTable from '@/components/gerencias/GerenciaTable';

export default async function GerenciasPage() {
  const resultado = await listGerencias();
  const gerencias = resultado.success ? resultado.data || [] : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Gestão de Gerências</h1>
        <p className="text-gray-600 mt-2">Cadastre e gerencie as gerências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <GerenciaForm />
        </div>
        
        <div className="lg:col-span-2">
          <GerenciaTable gerencias={gerencias} />
        </div>
      </div>
    </div>
  );
}
