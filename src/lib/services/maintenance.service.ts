import { SupabaseClient } from '@supabase/supabase-js'
import {
  MaintenanceOrderInput,
  UpdateMaintenanceOrderInput,
  StartMaintenanceInput,
  CompleteMaintenanceInput,
  maintenanceOrderSchema,
  updateMaintenanceOrderSchema,
  startMaintenanceSchema,
  completeMaintenanceSchema,
} from '../validations/maintenance.schema'

type MaintenanceOrder = any // Tipo genérico até regenerar database.types.ts

export class MaintenanceService {
  constructor(private supabase: SupabaseClient) {}

  async create(data: MaintenanceOrderInput, userId: string) {
    const validated = maintenanceOrderSchema.parse(data)
    
    const isOrderNumberUnique = await this.validateOrderNumberUniqueness(validated.order_number)
    if (!isOrderNumberUnique) {
      throw new Error('Número de ordem já existe')
    }

    const { data: order, error } = await this.supabase
      .from('ordens_manutencao')
      .insert({
        ...validated,
        created_by: userId,
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar ordem de manutenção: ${error.message}`)
    return order
  }

  async update(data: UpdateMaintenanceOrderInput) {
    const validated = updateMaintenanceOrderSchema.parse(data)
    const { id, ...updateData } = validated

    const { data: order, error } = await this.supabase
      .from('ordens_manutencao')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar ordem de manutenção: ${error.message}`)
    return order
  }

  async start(data: StartMaintenanceInput, userId: string) {
    const validated = startMaintenanceSchema.parse(data)
    
    const currentOrder = await this.findById(validated.id)
    if (!currentOrder) {
      throw new Error('Ordem de manutenção não encontrada')
    }

    if (currentOrder.status !== 'pending') {
      throw new Error('Apenas ordens pendentes podem ser iniciadas')
    }

    const startDate = validated.start_date || new Date().toISOString()

    const { data: order, error: orderError } = await this.supabase
      .from('ordens_manutencao')
      .update({
        status: 'in_progress',
        start_date: startDate,
      })
      .eq('id', validated.id)
      .select()
      .single()

    if (orderError) throw new Error(`Erro ao iniciar manutenção: ${orderError.message}`)

    return order
  }

  async complete(data: CompleteMaintenanceInput, userId: string) {
    const validated = completeMaintenanceSchema.parse(data)
    
    const currentOrder = await this.findById(validated.id)
    if (!currentOrder) {
      throw new Error('Ordem de manutenção não encontrada')
    }

    if (currentOrder.status !== 'in_progress') {
      throw new Error('Apenas ordens em andamento podem ser finalizadas')
    }

    if (!currentOrder.start_date) {
      throw new Error('Ordem não possui data de início')
    }

    const endDate = validated.end_date || new Date().toISOString()

    if (currentOrder.estimated_hours && validated.actual_hours > currentOrder.estimated_hours * 1.5) {
      console.warn(`Ordem ${currentOrder.order_number}: horas reais excedem 50% da estimativa`)
    }

    const { data: order, error } = await this.supabase
      .from('ordens_manutencao')
      .update({
        status: 'completed',
        actual_hours: validated.actual_hours,
        end_date: endDate,
        completed_by: userId,
        notes: validated.notes || currentOrder.notes,
      })
      .eq('id', validated.id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao finalizar manutenção: ${error.message}`)
    return order
  }

  async cancel(id: string, reason?: string) {
    const currentOrder = await this.findById(id)
    if (!currentOrder) {
      throw new Error('Ordem de manutenção não encontrada')
    }

    if (currentOrder.status === 'completed') {
      throw new Error('Não é possível cancelar ordem já finalizada')
    }

    const { data: order, error } = await this.supabase
      .from('ordens_manutencao')
      .update({
        status: 'cancelled',
        notes: reason || currentOrder.notes,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao cancelar manutenção: ${error.message}`)
    return order
  }

  async delete(id: string) {
    const currentOrder = await this.findById(id)
    if (!currentOrder) {
      throw new Error('Ordem de manutenção não encontrada')
    }

    if (currentOrder.status === 'in_progress') {
      throw new Error('Não é possível excluir ordem em andamento')
    }

    const { error } = await this.supabase
      .from('ordens_manutencao')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Erro ao excluir ordem de manutenção: ${error.message}`)
  }

  async findById(id: string): Promise<MaintenanceOrder | null> {
    const { data, error } = await this.supabase
      .from('ordens_manutencao')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  async list(filters?: {
    vehicle_id?: string
    status?: MaintenanceOrder['status']
    priority?: number
    search?: string
    limit?: number
    offset?: number
  }) {
    let query = this.supabase
      .from('ordens_manutencao')
      .select('*, veiculos(*)', { count: 'exact' })

    if (filters?.vehicle_id) {
      query = query.eq('vehicle_id', filters.vehicle_id)
    }

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.priority) {
      query = query.eq('priority', filters.priority)
    }

    if (filters?.search) {
      query = query.or(`order_number.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query.order('created_at', { ascending: false })

    if (error) throw new Error(`Erro ao listar ordens de manutenção: ${error.message}`)
    
    return { data: data || [], count: count || 0 }
  }

  async getTimeline(maintenanceOrderId: string) {
    // Busca histórico de status da ordem
    const { data, error } = await this.supabase
      .from('historico_status')
      .select('*')
      .eq('ordem_id', maintenanceOrderId)
      .order('changed_at', { ascending: true })

    if (error) throw new Error(`Erro ao buscar histórico: ${error.message}`)
    return data || []
  }

  async getPerformanceReport(filters?: {
    start_date?: string
    end_date?: string
    vehicle_id?: string
  }) {
    // Busca relatório de performance das ordens fechadas
    let query = this.supabase
      .from('ordens_manutencao')
      .select('*')
      .not('data_fechamento', 'is', null)

    if (filters?.start_date) {
      query = query.gte('data_abertura', filters.start_date)
    }

    if (filters?.end_date) {
      query = query.lte('data_fechamento', filters.end_date)
    }

    if (filters?.vehicle_id) {
      query = query.eq('veiculo_id', filters.vehicle_id)
    }

    const { data, error } = await query.order('data_abertura', { ascending: false })

    if (error) throw new Error(`Erro ao gerar relatório de performance: ${error.message}`)
    return data || []
  }

  private async validateOrderNumberUniqueness(orderNumber: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('ordens_manutencao')
      .select('id')
      .eq('numero_ordem', orderNumber)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query.limit(1)
    return (data?.length || 0) === 0
  }

  async getActiveMaintenanceCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('ordens_manutencao')
      .select('*', { count: 'exact', head: true })
      .is('data_fechamento', null)

    if (error) return 0
    return count || 0
  }

  async getPendingMaintenanceCount(): Promise<number> {
    const { count, error } = await this.supabase
      .from('ordens_manutencao')
      .select('*', { count: 'exact', head: true })
      .is('data_fechamento', null)
      .eq('status', 'EM MANUTENÇÃO')

    if (error) return 0
    return count || 0
  }
}
