-- ============================================================================
-- MIGRAÇÃO: Adicionar campo local_trabalho na tabela veiculos
-- ============================================================================

-- Adicionar campo local_trabalho
ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS local_trabalho VARCHAR(200);

-- Comentário do novo campo
COMMENT ON COLUMN veiculos.local_trabalho IS 'Local de trabalho do veículo (UPPERCASE)';

-- Atualizar a função uppercase_text para incluir local_trabalho
CREATE OR REPLACE FUNCTION uppercase_text()
RETURNS TRIGGER AS $$
BEGIN
  -- Veiculos
  IF TG_TABLE_NAME = 'veiculos' THEN
    NEW.prefixo := UPPER(TRIM(NEW.prefixo));
    NEW.placa := UPPER(TRIM(NEW.placa));
    NEW.marca := UPPER(TRIM(NEW.marca));
    NEW.modelo := UPPER(TRIM(NEW.modelo));
    IF NEW.cor IS NOT NULL THEN
      NEW.cor := UPPER(TRIM(NEW.cor));
    END IF;
    IF NEW.local_trabalho IS NOT NULL THEN
      NEW.local_trabalho := UPPER(TRIM(NEW.local_trabalho));
    END IF;
  END IF;
  
  -- Ordens de manutenção
  IF TG_TABLE_NAME = 'ordens_manutencao' THEN
    NEW.numero_ordem := UPPER(TRIM(NEW.numero_ordem));
    NEW.descricao := UPPER(TRIM(NEW.descricao));
    IF NEW.observacoes IS NOT NULL THEN
      NEW.observacoes := UPPER(TRIM(NEW.observacoes));
    END IF;
    IF NEW.nome_motorista IS NOT NULL THEN
      NEW.nome_motorista := UPPER(TRIM(NEW.nome_motorista));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atualizar a view vw_veiculos_disponiveis para incluir local_trabalho
CREATE OR REPLACE VIEW vw_veiculos_disponiveis AS
SELECT 
  v.id AS veiculo_id,
  v.prefixo,
  v.placa,
  v.marca,
  v.modelo,
  v.ano,
  v.cor,
  v.local_trabalho,
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

COMMENT ON VIEW vw_veiculos_disponiveis IS 'View otimizada para relatório de veículos disponíveis com histórico de manutenções e local de trabalho';

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migração concluída! Campo local_trabalho adicionado à tabela veiculos e view atualizada.';
END $$;
