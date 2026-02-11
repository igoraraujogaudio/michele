import { listVeiculos } from '@/lib/actions/veiculos.actions';
import { createClient } from '@/lib/supabase/server';
import VeiculoForm from '@/components/veiculos/VeiculoForm';
import VeiculoTable from '@/components/veiculos/VeiculoTable';
import Link from 'next/link';
import { Upload } from 'lucide-react';
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Veículos</h1>
            <p className="text-gray-600 mt-2">Cadastre e gerencie os veículos da frota</p>
          </div>
          <Link
            href="/veiculos/upload"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload em Massa
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <VeiculoForm />
        </div>
        
        <div className="lg:col-span-2">
          <VeiculoTable veiculos={veiculosComOrdem} />
        </div>
      </div>
    </div>
  );
}
