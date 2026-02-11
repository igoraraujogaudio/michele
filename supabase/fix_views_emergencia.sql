-- ============================================================================
-- FIX EMERGENCIAL: Criar views básicas para relatórios funcionarem
-- ============================================================================
-- Execute este arquivo SQL diretamente no Supabase SQL Editor
-- ============================================================================

-- 1. VIEW EM MANUTENÇÃO (versão simplificada)
CREATE OR REPLACE VIEW vw_veiculos_em_manutencao AS
SELECT 
  v.id AS veiculo_id,
  COALESCE(p.nome, 'SEM PREFIXO') AS prefixo,
  v.placa,
  v.modelo,
  COALESCE(lt.nome, 'SEM LOCAL') AS local_trabalho,
  v.nome_motorista,
  v.telefone_motorista,
  o.id AS ordem_id,
  o.numero_ordem,
  o.status,
  o.descricao,
  o.observacoes,
  o.is_reserva,
  o.veiculo_reserva_id,
  vr.placa AS veiculo_reserva_placa,
  vr.modelo AS veiculo_reserva_modelo,
  o.data_abertura,
  o.tempo_parado_minutos,
  o.tempo_editado_manualmente,
  -- Calcula tempo parado em minutos
  CASE 
    WHEN o.tempo_editado_manualmente THEN o.tempo_parado_minutos
    ELSE EXTRACT(EPOCH FROM (NOW() - o.data_abertura)) / 60
  END AS tempo_parado_atual_minutos,
  -- Formata tempo parado
  CASE 
    WHEN o.tempo_editado_manualmente THEN 
      FLOOR(o.tempo_parado_minutos / 60) || 'h ' || (o.tempo_parado_minutos % 60) || 'min'
    ELSE 
      FLOOR(EXTRACT(EPOCH FROM (NOW() - o.data_abertura)) / 3600) || 'h ' || 
      FLOOR((EXTRACT(EPOCH FROM (NOW() - o.data_abertura)) % 3600) / 60) || 'min'
  END AS tempo_parado_formatado,
  -- Calcula dias parados
  CASE 
    WHEN o.tempo_editado_manualmente THEN 
      FLOOR(o.tempo_parado_minutos / 1440)
    ELSE 
      FLOOR(EXTRACT(EPOCH FROM (NOW() - o.data_abertura)) / 86400)
  END AS dias_parados,
  -- Nível de alerta
  CASE 
    WHEN o.tempo_editado_manualmente THEN
      CASE 
        WHEN o.tempo_parado_minutos >= 2880 THEN 2 -- >= 48h
        WHEN o.tempo_parado_minutos >= 1440 THEN 1 -- >= 24h
        ELSE 0
      END
    ELSE
      CASE 
        WHEN EXTRACT(EPOCH FROM (NOW() - o.data_abertura)) >= 172800 THEN 2 -- >= 48h
        WHEN EXTRACT(EPOCH FROM (NOW() - o.data_abertura)) >= 86400 THEN 1 -- >= 24h
        ELSE 0
      END
  END AS nivel_alerta,
  o.created_at,
  o.updated_at
FROM 
  veiculos v
INNER JOIN 
  ordens_manutencao o ON v.id = o.veiculo_id
LEFT JOIN 
  prefixos p ON v.prefixo_id = p.id
LEFT JOIN 
  locais_trabalho lt ON v.local_trabalho_id = lt.id
LEFT JOIN 
  veiculos vr ON o.veiculo_reserva_id = vr.id
WHERE 
  o.data_fechamento IS NULL
ORDER BY 
  tempo_parado_atual_minutos DESC;

-- 2. VIEW DISPONÍVEIS (versão simplificada)
CREATE OR REPLACE VIEW vw_veiculos_disponiveis AS
SELECT 
  v.id AS veiculo_id,
  COALESCE(p.nome, 'SEM PREFIXO') AS prefixo,
  v.placa,
  v.modelo,
  COALESCE(lt.nome, 'SEM LOCAL') AS local_trabalho,
  v.nome_motorista,
  v.telefone_motorista,
  'DISPONÍVEL' AS status_atual,
  NULL AS ultima_ordem_numero,
  NULL AS ultima_ordem_status,
  NULL AS ultima_ordem_data_fechamento,
  NULL AS ultima_ordem_tempo_parado,
  NULL AS dias_desde_ultima_manutencao,
  0 AS total_manutencoes_realizadas,
  0 AS tempo_total_parado_minutos,
  v.created_at,
  v.updated_at
FROM 
  veiculos v
LEFT JOIN 
  prefixos p ON v.prefixo_id = p.id
LEFT JOIN 
  locais_trabalho lt ON v.local_trabalho_id = lt.id
WHERE 
  NOT EXISTS (
    SELECT 1 
    FROM ordens_manutencao o 
    WHERE o.veiculo_id = v.id 
    AND o.data_fechamento IS NULL
  )
ORDER BY 
  p.nome ASC, v.placa ASC;

-- 3. VERIFICAÇÃO
DO $$
BEGIN
  -- Verificar se views foram criadas
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_veiculos_em_manutencao') THEN
    RAISE NOTICE '✅ vw_veiculos_em_manutencao criada com sucesso!';
  ELSE
    RAISE NOTICE '❌ Erro ao criar vw_veiculos_em_manutencao';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'vw_veiculos_disponiveis') THEN
    RAISE NOTICE '✅ vw_veiculos_disponiveis criada com sucesso!';
  ELSE
    RAISE NOTICE '❌ Erro ao criar vw_veiculos_disponiveis';
  END IF;
  
  RAISE NOTICE '🚀 Views criadas! Relatórios devem funcionar agora.';
END $$;
