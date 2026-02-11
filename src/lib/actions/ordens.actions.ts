'use server';

import { createClient } from '@/lib/supabase/server';
import { ordemManutencaoSchema, updateOrdemSchema } from '@/lib/validations/schemas';
import type { 
  ApiResponse, 
  OrdemManutencao, 
  CreateOrdemDTO, 
  UpdateOrdemDTO,
  OrdemComVeiculo,
  StatusOrdem 
} from '@/lib/types/database.types';
import { revalidatePath } from 'next/cache';

export async function createOrdemManutencao(data: CreateOrdemDTO): Promise<ApiResponse<OrdemManutencao>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const validatedData = ordemManutencaoSchema.parse(data);

    const { data: veiculo } = await supabase
      .from('veiculos')
      .select('id, prefixo')
      .eq('id', validatedData.veiculo_id)
      .single();

    if (!veiculo) {
      return { success: false, error: 'Veículo não encontrado' };
    }

    const { data: ordemExistente } = await supabase
      .from('ordens_manutencao')
      .select('id, numero_ordem')
      .eq('numero_ordem', validatedData.numero_ordem)
      .single();

    if (ordemExistente) {
      return { 
        success: false, 
        error: `Número de ordem ${validatedData.numero_ordem} já existe` 
      };
    }

    const { data: ordemAberta } = await supabase
      .from('ordens_manutencao')
      .select('id, numero_ordem')
      .eq('veiculo_id', validatedData.veiculo_id)
      .is('data_fechamento', null)
      .single();

    if (ordemAberta) {
      return { 
        success: false, 
        error: `Veículo ${veiculo.prefixo} já possui ordem aberta (${ordemAberta.numero_ordem})` 
      };
    }

    const { data: ordem, error } = await supabase
      .from('ordens_manutencao')
      .insert({
        ...validatedData,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar ordem:', error);
      return { success: false, error: 'Erro ao criar ordem de manutenção' };
    }

    revalidatePath('/ordens');
    revalidatePath('/veiculos');
    return { success: true, data: ordem, message: 'Ordem de manutenção criada com sucesso' };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao criar ordem' };
  }
}

export async function updateOrdemStatus(
  id: string, 
  status: StatusOrdem, 
  observacao?: string
): Promise<ApiResponse<OrdemManutencao>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: ordemAtual } = await supabase
      .from('ordens_manutencao')
      .select('*')
      .eq('id', id)
      .single();

    if (!ordemAtual) {
      return { success: false, error: 'Ordem não encontrada' };
    }

    if (ordemAtual.data_fechamento && status !== 'PRONTO' && status !== 'REPARO PARCIAL') {
      return { 
        success: false, 
        error: 'Ordem já foi encerrada. Não é possível alterar o status.' 
      };
    }

    const updateData: any = { status };

    if (status === 'PRONTO' || status === 'REPARO PARCIAL') {
      if (!ordemAtual.data_fechamento) {
        updateData.data_fechamento = new Date().toISOString();
      }
    } else {
      if (ordemAtual.status === 'PRONTO' || ordemAtual.status === 'REPARO PARCIAL') {
        updateData.data_fechamento = null;
        updateData.tempo_parado_minutos = null;
      }
    }

    const { data: ordem, error } = await supabase
      .from('ordens_manutencao')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar status:', error);
      return { success: false, error: 'Erro ao atualizar status da ordem' };
    }

    if (observacao) {
      await supabase
        .from('historico_status')
        .update({ observacao: observacao.toUpperCase() })
        .eq('ordem_id', id)
        .eq('status_novo', status)
        .order('data_mudanca', { ascending: false })
        .limit(1);
    }

    revalidatePath('/ordens');
    revalidatePath(`/ordens/${id}`);
    revalidatePath('/veiculos');
    
    return { success: true, data: ordem, message: 'Status atualizado com sucesso' };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao atualizar status' };
  }
}

export async function updateOrdemManutencao(
  id: string, 
  data: UpdateOrdemDTO
): Promise<ApiResponse<OrdemManutencao>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const validatedData = updateOrdemSchema.parse(data);

    if (Object.keys(validatedData).length === 0) {
      return { success: false, error: 'Nenhum dado para atualizar' };
    }

    if (validatedData.status) {
      return updateOrdemStatus(id, validatedData.status);
    }

    const { data: ordem, error } = await supabase
      .from('ordens_manutencao')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar ordem:', error);
      return { success: false, error: 'Erro ao atualizar ordem' };
    }

    if (!ordem) {
      return { success: false, error: 'Ordem não encontrada' };
    }

    revalidatePath('/ordens');
    revalidatePath(`/ordens/${id}`);
    return { success: true, data: ordem, message: 'Ordem atualizada com sucesso' };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao atualizar ordem' };
  }
}

export async function deleteOrdemManutencao(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { error } = await supabase
      .from('ordens_manutencao')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar ordem:', error);
      return { success: false, error: 'Erro ao deletar ordem' };
    }

    revalidatePath('/ordens');
    revalidatePath('/veiculos');
    return { success: true, message: 'Ordem excluída com sucesso' };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao deletar ordem' };
  }
}

export async function getOrdemManutencao(id: string): Promise<ApiResponse<OrdemComVeiculo>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: ordem, error } = await supabase
      .from('ordens_manutencao')
      .select(`
        *,
        veiculo:veiculos!ordens_manutencao_veiculo_id_fkey(*),
        veiculo_reserva:veiculos!ordens_manutencao_veiculo_reserva_id_fkey(*)
      `)
      .eq('id', id)
      .single();

    if (error || !ordem) {
      return { success: false, error: 'Ordem não encontrada' };
    }

    return { success: true, data: ordem as any };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao buscar ordem' };
  }
}

export async function listOrdensManutencao(): Promise<ApiResponse<OrdemComVeiculo[]>> {
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
      .order('data_abertura', { ascending: false });

    if (error) {
      console.error('Erro ao listar ordens:', error);
      return { success: false, error: 'Erro ao listar ordens' };
    }

    return { success: true, data: (ordens || []) as any };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao listar ordens' };
  }
}

export async function listVeiculosEmManutencao(): Promise<ApiResponse<OrdemComVeiculo[]>> {
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
      console.error('Erro ao listar veículos em manutenção:', error);
      return { success: false, error: 'Erro ao listar veículos em manutenção' };
    }

    return { success: true, data: (ordens || []) as any };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao listar veículos em manutenção' };
  }
}

export async function getHistoricoOrdem(ordemId: string): Promise<ApiResponse<any[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: historico, error } = await supabase
      .from('historico_status')
      .select('*')
      .eq('ordem_id', ordemId)
      .order('data_mudanca', { ascending: true });

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return { success: false, error: 'Erro ao buscar histórico' };
    }

    return { success: true, data: historico || [] };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao buscar histórico' };
  }
}
