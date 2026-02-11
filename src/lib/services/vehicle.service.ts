import { SupabaseClient } from '@supabase/supabase-js'
import { VehicleInput, UpdateVehicleInput, vehicleSchema, updateVehicleSchema } from '../validations/vehicle.schema'

type Vehicle = any // Tipo genérico até regenerar database.types.ts

export class VehicleService {
  constructor(private supabase: SupabaseClient) {}

  async create(data: VehicleInput, userId: string) {
    const validated = vehicleSchema.parse(data)
    
    const { data: vehicle, error } = await this.supabase
      .from('veiculos')
      .insert({
        ...validated,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar veículo: ${error.message}`)
    return vehicle
  }

  async update(id: string, data: UpdateVehicleInput) {
    const validated = updateVehicleSchema.parse(data)
    
    const { data: vehicle, error } = await this.supabase
      .from('veiculos')
      .update(validated)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar veículo: ${error.message}`)
    return vehicle
  }

  async delete(id: string) {
    const hasActiveMaintenance = await this.hasActiveMaintenance(id)
    if (hasActiveMaintenance) {
      throw new Error('Não é possível excluir veículo com manutenção ativa')
    }

    const { error } = await this.supabase
      .from('veiculos')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Erro ao deletar veículo: ${error.message}`)
  }

  async findById(id: string): Promise<Vehicle | null> {
    const { data, error } = await this.supabase
      .from('veiculos')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  async findByPlate(plate: string): Promise<Vehicle | null> {
    const { data, error } = await this.supabase
      .from('veiculos')
      .select('*')
      .eq('plate', plate)
      .single()

    if (error) return null
    return data
  }

  async list(filters?: {
    status?: Vehicle['status']
    search?: string
    limit?: number
    offset?: number
  }) {
    let query = this.supabase
      .from('veiculos')
      .select('*', { count: 'exact' })

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.search) {
      query = query.or(`plate.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query.order('created_at', { ascending: false })

    if (error) throw new Error(`Erro ao listar veículos: ${error.message}`)
    
    return { data: data || [], count: count || 0 }
  }

  async getAvailableVehicles() {
    // Busca todos os veículos
    const { data: allVehicles, error: vehiclesError } = await this.supabase
      .from('veiculos')
      .select('*')
      .order('created_at', { ascending: false })

    if (vehiclesError) throw new Error(`Erro ao buscar veículos: ${vehiclesError.message}`)

    // Busca veículos com ordens abertas
    const { data: ordensAbertas, error: ordensError } = await this.supabase
      .from('ordens_manutencao')
      .select('veiculo_id')
      .is('data_fechamento', null)

    if (ordensError) throw new Error(`Erro ao buscar ordens: ${ordensError.message}`)

    // Filtra veículos que não têm ordem aberta
    const veiculosComOrdemAberta = new Set(ordensAbertas?.map(o => o.veiculo_id) || [])
    const veiculosDisponiveis = allVehicles?.filter(v => !veiculosComOrdemAberta.has(v.id)) || []

    return veiculosDisponiveis
  }

  async getVehiclesInMaintenance() {
    // Busca veículos que têm ordens de manutenção abertas
    const { data, error } = await this.supabase
      .from('ordens_manutencao')
      .select(`
        *,
        veiculo:veiculos!ordens_manutencao_veiculo_id_fkey(*)
      `)
      .is('data_fechamento', null)
      .order('data_abertura', { ascending: true })

    if (error) throw new Error(`Erro ao buscar veículos em manutenção: ${error.message}`)
    return data || []
  }

  async getDowntimeSummary(vehicleId?: string) {
    // Busca resumo de tempo parado das ordens fechadas
    let query = this.supabase
      .from('ordens_manutencao')
      .select(`
        veiculo_id,
        tempo_parado_minutos,
        data_abertura,
        data_fechamento
      `)
      .not('data_fechamento', 'is', null)

    if (vehicleId) {
      query = query.eq('veiculo_id', vehicleId)
    }

    const { data, error } = await query

    if (error) throw new Error(`Erro ao buscar resumo de tempo parado: ${error.message}`)
    return data || []
  }

  private async hasActiveMaintenance(vehicleId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('ordens_manutencao')
      .select('id')
      .eq('veiculo_id', vehicleId)
      .is('data_fechamento', null)
      .limit(1)

    return !error && (data?.length || 0) > 0
  }

  async validatePlateUniqueness(plate: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('veiculos')
      .select('id')
      .eq('plate', plate)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query.limit(1)
    return (data?.length || 0) === 0
  }
}
