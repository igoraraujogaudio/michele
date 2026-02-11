import { listVeiculosDisponiveis } from '@/lib/actions/veiculos.actions';
import NovaOrdemForm from '@/components/ordens/NovaOrdemForm';

export default async function NovaOrdemPage() {
  const resultado = await listVeiculosDisponiveis();
  const veiculosDisponiveis = resultado.success ? resultado.data || [] : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Nova Ordem de Manutenção</h1>
        <p className="text-gray-600 mt-2">Abra uma nova ordem de manutenção para um veículo</p>
      </div>

      {veiculosDisponiveis.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Nenhum veículo disponível</h3>
          <p className="text-yellow-700">
            Não há veículos disponíveis para abrir ordem de manutenção. 
            Todos os veículos já possuem ordens abertas ou não há veículos cadastrados.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl">
          <NovaOrdemForm veiculosDisponiveis={veiculosDisponiveis} />
        </div>
      )}
    </div>
  );
}
