import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export class ExportService {
  static exportVehiclesToExcel(vehicles: any[]) {
    const data = vehicles.map(v => ({
      'Placa': v.plate,
      'Marca': v.brand,
      'Modelo': v.model,
      'Ano': v.year,
      'Cor': v.color || '-',
      'Status': this.translateStatus(v.status),
      'Criado em': format(new Date(v.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    }))

    return this.generateExcelFile(data, 'Veículos')
  }

  static exportMaintenanceOrdersToExcel(orders: any[]) {
    const data = orders.map(o => ({
      'Número da Ordem': o.order_number,
      'Placa do Veículo': o.vehicles?.plate || '-',
      'Descrição': o.description,
      'Status': this.translateMaintenanceStatus(o.status),
      'Prioridade': o.priority,
      'Horas Estimadas': o.estimated_hours || '-',
      'Horas Reais': o.actual_hours || '-',
      'Data de Início': o.start_date ? format(new Date(o.start_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
      'Data de Término': o.end_date ? format(new Date(o.end_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
      'Criado em': format(new Date(o.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    }))

    return this.generateExcelFile(data, 'Ordens de Manutenção')
  }

  static exportVehiclesInMaintenanceToExcel(vehicles: any[]) {
    const data = vehicles.map(v => ({
      'Placa': v.plate,
      'Marca': v.brand,
      'Modelo': v.model,
      'Ano': v.year,
      'Número da Ordem': v.order_number,
      'Descrição': v.description,
      'Status': this.translateMaintenanceStatus(v.status),
      'Data de Início': v.start_date ? format(new Date(v.start_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
      'Horas Estimadas': v.estimated_hours || '-',
      'Horas em Manutenção': v.hours_in_maintenance ? v.hours_in_maintenance.toFixed(2) : '-',
    }))

    return this.generateExcelFile(data, 'Veículos em Manutenção')
  }

  static exportDowntimeSummaryToExcel(summary: any[]) {
    const data = summary.map(s => ({
      'Placa': s.plate,
      'Marca': s.brand,
      'Modelo': s.model,
      'Total de Eventos': s.total_downtime_events || 0,
      'Total de Horas Paradas': s.total_downtime_hours ? s.total_downtime_hours.toFixed(2) : '0',
      'Média de Horas Paradas': s.avg_downtime_hours ? s.avg_downtime_hours.toFixed(2) : '0',
      'Máximo de Horas Paradas': s.max_downtime_hours ? s.max_downtime_hours.toFixed(2) : '0',
    }))

    return this.generateExcelFile(data, 'Resumo de Tempo Parado')
  }

  static exportPerformanceReportToExcel(performance: any[]) {
    const data = performance.map(p => ({
      'Número da Ordem': p.order_number,
      'Placa': p.plate,
      'Descrição': p.description,
      'Status': this.translateMaintenanceStatus(p.status),
      'Horas Estimadas': p.estimated_hours || '-',
      'Horas Reais': p.actual_hours || '-',
      'Variação (%)': p.variance_percentage ? p.variance_percentage.toFixed(2) + '%' : '-',
      'Total de Horas Decorridas': p.total_elapsed_hours ? p.total_elapsed_hours.toFixed(2) : '-',
      'Data de Início': p.start_date ? format(new Date(p.start_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
      'Data de Término': p.end_date ? format(new Date(p.end_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-',
    }))

    return this.generateExcelFile(data, 'Relatório de Performance')
  }

  private static generateExcelFile(data: any[], sheetName: string): Blob {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)

    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }))
    worksheet['!cols'] = colWidths

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  }

  private static translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'available': 'Disponível',
      'in_maintenance': 'Em Manutenção',
      'unavailable': 'Indisponível',
    }
    return statusMap[status] || status
  }

  private static translateMaintenanceStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Pendente',
      'in_progress': 'Em Andamento',
      'completed': 'Concluída',
      'cancelled': 'Cancelada',
    }
    return statusMap[status] || status
  }

  static downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }
}
