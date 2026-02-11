'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResult {
  success: number;
  errors: string[];
  total: number;
}

// ============================================================================
// UPLOAD DE PREFIXOS
// ============================================================================

export async function uploadPrefixos(file: File): Promise<ApiResponse<UploadResult>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const result: UploadResult = {
      success: 0,
      errors: [],
      total: data.length,
    };

    for (const row of data as any[]) {
      try {
        const nome = row['NOME'] || row['nome'] || row['Prefixo'] || row['prefixo'];
        const descricao = row['DESCRIÇÃO'] || row['descricao'] || row['Descrição'] || row['descricao'];

        if (!nome || typeof nome !== 'string' || nome.trim() === '') {
          result.errors.push(`Linha inválida: nome do prefixo não encontrado`);
          continue;
        }

        const { error } = await supabase
          .from('prefixos')
          .insert({
            nome: nome.toUpperCase().trim(),
            descricao: descricao ? descricao.toUpperCase().trim() : null,
            ativo: true,
          });

        if (error) {
          if (error.code === '23505') {
            result.errors.push(`Prefixo "${nome}" já existe`);
          } else {
            result.errors.push(`Erro ao inserir prefixo "${nome}": ${error.message}`);
          }
        } else {
          result.success++;
        }
      } catch (err) {
        result.errors.push(`Erro ao processar linha: ${JSON.stringify(row)}`);
      }
    }

    revalidatePath('/cadastros/prefixos');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Erro ao processar arquivo' };
  }
}

// ============================================================================
// UPLOAD DE LOCAIS DE TRABALHO
// ============================================================================

export async function uploadLocaisTrabalho(file: File): Promise<ApiResponse<UploadResult>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const result: UploadResult = {
      success: 0,
      errors: [],
      total: data.length,
    };

    for (const row of data as any[]) {
      try {
        const nome = row['NOME'] || row['nome'] || row['Local'] || row['local'] || row['LOCAL'];
        const descricao = row['DESCRIÇÃO'] || row['descricao'] || row['Descrição'] || row['descricao'];

        if (!nome || typeof nome !== 'string' || nome.trim() === '') {
          result.errors.push(`Linha inválida: nome do local não encontrado`);
          continue;
        }

        const { error } = await supabase
          .from('locais_trabalho')
          .insert({
            nome: nome.toUpperCase().trim(),
            descricao: descricao ? descricao.toUpperCase().trim() : null,
            ativo: true,
          });

        if (error) {
          if (error.code === '23505') {
            result.errors.push(`Local "${nome}" já existe`);
          } else {
            result.errors.push(`Erro ao inserir local "${nome}": ${error.message}`);
          }
        } else {
          result.success++;
        }
      } catch (err) {
        result.errors.push(`Erro ao processar linha: ${JSON.stringify(row)}`);
      }
    }

    revalidatePath('/cadastros/locais');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Erro ao processar arquivo' };
  }
}

// ============================================================================
// UPLOAD DE VEÍCULOS
// ============================================================================

export async function uploadVeiculos(file: File): Promise<ApiResponse<UploadResult>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Buscar prefixos e locais disponíveis
    const { data: prefixos } = await supabase
      .from('prefixos')
      .select('id, nome')
      .eq('ativo', true);

    const { data: locais } = await supabase
      .from('locais_trabalho')
      .select('id, nome')
      .eq('ativo', true);

    const prefixoMap = new Map(prefixos?.map(p => [p.nome, p.id]) || []);
    const localMap = new Map(locais?.map(l => [l.nome, l.id]) || []);

    const result: UploadResult = {
      success: 0,
      errors: [],
      total: data.length,
    };

    for (const row of data as any[]) {
      try {
        const placa = row['PLACA'] || row['placa'] || row['Placa'];
        const modelo = row['MODELO'] || row['modelo'] || row['Modelo'];
        const prefixoNome = row['PREFIXO'] || row['prefixo'] || row['Prefixo'];
        const localNome = row['LOCAL'] || row['local'] || row['Local'] || row['LOCAL_TRABALHO'] || row['local_trabalho'];
        const nomeMotorista = row['MOTORISTA'] || row['motorista'] || row['Nome_Motorista'] || row['nome_motorista'];
        const telefoneMotorista = row['TELEFONE'] || row['telefone'] || row['Telefone_Motorista'] || row['telefone_motorista'];

        if (!placa || typeof placa !== 'string' || placa.trim() === '') {
          result.errors.push(`Linha inválida: placa não encontrada`);
          continue;
        }

        if (!prefixoNome || !prefixoMap.has(prefixoNome.toUpperCase().trim())) {
          result.errors.push(`Prefixo "${prefixoNome}" não encontrado ou inativo`);
          continue;
        }

        if (!localNome || !localMap.has(localNome.toUpperCase().trim())) {
          result.errors.push(`Local "${localNome}" não encontrado ou inativo`);
          continue;
        }

        const { error } = await supabase
          .from('veiculos')
          .insert({
            placa: placa.toUpperCase().trim(),
            modelo: modelo ? modelo.toUpperCase().trim() : null,
            prefixo_id: prefixoMap.get(prefixoNome.toUpperCase().trim()),
            local_trabalho_id: localMap.get(localNome.toUpperCase().trim()),
            nome_motorista: nomeMotorista ? nomeMotorista.toUpperCase().trim() : null,
            telefone_motorista: telefoneMotorista || null,
          });

        if (error) {
          if (error.code === '23505') {
            result.errors.push(`Placa "${placa}" já existe`);
          } else {
            result.errors.push(`Erro ao inserir veículo "${placa}": ${error.message}`);
          }
        } else {
          result.success++;
        }
      } catch (err) {
        result.errors.push(`Erro ao processar linha: ${JSON.stringify(row)}`);
      }
    }

    revalidatePath('/veiculos');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Erro ao processar arquivo' };
  }
}

