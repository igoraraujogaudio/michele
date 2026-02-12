import { listOrdensManutencao } from '@/lib/actions/ordens.actions';
import OrdensListView from '@/components/ordens/OrdensListView';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default async function OrdensPage() {
  const resultado = await listOrdensManutencao();
  const ordens = resultado.success ? resultado.data || [] : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ordens de Manutenção</h1>
          <p className="text-gray-600 mt-2">Gerencie todas as ordens de manutenção</p>
        </div>
        <Link
          href="/ordens/nova"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nova Ordem
        </Link>
      </div>

      <OrdensListView ordens={ordens} />
    </div>
  );
}
