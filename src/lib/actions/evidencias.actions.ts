'use server';

import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/lib/types/database.types';

export interface EvidenciaManutencao {
  id: string;
  ordem_id: string;
  arquivo_url: string;
  arquivo_nome: string;
  descricao: string | null;
  tipo_evidencia: string;
  created_at: string;
  created_by: string | null;
}

export async function uploadEvidencia(
  ordemId: string,
  file: File,
  descricao?: string
): Promise<ApiResponse<EvidenciaManutencao>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${ordemId}/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload do arquivo para o storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('evidencias-manutencao')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      return { success: false, error: 'Erro ao fazer upload da imagem' };
    }

    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('evidencias-manutencao')
      .getPublicUrl(fileName);

    // Salvar registro no banco
    const { data: evidencia, error: dbError } = await supabase
      .from('evidencias_manutencao')
      .insert({
        ordem_id: ordemId,
        arquivo_url: publicUrl,
        arquivo_nome: file.name,
        descricao: descricao || null,
        tipo_evidencia: 'FOTO',
        created_by: user.id
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erro ao salvar evidência:', dbError);
      // Tentar deletar arquivo do storage
      await supabase.storage.from('evidencias-manutencao').remove([fileName]);
      return { success: false, error: 'Erro ao salvar evidência no banco' };
    }

    return { success: true, data: evidencia };

  } catch (error) {
    console.error('Erro ao processar evidência:', error);
    return { success: false, error: 'Erro ao processar evidência' };
  }
}

export async function listEvidencias(ordemId: string): Promise<ApiResponse<EvidenciaManutencao[]>> {
  try {
    const supabase = await createClient();

    const { data: evidencias, error } = await supabase
      .from('evidencias_manutencao')
      .select('*')
      .eq('ordem_id', ordemId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao listar evidências:', error);
      return { success: false, error: 'Erro ao listar evidências' };
    }

    return { success: true, data: evidencias || [] };

  } catch (error) {
    console.error('Erro ao listar evidências:', error);
    return { success: false, error: 'Erro ao listar evidências' };
  }
}

export async function deleteEvidencia(evidenciaId: string): Promise<ApiResponse<void>> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Não autenticado' };
    }

    // Buscar evidência para obter URL do arquivo
    const { data: evidencia, error: fetchError } = await supabase
      .from('evidencias_manutencao')
      .select('arquivo_url')
      .eq('id', evidenciaId)
      .single();

    if (fetchError || !evidencia) {
      return { success: false, error: 'Evidência não encontrada' };
    }

    // Extrair caminho do arquivo da URL
    const urlParts = evidencia.arquivo_url.split('/');
    const fileName = urlParts.slice(-2).join('/'); // ordem_id/arquivo.ext

    // Deletar do storage
    const { error: storageError } = await supabase.storage
      .from('evidencias-manutencao')
      .remove([fileName]);

    if (storageError) {
      console.error('Erro ao deletar arquivo:', storageError);
    }

    // Deletar registro do banco
    const { error: dbError } = await supabase
      .from('evidencias_manutencao')
      .delete()
      .eq('id', evidenciaId);

    if (dbError) {
      console.error('Erro ao deletar evidência:', dbError);
      return { success: false, error: 'Erro ao deletar evidência' };
    }

    return { success: true, data: undefined };

  } catch (error) {
    console.error('Erro ao deletar evidência:', error);
    return { success: false, error: 'Erro ao deletar evidência' };
  }
}
