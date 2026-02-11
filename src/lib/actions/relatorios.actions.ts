'use server';

import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/lib/types/database.types';
import type { 
  VeiculoEmManutencao, 
  VeiculoDisponivel,
  FiltrosVeiculosEmManutencao,
  FiltrosVeiculosDisponiveis
} from '@/lib/types/relatorios.types';

export async function getVeiculosEmManutencao(
  filtros?: FiltrosVeiculosEmManutencao
): Promise<ApiResponse<VeiculoEmManutencao[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    let query = supabase
      .from('vw_veiculos_em_manutencao')
      .select('*');

    if (filtros?.status) {
      query = query.eq('status', filtros.status);
    }

    if (filtros?.nivel_alerta !== undefined) {
      query = query.eq('nivel_alerta', filtros.nivel_alerta);
    }

    if (filtros?.is_reserva !== undefined) {
      query = query.eq('is_reserva', filtros.is_reserva);
    }

    query = query.order('tempo_parado_atual_minutos', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar veículos em manutenção:', error);
      return { success: false, error: 'Erro ao buscar veículos em manutenção' };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao buscar veículos em manutenção' };
  }
}

export async function getVeiculosDisponiveis(
  filtros?: FiltrosVeiculosDisponiveis
): Promise<ApiResponse<VeiculoDisponivel[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    let query = supabase
      .from('vw_veiculos_disponiveis')
      .select('*');

    if (filtros?.marca) {
      query = query.ilike('marca', `%${filtros.marca}%`);
    }

    if (filtros?.modelo) {
      query = query.ilike('modelo', `%${filtros.modelo}%`);
    }

    if (filtros?.ano_min) {
      query = query.gte('ano', filtros.ano_min);
    }

    if (filtros?.ano_max) {
      query = query.lte('ano', filtros.ano_max);
    }

    query = query.order('prefixo', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar veículos disponíveis:', error);
      return { success: false, error: 'Erro ao buscar veículos disponíveis' };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao buscar veículos disponíveis' };
  }
}

export async function getEstatisticasGerais(): Promise<ApiResponse<{
  total_veiculos: number;
  veiculos_em_manutencao: number;
  veiculos_disponiveis: number;
  veiculos_alerta: number;
  veiculos_urgente: number;
  tempo_medio_manutencao: number;
}>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const [
      { count: total_veiculos },
      { data: em_manutencao },
      { data: disponiveis },
    ] = await Promise.all([
      supabase.from('veiculos').select('*', { count: 'exact', head: true }),
      supabase.from('vw_veiculos_em_manutencao').select('*'),
      supabase.from('vw_veiculos_disponiveis').select('*'),
    ]);

    const veiculos_em_manutencao = em_manutencao?.length || 0;
    const veiculos_disponiveis = disponiveis?.length || 0;
    
    const veiculos_alerta = em_manutencao?.filter((v: any) => v.nivel_alerta === 1).length || 0;
    const veiculos_urgente = em_manutencao?.filter((v: any) => v.nivel_alerta === 2).length || 0;

    const tempo_medio_manutencao = em_manutencao && em_manutencao.length > 0
      ? em_manutencao.reduce((acc: number, v: any) => acc + (v.tempo_parado_atual_minutos || 0), 0) / em_manutencao.length
      : 0;

    return {
      success: true,
      data: {
        total_veiculos: total_veiculos || 0,
        veiculos_em_manutencao,
        veiculos_disponiveis,
        veiculos_alerta,
        veiculos_urgente,
        tempo_medio_manutencao: Math.round(tempo_medio_manutencao),
      },
    };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao buscar estatísticas' };
  }
}
