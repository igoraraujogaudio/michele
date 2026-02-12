'use server';

import { createClient } from '@/lib/supabase/server';
import { gerenciaSchema, updateGerenciaSchema } from '@/lib/validations/schemas';
import type { ApiResponse, Gerencia, CreateGerenciaDTO, UpdateGerenciaDTO } from '@/lib/types/database.types';
import { revalidatePath } from 'next/cache';

export async function createGerencia(data: CreateGerenciaDTO): Promise<ApiResponse<Gerencia>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const validatedData = gerenciaSchema.parse(data);

    const { nome } = validatedData;
    const { data: existingNome } = await supabase
      .from('gerencias')
      .select('id')
      .eq('nome', nome)
      .single();

    if (existingNome) {
      return { success: false, error: `Gerência ${nome} já está cadastrada` };
    }

    const { data: gerencia, error } = await supabase
      .from('gerencias')
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar gerência:', error);
      return { success: false, error: 'Erro ao criar gerência' };
    }

    revalidatePath('/cadastros/gerencias');
    return { success: true, data: gerencia, message: 'Gerência criada com sucesso' };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao criar gerência' };
  }
}

export async function updateGerencia(id: string, data: UpdateGerenciaDTO): Promise<ApiResponse<Gerencia>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const validatedData = updateGerenciaSchema.parse(data);

    if (validatedData.nome) {
      const { data: existingNome } = await supabase
        .from('gerencias')
        .select('id')
        .eq('nome', validatedData.nome)
        .neq('id', id)
        .single();

      if (existingNome) {
        return { success: false, error: `Gerência ${validatedData.nome} já está cadastrada` };
      }
    }

    const { data: gerencia, error } = await supabase
      .from('gerencias')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar gerência:', error);
      return { success: false, error: 'Erro ao atualizar gerência' };
    }

    if (!gerencia) {
      return { success: false, error: 'Gerência não encontrada' };
    }

    revalidatePath('/cadastros/gerencias');
    revalidatePath(`/cadastros/gerencias/${id}`);
    return { success: true, data: gerencia, message: 'Gerência atualizada com sucesso' };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao atualizar gerência' };
  }
}

export async function deleteGerencia(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: veiculosVinculados } = await supabase
      .from('veiculos')
      .select('id')
      .eq('gerencia_id', id);

    if (veiculosVinculados && veiculosVinculados.length > 0) {
      return { 
        success: false, 
        error: 'Não é possível excluir gerência com veículos vinculados' 
      };
    }

    const { error } = await supabase
      .from('gerencias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar gerência:', error);
      return { success: false, error: 'Erro ao deletar gerência' };
    }

    revalidatePath('/cadastros/gerencias');
    return { success: true, message: 'Gerência excluída com sucesso' };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao deletar gerência' };
  }
}

export async function getGerencia(id: string): Promise<ApiResponse<Gerencia>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: gerencia, error } = await supabase
      .from('gerencias')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !gerencia) {
      return { success: false, error: 'Gerência não encontrada' };
    }

    return { success: true, data: gerencia };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao buscar gerência' };
  }
}

export async function listGerencias(): Promise<ApiResponse<Gerencia[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: gerencias, error } = await supabase
      .from('gerencias')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao listar gerências:', error);
      return { success: false, error: 'Erro ao listar gerências' };
    }

    return { success: true, data: gerencias || [] };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao listar gerências' };
  }
}

export async function listGerenciasAtivas(): Promise<ApiResponse<Gerencia[]>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    const { data: gerencias, error } = await supabase
      .from('gerencias')
      .select('*')
      .eq('ativo', true)
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao listar gerências ativas:', error);
      return { success: false, error: 'Erro ao listar gerências ativas' };
    }

    return { success: true, data: gerencias || [] };

  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Erro desconhecido ao listar gerências ativas' };
  }
}
