'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface Prefixo {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalTrabalho {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// PREFIXOS
// ============================================================================

export async function listPrefixos(): Promise<ApiResponse<Prefixo[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const { data, error } = await supabase
      .from('prefixos')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao listar prefixos:', error);
      return { success: false, error: 'Erro ao listar prefixos' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: 'Erro desconhecido' };
  }
}

export async function createPrefixo(nome: string, descricao?: string): Promise<ApiResponse<Prefixo>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const { data, error } = await supabase
      .from('prefixos')
      .insert({ nome: nome.toUpperCase().trim(), descricao: descricao?.toUpperCase().trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Prefixo já cadastrado' };
      }
      console.error('Erro ao criar prefixo:', error);
      return { success: false, error: 'Erro ao criar prefixo' };
    }

    revalidatePath('/cadastros/prefixos');
    return { success: true, data, message: 'Prefixo criado com sucesso' };
  } catch (error) {
    return { success: false, error: 'Erro desconhecido' };
  }
}

export async function updatePrefixo(id: string, nome: string, descricao?: string, ativo?: boolean): Promise<ApiResponse<Prefixo>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const updateData: any = { nome: nome.toUpperCase().trim() };
    if (descricao !== undefined) updateData.descricao = descricao?.toUpperCase().trim();
    if (ativo !== undefined) updateData.ativo = ativo;

    const { data, error } = await supabase
      .from('prefixos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Prefixo já cadastrado' };
      }
      console.error('Erro ao atualizar prefixo:', error);
      return { success: false, error: 'Erro ao atualizar prefixo' };
    }

    revalidatePath('/cadastros/prefixos');
    return { success: true, data, message: 'Prefixo atualizado com sucesso' };
  } catch (error) {
    return { success: false, error: 'Erro desconhecido' };
  }
}

export async function deletePrefixo(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const { error } = await supabase
      .from('prefixos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar prefixo:', error);
      return { success: false, error: 'Erro ao deletar prefixo' };
    }

    revalidatePath('/cadastros/prefixos');
    return { success: true, message: 'Prefixo excluído com sucesso' };
  } catch (error) {
    return { success: false, error: 'Erro desconhecido' };
  }
}

// ============================================================================
// LOCAIS DE TRABALHO
// ============================================================================

export async function listLocaisTrabalho(): Promise<ApiResponse<LocalTrabalho[]>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const { data, error } = await supabase
      .from('locais_trabalho')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao listar locais:', error);
      return { success: false, error: 'Erro ao listar locais de trabalho' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    return { success: false, error: 'Erro desconhecido' };
  }
}

export async function createLocalTrabalho(nome: string, descricao?: string): Promise<ApiResponse<LocalTrabalho>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const { data, error } = await supabase
      .from('locais_trabalho')
      .insert({ nome: nome.toUpperCase().trim(), descricao: descricao?.toUpperCase().trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Local de trabalho já cadastrado' };
      }
      console.error('Erro ao criar local:', error);
      return { success: false, error: 'Erro ao criar local de trabalho' };
    }

    revalidatePath('/cadastros/locais');
    return { success: true, data, message: 'Local de trabalho criado com sucesso' };
  } catch (error) {
    return { success: false, error: 'Erro desconhecido' };
  }
}

export async function updateLocalTrabalho(id: string, nome: string, descricao?: string, ativo?: boolean): Promise<ApiResponse<LocalTrabalho>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const updateData: any = { nome: nome.toUpperCase().trim() };
    if (descricao !== undefined) updateData.descricao = descricao?.toUpperCase().trim();
    if (ativo !== undefined) updateData.ativo = ativo;

    const { data, error } = await supabase
      .from('locais_trabalho')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Local de trabalho já cadastrado' };
      }
      console.error('Erro ao atualizar local:', error);
      return { success: false, error: 'Erro ao atualizar local de trabalho' };
    }

    revalidatePath('/cadastros/locais');
    return { success: true, data, message: 'Local de trabalho atualizado com sucesso' };
  } catch (error) {
    return { success: false, error: 'Erro desconhecido' };
  }
}

export async function deleteLocalTrabalho(id: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const { error } = await supabase
      .from('locais_trabalho')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar local:', error);
      return { success: false, error: 'Erro ao deletar local de trabalho' };
    }

    revalidatePath('/cadastros/locais');
    return { success: true, message: 'Local de trabalho excluído com sucesso' };
  } catch (error) {
    return { success: false, error: 'Erro desconhecido' };
  }
}
