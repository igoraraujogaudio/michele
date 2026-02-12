import { getVeiculo } from '@/lib/actions/veiculos.actions';
import { redirect } from 'next/navigation';
import VeiculoForm from '@/components/veiculos/VeiculoForm';

export default async function EditVeiculoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resultado = await getVeiculo(id);

  if (!resultado.success || !resultado.data) {
    redirect('/veiculos');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Editar Veículo</h1>
        <p className="text-gray-600 mt-2">Atualize as informações do veículo {resultado.data.prefixo?.nome || resultado.data.placa}</p>
      </div>

      <div className="max-w-2xl">
        <VeiculoForm veiculo={resultado.data} />
      </div>
    </div>
  );
}
