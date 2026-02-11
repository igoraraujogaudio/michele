'use server';

import { createClient } from '@/lib/supabase/server';
import { veiculoSchema, updateVeiculoSchema } from '@/lib/validations/schemas';
import type { ApiResponse, Veiculo, CreateVeiculoDTO, UpdateVeiculoDTO } from '@/lib/types/database.types';
import { revalidatePath } from 'next/cache';

export async function createVeiculo(data: CreateVeiculoDTO): Promise<ApiResponse<Veiculo>> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[createVeiculo] auth debug:', { userEmail: user?.email, authError: authError?.message, authCode: authError?.status });
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const validatedData = veiculoSchema.parse(data);

    const { prefixo, placa } = validatedData;
    const { data: existingPrefixo } = await supabase
      .from('veiculos')
      .select('id')
      .eq('prefixo', prefixo)
      .single();

    if (existingPrefixo) {
      return { success: false, error: `Prefixo ${prefixo} já está cadastrado` };
    }

    const { data: existingPlaca } = await supabase
      .from('veiculos')
      .select('id')
      .eq('placa', placa)
      .single();

    if (existingPlaca) {
      return { success: false, error: `Placa ${placa} já está cadastrada` };
    }

    const { data: veiculo, error } = await supabase
      .from('veiculos')
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar veículo:', error);
      return { success: false, error: 'Erro ao criar veículo' };
    }

    revalidatePath('/veiculos');
    return { success: true, data: veiculo, message: 'Veículo criado com sucesso' };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao criar veículo' };
  }
}

export async function updateVeiculo(id: string, data: UpdateVeiculoDTO): Promise<ApiResponse<Veiculo>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const validatedData = updateVeiculoSchema.parse(data);

    if (validatedData.prefixo) {
      const { data: existingPrefixo } = await supabase
        .from('veiculos')
        .select('id')
        .eq('prefixo', validatedData.prefixo)
        .neq('id', id)
        .single();

      if (existingPrefixo) {
        return { success: false, error: `Prefixo ${validatedData.prefixo} já está cadastrado` };
      }
    }

    if (validatedData.placa) {
      const { data: existingPlaca } = await supabase
        .from('veiculos')
        .select('id')
        .eq('placa', validatedData.placa)
        .neq('id', id)
        .single();

      if (existingPlaca) {
        return { success: false, error: `Placa ${validatedData.placa} já está cadastrada` };
      }
    }

    const { data: veiculo, error } = await supabase
      .from('veiculos')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar veículo:', error);
      return { success: false, error: 'Erro ao atualizar veículo' };
    }

    if (!veiculo) {
      return { success: false, error: 'Veículo não encontrado' };
    }

    revalidatePath('/veiculos');
    revalidatePath(`/veiculos/${id}`);
    return { success: true, data: veiculo, message: 'Veículo atualizado com sucesso' };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao atualizar veículo' };
  }
}

export async function deleteVeiculo(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: ordensAbertas } = await supabase
      .from('ordens_manutencao')
      .select('id')
      .eq('veiculo_id', id)
      .is('data_fechamento', null);

    if (ordensAbertas && ordensAbertas.length > 0) {
      return { 
        success: false, 
        error: 'Não é possível excluir veículo com ordem de manutenção aberta' 
      };
    }

    const { error } = await supabase
      .from('veiculos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar veículo:', error);
      return { success: false, error: 'Erro ao deletar veículo' };
    }

    revalidatePath('/veiculos');
    return { success: true, message: 'Veículo excluído com sucesso' };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao deletar veículo' };
  }
}

export async function getVeiculo(id: string): Promise<ApiResponse<Veiculo>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: veiculo, error } = await supabase
      .from('veiculos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !veiculo) {
      return { success: false, error: 'Veículo não encontrado' };
    }

    return { success: true, data: veiculo };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao buscar veículo' };
  }
}

export async function listVeiculos(): Promise<ApiResponse<Veiculo[]>> {
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
      console.error('Erro ao listar veículos:', error);
      return { success: false, error: 'Erro ao listar veículos' };
    }

    return { success: true, data: veiculos || [] };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao listar veículos' };
  }
}

export async function listVeiculosDisponiveis(): Promise<ApiResponse<Veiculo[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: veiculosComOrdem } = await supabase
      .from('ordens_manutencao')
      .select('veiculo_id')
      .is('data_fechamento', null);

    const veiculosEmManutencaoIds = veiculosComOrdem?.map((o: any) => o.veiculo_id) || [];

    const { data: veiculos, error } = await supabase
      .from('veiculos')
      .select('*')
      .not('id', 'in', `(${veiculosEmManutencaoIds.join(',')})`)
      .order('prefixo', { ascending: true });

    if (error) {
      console.error('Erro ao listar veículos disponíveis:', error);
      return { success: false, error: 'Erro ao listar veículos disponíveis' };
    }

    return { success: true, data: veiculos || [] };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao listar veículos disponíveis' };
  }
}

export async function listPrefixosAtivos(): Promise<ApiResponse<any[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data, error } = await supabase
      .from('prefixos')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao listar prefixos:', error);
      return { success: false, error: 'Erro ao listar prefixos' };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao listar prefixos' };
  }
}

export async function listLocaisTrabalhoAtivos(): Promise<ApiResponse<any[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data, error } = await supabase
      .from('locais_trabalho')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao listar locais de trabalho:', error);
      return { success: false, error: 'Erro ao listar locais de trabalho' };
    }

    return { success: true, data: data || [] };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao listar locais de trabalho' };
  }
}
