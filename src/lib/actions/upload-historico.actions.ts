'use server';

import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';
import { revalidatePath } from 'next/cache';

export interface UploadHistoricoResult {
  success: number;
  errors: string[];
  total: number;
  detalhes: {
    veiculosCriados: number;
    prefixosCriados: number;
    locaisCriados: number;
    ordensCriadas: number;
  };
}

interface HistoricoRow {
  ENTRADA?: string;
  INFORMAÇÃO?: string;
  MODELO?: string;
  PREFIXO?: string;
  PLACA?: string;
  BASE?: string;
  DEFEITO?: string;
  MOTIVO?: string;
  STATUS2?: string;
  'DATA DE LIBERAÇÃO NA OFICINA'?: string;
  'HORA DE SAÍDA DA OFICINA'?: string;
  'AVISADO / ENTREGUE P/COMLURB'?: string;
  'SAÍDA BASE'?: string;
  RESERVA?: string;
  'PREFIXO DO RESERVA'?: string;
  ' SAÍDA/ BASE'?: string;
  OBSERVAÇÃO?: string;
}

export async function uploadHistorico(file: File) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet) as HistoricoRow[];

    // Buscar dados existentes
    const { data: prefixos } = await supabase.from('prefixos').select('id, nome').eq('ativo', true);
    const { data: locais } = await supabase.from('locais_trabalho').select('id, nome').eq('ativo', true);
    const { data: veiculos } = await supabase.from('veiculos').select('id, placa, prefixo_id');

    const prefixoMap = new Map(prefixos?.map(p => [p.nome.toUpperCase(), p.id]) || []);
    const localMap = new Map(locais?.map(l => [l.nome.toUpperCase(), l.id]) || []);
    const veiculoMap = new Map(veiculos?.map(v => [v.placa.toUpperCase(), v.id]) || []);

    const result: UploadHistoricoResult = {
      success: 0,
      errors: [],
      total: data.length,
      detalhes: {
        veiculosCriados: 0,
        prefixosCriados: 0,
        locaisCriados: 0,
        ordensCriadas: 0,
      },
    };

    // Funções auxiliares
    async function getOrCreatePrefixo(nome: string): Promise<string | null> {
      const nomeUpper = nome.toUpperCase().trim();
      if (prefixoMap.has(nomeUpper)) return prefixoMap.get(nomeUpper)!;

      const { data: novo, error } = await supabase
        .from('prefixos')
        .insert({ nome: nomeUpper, ativo: true })
        .select('id')
        .single();

      if (error || !novo) return null;
      prefixoMap.set(nomeUpper, novo.id);
      result.detalhes.prefixosCriados++;
      return novo.id;
    }

    async function getOrCreateLocal(nome: string): Promise<string | null> {
      const nomeUpper = nome.toUpperCase().trim();
      if (localMap.has(nomeUpper)) return localMap.get(nomeUpper)!;

      const { data: novo, error } = await supabase
        .from('locais_trabalho')
        .insert({ nome: nomeUpper, ativo: true })
        .select('id')
        .single();

      if (error || !novo) return null;
      localMap.set(nomeUpper, novo.id);
      result.detalhes.locaisCriados++;
      return novo.id;
    }

    async function getOrCreateVeiculo(placa: string, prefixo: string, modelo: string, base?: string): Promise<string | null> {
      const placaUpper = placa.toUpperCase().trim();
      if (veiculoMap.has(placaUpper)) return veiculoMap.get(placaUpper)!;

      const prefixoId = await getOrCreatePrefixo(prefixo);
      if (!prefixoId) return null;

      // Local de trabalho é OPCIONAL
      let localId: string | null = null;
      if (base && base.trim() !== '') {
        localId = await getOrCreateLocal(base);
        // Se não conseguir criar/buscar o local, apenas ignora (não retorna null)
      }

      // Verificar se já existe veículo com essa placa
      const { data: existente } = await supabase
        .from('veiculos')
        .select('id')
        .eq('placa', placaUpper)
        .single();

      if (existente) {
        veiculoMap.set(placaUpper, existente.id);
        return existente.id;
      }

      const { data: novo, error } = await supabase
        .from('veiculos')
        .insert({
          placa: placaUpper,
          modelo: modelo ? modelo.toUpperCase().trim() : null,
          prefixo_id: prefixoId,
          local_trabalho_id: localId,
        })
        .select('id')
        .single();

      if (error || !novo) return null;
      veiculoMap.set(placaUpper, novo.id);
      result.detalhes.veiculosCriados++;
      return novo.id;
    }

    function parseData(dataStr: string): string | null {
      if (!dataStr) return null;
      try {
        // Aceitar formatos: DD/MM/YYYY, D/M/YYYY, ou número serial do Excel
        const str = dataStr.toString().trim();
        
        // Se for número (serial do Excel)
        if (!isNaN(Number(str))) {
          const serial = Number(str);
          const date = new Date((serial - 25569) * 86400 * 1000);
          const ano = date.getFullYear();
          const mes = String(date.getMonth() + 1).padStart(2, '0');
          const dia = String(date.getDate()).padStart(2, '0');
          return `${ano}-${mes}-${dia}`;
        }
        
        // Se for formato DD/MM/YYYY
        const partes = str.split('/');
        if (partes.length === 3) {
          const [dia, mes, ano] = partes;
          return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        }
      } catch (e) {
        return null;
      }
      return null;
    }

    function mapearStatus(status2: string): string {
      const statusUpper = status2?.toUpperCase().trim() || '';
      
      // Mapear para os status válidos do enum
      if (statusUpper.includes('PRONTO')) {
        if (statusUpper.includes('CJ')) return 'PARADO PRONTO CJ';
        if (statusUpper.includes('CG')) return 'PARADO PRONTO CG';
        return 'PRONTO';
      }
      
      if (statusUpper.includes('PARADO')) {
        if (statusUpper.includes('MANUTENÇÃO')) {
          if (statusUpper.includes('CJ')) return 'PARADO EM MANUTENÇÃO CJ';
          if (statusUpper.includes('CG')) return 'PARADO EM MANUTENÇÃO CG';
        }
        if (statusUpper.includes('CJ')) return 'PARADO PRONTO CJ';
        if (statusUpper.includes('CG')) return 'PARADO PRONTO CG';
        return 'AGUARDANDO PEÇA';
      }
      
      if (statusUpper.includes('PARCIAL')) return 'REPARO PARCIAL';
      if (statusUpper.includes('MANUTENÇÃO') || statusUpper.includes('EM DIAGNÓSTICO')) return 'EM MANUTENÇÃO';
      if (statusUpper.includes('FORC EXTERNO') || statusUpper.includes('FORNECEDOR')) return 'FORNECEDOR EXTERNO';
      if (statusUpper.includes('DOC')) return 'AGUARDANDO PEÇA';
      if (statusUpper.includes('EM USO') || statusUpper.includes('EM OPERAÇÃO')) return 'PRONTO';
      
      return 'EM MANUTENÇÃO';
    }

    // Processar cada linha
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        const prefixo = row.PREFIXO?.toString().trim();
        const placa = row.PLACA?.toString().trim();
        const modelo = row.MODELO?.toString().trim();
        const base = row.BASE?.toString().trim();
        const defeito = row.DEFEITO?.toString().trim();
        const motivo = row.MOTIVO?.toString().trim();
        const status2 = row.STATUS2?.toString().trim();
        const observacao = row['OBSERVAÇÃO']?.toString().trim();
        const dataEntrada = row.ENTRADA?.toString().trim();
        const dataLiberacao = row['DATA DE LIBERAÇÃO NA OFICINA']?.toString().trim();
        const prefixoReserva = row['PREFIXO DO RESERVA']?.toString().trim();

        // Validações básicas
        if (!prefixo || !placa) {
          result.errors.push(`Linha ${i + 2}: Prefixo ou placa não encontrados`);
          continue;
        }

        // Criar ou buscar veículo (BASE é opcional)
        const veiculoId = await getOrCreateVeiculo(placa, prefixo, modelo || '', base);
        if (!veiculoId) {
          result.errors.push(`Linha ${i + 2}: Erro ao criar/buscar veículo ${placa}`);
          continue;
        }

        // Buscar veículo reserva se houver
        let veiculoSubstitutoId: string | null = null;
        if (prefixoReserva) {
          const { data: veiculoReserva } = await supabase
            .from('veiculos')
            .select('id')
            .ilike('prefixo_id', `%${prefixoReserva}%`)
            .limit(1)
            .single();
          
          if (veiculoReserva) {
            veiculoSubstitutoId = veiculoReserva.id;
          }
        }

        // Preparar dados da ordem
        const descricao = `${defeito || 'SEM DEFEITO'} - ${motivo || 'SEM MOTIVO'}`;
        const status = mapearStatus(status2 || '');
        const dataAberturaStr = parseData(dataEntrada || '');
        let dataFechamentoStr = parseData(dataLiberacao || '');

        // Se o status indica ordem fechada mas não tem data de fechamento, usar data de abertura
        const statusFechados = ['PRONTO', 'PARADO PRONTO CJ', 'PARADO PRONTO CG'];
        if (statusFechados.includes(status) && !dataFechamentoStr && dataAberturaStr) {
          dataFechamentoStr = dataAberturaStr;
        }

        // Gerar número de ordem único
        const timestamp = Date.now();
        const numeroOrdem = `OM-${timestamp}-${i}`;

        // Criar ordem de manutenção
        const { error: ordemError } = await supabase
          .from('ordens_manutencao')
          .insert({
            numero_ordem: numeroOrdem,
            veiculo_id: veiculoId,
            status,
            descricao,
            observacoes: observacao || null,
            veiculo_substituto_id: veiculoSubstitutoId,
            data_abertura: dataAberturaStr || new Date().toISOString(),
            data_fechamento: dataFechamentoStr || null,
            tempo_editado_manualmente: false,
          });

        if (ordemError) {
          result.errors.push(`Linha ${i + 2}: Erro ao criar ordem - ${ordemError.message}`);
        } else {
          result.success++;
          result.detalhes.ordensCriadas++;
        }

      } catch (err) {
        result.errors.push(`Linha ${i + 2}: Erro ao processar - ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }

    revalidatePath('/ordens');
    return { success: true, data: result };

  } catch (error) {
    console.error('Erro ao processar arquivo:', error);
    return { success: false, error: 'Erro ao processar arquivo de histórico' };
  }
}
