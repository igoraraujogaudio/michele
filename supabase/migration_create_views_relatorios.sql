-- ============================================================================
-- MIGRAÇÃO: Criar views para relatórios (versão atualizada)
-- ============================================================================
-- Cria as views necessárias para os relatórios de veículos
-- Adaptada para funcionar com as novas colunas (prefixo_id, local_trabalho_id)
-- ============================================================================

-- 1. VIEW: VEÍCULOS EM MANUTENÇÃO
CREATE OR REPLACE VIEW vw_veiculos_em_manutencao AS
SELECT 
  v.id AS veiculo_id,
  v.prefixo_id,
  p.nome AS prefixo,
  v.placa,
  v.modelo,
  v.local_trabalho_id,
  lt.nome AS local_trabalho,
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
  vr_prefixo.nome AS veiculo_reserva_prefixo,
  o.data_abertura,
  o.tempo_parado_minutos,
  o.tempo_editado_manualmente,
  -- Calcula tempo parado em minutos (tempo real ou editado)
  CASE 
    WHEN o.tempo_editado_manualmente THEN o.tempo_parado_minutos
    ELSE EXTRACT(EPOCH FROM (NOW() - o.data_abertura)) / 60
  END AS tempo_parado_atual_minutos,
  -- Formata tempo parado em horas e minutos
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
  -- Nível de alerta (0=normal, 1=alerta, 2=urgente)
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
LEFT JOIN 
  prefixos vr_prefixo ON vr.prefixo_id = vr_prefixo.id
WHERE 
  o.data_fechamento IS NULL -- Apenas ordens abertas
ORDER BY 
  tempo_parado_atual_minutos DESC;

COMMENT ON VIEW vw_veiculos_em_manutencao IS 'View atualizada para relatório de veículos em manutenção com suporte a veículo reserva';

-- 2. VIEW: VEÍCULOS DISPONÍVEIS
CREATE OR REPLACE VIEW vw_veiculos_disponiveis AS
SELECT 
  v.id AS veiculo_id,
  v.prefixo_id,
  p.nome AS prefixo,
  v.placa,
  v.modelo,
  v.local_trabalho_id,
  lt.nome AS local_trabalho,
  v.nome_motorista,
  v.telefone_motorista,
  'DISPONÍVEL' AS status_atual,
  -- Última ordem de manutenção (se houver)
  ultima_ordem.numero_ordem AS ultima_ordem_numero,
  ultima_ordem.status AS ultima_ordem_status,
  ultima_ordem.data_fechamento AS ultima_ordem_data_fechamento,
  ultima_ordem.tempo_parado_minutos AS ultima_ordem_tempo_parado,
  -- Dias desde última manutenção
  CASE 
    WHEN ultima_ordem.data_fechamento IS NOT NULL THEN
      EXTRACT(DAY FROM (NOW() - ultima_ordem.data_fechamento))
    ELSE NULL
  END AS dias_desde_ultima_manutencao,
  -- Total de manutenções realizadas
  COALESCE(total_manutencoes.total, 0) AS total_manutencoes_realizadas,
  -- Tempo total parado (soma de todas as manutenções)
  COALESCE(total_manutencoes.tempo_total_parado, 0) AS tempo_total_parado_minutos,
  v.created_at,
  v.updated_at
FROM 
  veiculos v
LEFT JOIN 
  prefixos p ON v.prefixo_id = p.id
LEFT JOIN 
  locais_trabalho lt ON v.local_trabalho_id = lt.id
LEFT JOIN LATERAL (
  -- Busca a última ordem de manutenção fechada
  SELECT 
    numero_ordem,
    status,
    data_fechamento,
    tempo_parado_minutos
  FROM 
    ordens_manutencao
  WHERE 
    veiculo_id = v.id
    AND data_fechamento IS NOT NULL
  ORDER BY 
    data_fechamento DESC
  LIMIT 1
) ultima_ordem ON TRUE
LEFT JOIN LATERAL (
  -- Calcula totais de manutenções
  SELECT 
    COUNT(*) AS total,
    SUM(tempo_parado_minutos) AS tempo_total_parado
  FROM 
    ordens_manutencao
  WHERE 
    veiculo_id = v.id
    AND data_fechamento IS NOT NULL
) total_manutencoes ON TRUE
WHERE 
  NOT EXISTS (
    -- Verifica se NÃO tem ordem aberta
    SELECT 1 
    FROM ordens_manutencao o 
    WHERE o.veiculo_id = v.id 
    AND o.data_fechamento IS NULL
  )
ORDER BY 
  p.nome ASC, v.placa ASC;

COMMENT ON VIEW vw_veiculos_disponiveis IS 'View atualizada para relatório de veículos disponíveis com suporte a prefixos e locais';

-- 3. VIEW: VEÍCULOS COMPLETOS (para uso geral)
CREATE OR REPLACE VIEW vw_veiculos_completos AS
SELECT 
  v.id,
  v.prefixo_id,
  p.nome as prefixo,
  v.placa,
  v.modelo,
  v.local_trabalho_id,
  lt.nome as local_trabalho,
  v.nome_motorista,
  v.telefone_motorista,
  v.created_at,
  v.updated_at
FROM veiculos v
LEFT JOIN prefixos p ON v.prefixo_id = p.id
LEFT JOIN locais_trabalho lt ON v.local_trabalho_id = lt.id;

COMMENT ON VIEW vw_veiculos_completos IS 'View com veículos incluindo nomes de prefixo e local de trabalho';

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_ordens_data_fechamento_null 
ON ordens_manutencao(veiculo_id) 
WHERE data_fechamento IS NULL;

CREATE INDEX IF NOT EXISTS idx_ordens_data_abertura_desc 
ON ordens_manutencao(data_abertura DESC);

CREATE INDEX IF NOT EXISTS idx_veiculos_prefixo_id 
ON veiculos(prefixo_id);

CREATE INDEX IF NOT EXISTS idx_veiculos_local_trabalho_id 
ON veiculos(local_trabalho_id);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Views para relatórios criadas com sucesso!';
  RAISE NOTICE 'Views disponíveis: vw_veiculos_em_manutencao, vw_veiculos_disponiveis, vw_veiculos_completos';
END $$;
