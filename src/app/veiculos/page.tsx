import { listVeiculos } from '@/lib/actions/veiculos.actions';
import { createClient } from '@/lib/supabase/server';
import VeiculosListView from '@/components/veiculos/VeiculosListView';
import type { VeiculoComOrdem } from '@/lib/types/database.types';

export default async function VeiculosPage() {
  const supabase = await createClient();
  
  const resultado = await listVeiculos();
  const veiculos = resultado.success ? resultado.data || [] : [];

  const veiculosComOrdem: VeiculoComOrdem[] = await Promise.all(
    veiculos.map(async (veiculo) => {
      const { data: ordem } = await supabase
        .from('ordens_manutencao')
        .select('*')
        .eq('veiculo_id', veiculo.id)
        .is('data_fechamento', null)
        .single();

      return {
        ...veiculo,
        ordem_atual: ordem || undefined,
      };
    })
  );

  return <VeiculosListView veiculos={veiculosComOrdem} />;
}
