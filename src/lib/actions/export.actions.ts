'use server';

import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function exportVeiculosToExcel(): Promise<{ success: boolean; data?: Buffer; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: veiculos, error } = await supabase
      .from('veiculos')
      .select('*')
      .order('prefixo', { ascending: true });

    if (error) {
      console.error('Erro ao buscar veículos:', error);
      return { success: false, error: 'Erro ao buscar veículos' };
    }

    const dados = veiculos.map((v: any) => ({
      'Prefixo': v.prefixo,
      'Placa': v.placa,
      'Marca': v.marca,
      'Modelo': v.modelo,
      'Ano': v.ano,
      'Cor': v.cor || '',
      'Observações': v.observacoes || '',
      'Cadastrado em': format(new Date(v.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Veículos');

    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
      { wch: 8 },
      { wch: 15 },
      { wch: 40 },
      { wch: 18 },
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return { success: true, data: buffer };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao exportar veículos' };
  }
}

export async function exportOrdensToExcel(): Promise<{ success: boolean; data?: Buffer; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: ordens, error } = await supabase
      .from('ordens_manutencao')
      .select(`
        *,
        veiculo:veiculos(prefixo, placa, marca, modelo)
      `)
      .order('data_abertura', { ascending: false });

    if (error) {
      console.error('Erro ao buscar ordens:', error);
      return { success: false, error: 'Erro ao buscar ordens' };
    }

    const dados = ordens.map((o: any) => ({
      'Número Ordem': o.numero_ordem,
      'Prefixo': o.veiculo?.prefixo || '',
      'Placa': o.veiculo?.placa || '',
      'Marca/Modelo': `${o.veiculo?.marca || ''} ${o.veiculo?.modelo || ''}`.trim(),
      'Status': o.status,
      'Descrição': o.descricao,
      'Data Abertura': format(new Date(o.data_abertura), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      'Data Fechamento': o.data_fechamento 
        ? format(new Date(o.data_fechamento), 'dd/MM/yyyy HH:mm', { locale: ptBR })
        : '',
      'Tempo Parado (min)': o.tempo_parado_minutos || '',
      'Tempo Parado (h)': o.tempo_parado_minutos 
        ? (o.tempo_parado_minutos / 60).toFixed(2)
        : '',
      'Observações': o.observacoes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ordens de Manutenção');

    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 25 },
      { wch: 25 },
      { wch: 40 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 40 },
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return { success: true, data: buffer };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao exportar ordens' };
  }
}

export async function exportVeiculosEmManutencaoToExcel(): Promise<{ success: boolean; data?: Buffer; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: ordens, error } = await supabase
      .from('ordens_manutencao')
      .select(`
        *,
        veiculo:veiculos!ordens_manutencao_veiculo_id_fkey(*),
        veiculo_reserva:veiculos!ordens_manutencao_veiculo_reserva_id_fkey(*)
      `)
      .is('data_fechamento', null)
      .order('data_abertura', { ascending: true });

    if (error) {
      console.error('Erro ao buscar veículos em manutenção:', error);
      return { success: false, error: 'Erro ao buscar veículos em manutenção' };
    }

    const agora = new Date();

    const dados = ordens.map((o: any) => {
      const dataAbertura = new Date(o.data_abertura);
      const tempoParadoMinutos = Math.floor((agora.getTime() - dataAbertura.getTime()) / 1000 / 60);
      const tempoParadoHoras = (tempoParadoMinutos / 60).toFixed(2);

      return {
        'Prefixo': o.veiculo?.prefixo || '',
        'Placa': o.veiculo?.placa || '',
        'Marca': o.veiculo?.marca || '',
        'Modelo': o.veiculo?.modelo || '',
        'Número Ordem': o.numero_ordem,
        'Status': o.status,
        'Descrição': o.descricao,
        'Data Abertura': format(dataAbertura, 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        'Tempo Parado (min)': tempoParadoMinutos,
        'Tempo Parado (h)': tempoParadoHoras,
        'Observações': o.observacoes || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Veículos em Manutenção');

    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 25 },
      { wch: 40 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 40 },
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return { success: true, data: buffer };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao exportar veículos em manutenção' };
  }
}

export async function exportVeiculosDisponiveisToExcel(filtroLocal?: string): Promise<{ success: boolean; data?: Buffer; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    let query = supabase
      .from('vw_veiculos_disponiveis')
      .select('*')
      .order('prefixo', { ascending: true });

    if (filtroLocal) {
      query = query.eq('local_trabalho', filtroLocal);
    }

    const { data: veiculos, error } = await query;

    if (error) {
      console.error('Erro ao buscar veículos disponíveis:', error);
      return { success: false, error: 'Erro ao buscar veículos disponíveis' };
    }

    const dados = veiculos.map((v: any) => ({
      'Prefixo': v.prefixo,
      'Placa': v.placa,
      'Modelo': v.modelo,
      'Local de Trabalho': v.local_trabalho || '',
      'Marca': v.marca,
      'Ano': v.ano,
      'Cor': v.cor || '',
      'Status': 'DISPONÍVEL',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dados);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Veículos Disponíveis');

    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 12 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 8 },
      { wch: 15 },
      { wch: 15 },
    ];

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return { success: true, data: buffer };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao exportar veículos disponíveis' };
  }
}
