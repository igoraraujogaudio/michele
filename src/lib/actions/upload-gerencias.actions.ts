'use server';

import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';
import { revalidatePath } from 'next/cache';

export interface UploadGerenciasResult {
  success: number;
  errors: string[];
  total: number;
  gerenciasCriadas: number;
}

export async function uploadGerenciasPorPlaca(file: File) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Buscar gerências existentes
    const { data: gerencias } = await supabase
      .from('gerencias')
      .select('id, nome')
      .eq('ativo', true);

    const gerenciaMap = new Map(gerencias?.map(g => [g.nome.toUpperCase(), g.id]) || []);

    const result: UploadGerenciasResult = {
      success: 0,
      errors: [],
      total: data.length,
      gerenciasCriadas: 0,
    };

    // Função auxiliar para criar ou buscar gerência
    async function getOrCreateGerencia(nome: string): Promise<string | null> {
      const nomeUpper = nome.toUpperCase().trim();
      
      if (gerenciaMap.has(nomeUpper)) {
        return gerenciaMap.get(nomeUpper)!;
      }

      // Criar nova gerência
      const { data: nova, error } = await supabase
        .from('gerencias')
        .insert({ nome: nomeUpper, ativo: true })
        .select('id')
        .single();

      if (error || !nova) return null;
      
      gerenciaMap.set(nomeUpper, nova.id);
      result.gerenciasCriadas++;
      return nova.id;
    }

    // Processar cada linha
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      
      try {
        const placa = row['PLACA']?.toString().trim();
        const gerenciaNome = row['GERENCIA']?.toString().trim();

        if (!placa) {
          result.errors.push(`Linha ${i + 2}: Placa não encontrada`);
          continue;
        }

        if (!gerenciaNome || gerenciaNome === '#N/D' || gerenciaNome === '0') {
          result.errors.push(`Linha ${i + 2}: Gerência inválida para placa ${placa}`);
          continue;
        }

        // Buscar veículo pela placa
        const { data: veiculo, error: veiculoError } = await supabase
          .from('veiculos')
          .select('id')
          .eq('placa', placa.toUpperCase())
          .single();

        if (veiculoError || !veiculo) {
          result.errors.push(`Linha ${i + 2}: Veículo com placa ${placa} não encontrado`);
          continue;
        }

        // Criar ou buscar gerência
        const gerenciaId = await getOrCreateGerencia(gerenciaNome);
        if (!gerenciaId) {
          result.errors.push(`Linha ${i + 2}: Erro ao criar/buscar gerência ${gerenciaNome}`);
          continue;
        }

        // Atualizar veículo com gerência
        const { error: updateError } = await supabase
          .from('veiculos')
          .update({ gerencia_id: gerenciaId })
          .eq('id', veiculo.id);

        if (updateError) {
          result.errors.push(`Linha ${i + 2}: Erro ao atualizar veículo ${placa} - ${updateError.message}`);
        } else {
          result.success++;
        }

      } catch (err) {
        result.errors.push(`Linha ${i + 2}: Erro ao processar - ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }

    revalidatePath('/veiculos');
    return { success: true, data: result };

  } catch (error) {
    console.error('Erro ao processar arquivo:', error);
    return { success: false, error: 'Erro ao processar arquivo de gerências' };
  }
}
