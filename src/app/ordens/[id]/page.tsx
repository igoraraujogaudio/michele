import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OrdemDetail from '@/components/ordens/OrdemDetail';
import type { OrdemComVeiculo } from '@/lib/types/database.types';

export default async function OrdemPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: ordem, error } = await supabase
    .from('ordens_manutencao')
    .select(`
      *,
      veiculo:veiculos(*)
    `)
    .eq('id', params.id)
    .single();

  if (error || !ordem) {
    redirect('/ordens');
  }

  const ordemComVeiculo = ordem as unknown as OrdemComVeiculo;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Detalhes da Ordem</h1>
        <p className="text-gray-600 mt-2">Visualize e gerencie a ordem de manutenção</p>
      </div>

      <OrdemDetail ordem={ordemComVeiculo} />
    </div>
  );
}
