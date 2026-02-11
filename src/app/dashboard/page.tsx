import { createClient } from '@/lib/supabase/server'
import { VehicleService } from '@/lib/services/vehicle.service'
import { MaintenanceService } from '@/lib/services/maintenance.service'
import { Car, Wrench, Clock, CheckCircle, Package, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = await createClient()
  const vehicleService = new VehicleService(supabase)
  const maintenanceService = new MaintenanceService(supabase)

  const [
    availableVehicles,
    vehiclesInMaintenance,
    activeMaintenanceCount,
    pendingMaintenanceCount,
  ] = await Promise.all([
    vehicleService.getAvailableVehicles(),
    vehicleService.getVehiclesInMaintenance(),
    maintenanceService.getActiveMaintenanceCount(),
    maintenanceService.getPendingMaintenanceCount(),
  ])

  // Buscar todas as ordens para estatísticas
  const { data: allVehicles } = await supabase.from('veiculos').select('*')
  const totalVehicles = allVehicles?.length || 0

  // Buscar ordens recentes
  const { data: recentOrders } = await supabase
    .from('ordens_manutencao')
    .select(`
      *,
      veiculo:veiculos(*)
    `)
    .order('data_abertura', { ascending: false })
    .limit(10)

  const stats = [
    {
      title: 'Total de Veículos',
      value: totalVehicles,
      icon: Car,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      link: '/veiculos',
    },
    {
      title: 'Veículos Disponíveis',
      value: availableVehicles.length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/relatorios/disponiveis',
    },
    {
      title: 'Em Manutenção',
      value: vehiclesInMaintenance.length,
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/relatorios/em-manutencao',
    },
    {
      title: 'Ordens Abertas',
      value: activeMaintenanceCount,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/ordens',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Visão geral do sistema de controle de veículos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.link}>
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link href="/veiculos/novo" className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Novo Veículo</h3>
                <p className="text-sm text-blue-100 mt-1">Cadastrar veículo</p>
              </div>
              <Car className="h-8 w-8" />
            </div>
          </Link>

          <Link href="/ordens/nova" className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Nova Ordem</h3>
                <p className="text-sm text-green-100 mt-1">Abrir manutenção</p>
              </div>
              <Wrench className="h-8 w-8" />
            </div>
          </Link>

          <Link href="/relatorios/em-manutencao" className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 text-white hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Relatórios</h3>
                <p className="text-sm text-purple-100 mt-1">Ver relatórios</p>
              </div>
              <TrendingUp className="h-8 w-8" />
            </div>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Ordens de Manutenção Recentes</h2>
            <Link href="/ordens" className="text-sm text-blue-600 hover:text-blue-800">
              Ver todas →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordem</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veículo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Abertura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {!recentOrders || recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Nenhuma ordem cadastrada
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ordem: any) => (
                    <tr key={ordem.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {ordem.numero_ordem}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ordem.veiculo?.prefixo} - {ordem.veiculo?.placa}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          ordem.status === 'PRONTO' ? 'bg-green-100 text-green-800' :
                          ordem.status === 'EM MANUTENÇÃO' ? 'bg-blue-100 text-blue-800' :
                          ordem.status === 'AGUARDANDO PEÇA' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {ordem.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(ordem.data_abertura), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link href={`/ordens/${ordem.id}`} className="text-blue-600 hover:text-blue-800">
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
