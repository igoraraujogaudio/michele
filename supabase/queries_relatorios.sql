-- ============================================================================
-- QUERIES SQL PARA RELATÓRIOS - SISTEMA DE VEÍCULOS EM OFICINA
-- ============================================================================
-- IMPORTANTE: Execute este arquivo APÓS executar o schema_custom.sql
-- Este arquivo assume que as tabelas e tipos já foram criados
-- ============================================================================

-- ============================================================================
-- 1. RELATÓRIO: VEÍCULOS EM MANUTENÇÃO COM TEMPO PARADO
-- ============================================================================
-- Retorna todos os veículos que possuem ordem de manutenção aberta
-- com cálculo de tempo parado em tempo real

CREATE OR REPLACE VIEW vw_veiculos_em_manutencao AS
SELECT 
  v.id AS veiculo_id,
  v.prefixo,
  v.placa,
  v.marca,
  v.modelo,
  v.ano,
  v.cor,
  o.id AS ordem_id,
  o.numero_ordem,
  o.status,
  o.descricao,
  o.observacoes,
  o.is_reserva,
  o.nome_motorista,
  o.telefone_motorista,
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
WHERE 
  o.data_fechamento IS NULL -- Apenas ordens abertas
ORDER BY 
  tempo_parado_atual_minutos DESC;

COMMENT ON VIEW vw_veiculos_em_manutencao IS 'View otimizada para relatório de veículos em manutenção com tempo parado calculado em tempo real';

-- ============================================================================
-- 2. RELATÓRIO: VEÍCULOS DISPONÍVEIS E LOCAL ATUAL
-- ============================================================================
-- Retorna todos os veículos que NÃO possuem ordem de manutenção aberta
-- com informações sobre última manutenção e localização

CREATE OR REPLACE VIEW vw_veiculos_disponiveis AS
SELECT 
  v.id AS veiculo_id,
  v.prefixo,
  v.placa,
  v.marca,
  v.modelo,
  v.ano,
  v.cor,
  v.observacoes,
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
  v.prefixo ASC;

COMMENT ON VIEW vw_veiculos_disponiveis IS 'View otimizada para relatório de veículos disponíveis com histórico de manutenções';

-- ============================================================================
-- 3. FUNÇÃO: BUSCAR VEÍCULOS EM MANUTENÇÃO COM FILTROS
-- ============================================================================
CREATE OR REPLACE FUNCTION buscar_veiculos_em_manutencao(
  p_status status_ordem DEFAULT NULL,
  p_nivel_alerta INTEGER DEFAULT NULL,
  p_is_reserva BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  veiculo_id UUID,
  prefixo VARCHAR,
  placa VARCHAR,
  marca VARCHAR,
  modelo VARCHAR,
  ano INTEGER,
  cor VARCHAR,
  ordem_id UUID,
  numero_ordem VARCHAR,
  status status_ordem,
  descricao TEXT,
  observacoes TEXT,
  is_reserva BOOLEAN,
  nome_motorista VARCHAR,
  telefone_motorista VARCHAR,
  data_abertura TIMESTAMPTZ,
  tempo_parado_minutos INTEGER,
  tempo_editado_manualmente BOOLEAN,
  tempo_parado_atual_minutos NUMERIC,
  tempo_parado_formatado TEXT,
  dias_parados NUMERIC,
  nivel_alerta INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM vw_veiculos_em_manutencao v
  WHERE 
    (p_status IS NULL OR v.status = p_status)
    AND (p_nivel_alerta IS NULL OR v.nivel_alerta = p_nivel_alerta)
    AND (p_is_reserva IS NULL OR v.is_reserva = p_is_reserva);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_veiculos_em_manutencao IS 'Busca veículos em manutenção com filtros opcionais de status, nível de alerta e reserva';

-- ============================================================================
-- 4. FUNÇÃO: BUSCAR VEÍCULOS DISPONÍVEIS COM FILTROS
-- ============================================================================
CREATE OR REPLACE FUNCTION buscar_veiculos_disponiveis(
  p_marca VARCHAR DEFAULT NULL,
  p_modelo VARCHAR DEFAULT NULL,
  p_ano_min INTEGER DEFAULT NULL,
  p_ano_max INTEGER DEFAULT NULL
)
RETURNS TABLE (
  veiculo_id UUID,
  prefixo VARCHAR,
  placa VARCHAR,
  marca VARCHAR,
  modelo VARCHAR,
  ano INTEGER,
  cor VARCHAR,
  observacoes TEXT,
  status_atual VARCHAR,
  ultima_ordem_numero VARCHAR,
  ultima_ordem_status status_ordem,
  ultima_ordem_data_fechamento TIMESTAMPTZ,
  ultima_ordem_tempo_parado INTEGER,
  dias_desde_ultima_manutencao NUMERIC,
  total_manutencoes_realizadas BIGINT,
  tempo_total_parado_minutos NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM vw_veiculos_disponiveis v
  WHERE 
    (p_marca IS NULL OR v.marca ILIKE '%' || p_marca || '%')
    AND (p_modelo IS NULL OR v.modelo ILIKE '%' || p_modelo || '%')
    AND (p_ano_min IS NULL OR v.ano >= p_ano_min)
    AND (p_ano_max IS NULL OR v.ano <= p_ano_max);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_veiculos_disponiveis IS 'Busca veículos disponíveis com filtros opcionais de marca, modelo e ano';

-- ============================================================================
-- 5. ÍNDICES PARA PERFORMANCE DOS RELATÓRIOS
-- ============================================================================

-- Índice para busca rápida de ordens abertas
CREATE INDEX IF NOT EXISTS idx_ordens_data_fechamento_null 
ON ordens_manutencao(veiculo_id) 
WHERE data_fechamento IS NULL;

-- Índice para ordenação por data de abertura
CREATE INDEX IF NOT EXISTS idx_ordens_data_abertura_desc 
ON ordens_manutencao(data_abertura DESC);

-- Índice para busca por status
CREATE INDEX IF NOT EXISTS idx_ordens_status_veiculo 
ON ordens_manutencao(status, veiculo_id);

-- Índice para busca de veículos por marca/modelo
CREATE INDEX IF NOT EXISTS idx_veiculos_marca_modelo_gin 
ON veiculos USING gin(to_tsvector('portuguese', marca || ' ' || modelo));

-- ============================================================================
-- EXEMPLOS DE USO
-- ============================================================================

-- Exemplo 1: Buscar todos os veículos em manutenção
-- SELECT * FROM vw_veiculos_em_manutencao;

-- Exemplo 2: Buscar veículos em manutenção com alerta urgente (>48h)
-- SELECT * FROM buscar_veiculos_em_manutencao(NULL, 2, NULL);

-- Exemplo 3: Buscar veículos em manutenção que são reservas
-- SELECT * FROM buscar_veiculos_em_manutencao(NULL, NULL, TRUE);

-- Exemplo 4: Buscar todos os veículos disponíveis
-- SELECT * FROM vw_veiculos_disponiveis;

-- Exemplo 5: Buscar veículos disponíveis de uma marca específica
-- SELECT * FROM buscar_veiculos_disponiveis('VOLKSWAGEN', NULL, NULL, NULL);

-- Exemplo 6: Buscar veículos disponíveis fabricados entre 2020 e 2023
-- SELECT * FROM buscar_veiculos_disponiveis(NULL, NULL, 2020, 2023);
