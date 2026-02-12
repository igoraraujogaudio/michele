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

    // Buscar prefixos, locais e gerências disponíveis
    const { data: prefixos } = await supabase
      .from('prefixos')
      .select('id, nome')
      .eq('ativo', true);

    const { data: locais } = await supabase
      .from('locais_trabalho')
      .select('id, nome')
      .eq('ativo', true);

    const { data: gerencias } = await supabase
      .from('gerencias')
      .select('id, nome')
      .eq('ativo', true);

    const prefixoMap = new Map(prefixos?.map(p => [p.nome.toUpperCase(), p.id]) || []);
    const localMap = new Map(locais?.map(l => [l.nome.toUpperCase(), l.id]) || []);
    const gerenciaMap = new Map(gerencias?.map(g => [g.nome.toUpperCase(), g.id]) || []);

    // Função auxiliar para criar ou buscar prefixo
    async function getOrCreatePrefixo(nome: string): Promise<string | null> {
      const nomeUpper = nome.toUpperCase().trim();
      
      if (prefixoMap.has(nomeUpper)) {
        return prefixoMap.get(nomeUpper)!;
      }

      // Criar novo prefixo
      const { data: novoPrefixo, error } = await supabase
        .from('prefixos')
        .insert({ nome: nomeUpper, ativo: true })
        .select('id')
        .single();

      if (error || !novoPrefixo) {
        return null;
      }

      prefixoMap.set(nomeUpper, novoPrefixo.id);
      return novoPrefixo.id;
    }

    // Função auxiliar para criar ou buscar local de trabalho
    async function getOrCreateLocal(nome: string): Promise<string | null> {
      const nomeUpper = nome.toUpperCase().trim();
      
      if (localMap.has(nomeUpper)) {
        return localMap.get(nomeUpper)!;
      }

      // Criar novo local de trabalho
      const { data: novoLocal, error } = await supabase
        .from('locais_trabalho')
        .insert({ nome: nomeUpper, ativo: true })
        .select('id')
        .single();

      if (error || !novoLocal) {
        return null;
      }

      localMap.set(nomeUpper, novoLocal.id);
      return novoLocal.id;
    }

    // Função auxiliar para criar ou buscar gerência
    async function getOrCreateGerencia(nome: string): Promise<string | null> {
      const nomeUpper = nome.toUpperCase().trim();
      
      if (gerenciaMap.has(nomeUpper)) {
        return gerenciaMap.get(nomeUpper)!;
      }

      // Criar nova gerência
      const { data: novaGerencia, error } = await supabase
        .from('gerencias')
        .insert({ nome: nomeUpper, ativo: true })
        .select('id')
        .single();

      if (error || !novaGerencia) {
        return null;
      }

      gerenciaMap.set(nomeUpper, novaGerencia.id);
      return novaGerencia.id;
    }

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
        const gerenciaNome = row['GERENCIA'] || row['gerencia'] || row['Gerencia'];
        const nomeMotorista = row['MOTORISTA'] || row['motorista'] || row['Nome_Motorista'] || row['nome_motorista'];
        const telefoneMotorista = row['TELEFONE'] || row['telefone'] || row['Telefone_Motorista'] || row['telefone_motorista'];

        if (!prefixoNome || typeof prefixoNome !== 'string' || prefixoNome.trim() === '') {
          result.errors.push(`Linha inválida: prefixo não encontrado`);
          continue;
        }

        // Se placa não foi fornecida ou está vazia, usa o prefixo como placa
        let placaFinal = placa;
        if (!placa || typeof placa !== 'string' || placa.trim() === '') {
          placaFinal = prefixoNome;
        }

        // Criar ou buscar prefixo
        const prefixoId = await getOrCreatePrefixo(prefixoNome);
        if (!prefixoId) {
          result.errors.push(`Erro ao criar/buscar prefixo "${prefixoNome}"`);
          continue;
        }

        // Criar ou buscar local de trabalho (OPCIONAL)
        let localId: string | null = null;
        if (localNome && typeof localNome === 'string' && localNome.trim() !== '' && localNome !== '#N/D' && localNome !== '0') {
          localId = await getOrCreateLocal(localNome);
          // Se não conseguir criar/buscar o local, apenas ignora (não gera erro)
          // O veículo será cadastrado sem local de trabalho
        }

        // Criar ou buscar gerência (OPCIONAL)
        let gerenciaId: string | null = null;
        if (gerenciaNome && typeof gerenciaNome === 'string' && gerenciaNome.trim() !== '' && gerenciaNome !== '#N/D' && gerenciaNome !== '0') {
          gerenciaId = await getOrCreateGerencia(gerenciaNome);
          // Se não conseguir criar/buscar a gerência, apenas ignora (não gera erro)
          // O veículo será cadastrado sem gerência
        }

        const { error } = await supabase
          .from('veiculos')
          .insert({
            placa: placaFinal.toUpperCase().trim(),
            modelo: modelo ? modelo.toUpperCase().trim() : null,
            prefixo_id: prefixoId,
            local_trabalho_id: localId,
            gerencia_id: gerenciaId,
            nome_motorista: nomeMotorista ? nomeMotorista.toUpperCase().trim() : null,
            telefone_motorista: telefoneMotorista || null,
          });

        if (error) {
          if (error.code === '23505') {
            result.errors.push(`Placa/Prefixo "${placaFinal}" já existe`);
          } else {
            result.errors.push(`Erro ao inserir veículo "${placaFinal}": ${error.message}`);
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

