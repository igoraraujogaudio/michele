-- ============================================================================
-- MIGRAÇÃO: Remover colunas antigas da tabela veiculos
-- ============================================================================
-- ATENÇÃO: Execute esta migration APÓS executar a migration_update_veiculos_foreign_keys.sql
-- e verificar que todos os dados foram migrados corretamente
-- ============================================================================

-- Verificar se todos os registros têm prefixo_id e local_trabalho antes de remover as colunas antigas
DO $$
DECLARE
  count_prefixo_null INTEGER;
  count_local_null INTEGER;
  total_records INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_prefixo_null FROM veiculos WHERE prefixo_id IS NULL;
  SELECT COUNT(*) INTO count_local_null FROM veiculos WHERE local_trabalho_id IS NULL;
  SELECT COUNT(*) INTO total_records FROM veiculos;
  
  RAISE NOTICE 'Total de veículos: %', total_records;
  RAISE NOTICE 'Veículos sem prefixo_id: %', count_prefixo_null;
  RAISE NOTICE 'Veículos sem local_trabalho_id: %', count_local_null;
  
  IF count_prefixo_null > 0 OR count_local_null > 0 THEN
    RAISE EXCEPTION 'ERRO: Existem veículos sem prefixo_id ou local_trabalho_id. Execute a migration_update_veiculos_foreign_keys.sql primeiro.';
  END IF;
END $$;

-- Atualizar views que dependem das colunas antigas antes de removê-las
-- Drop views existentes para garantir recriação limpa
DROP VIEW IF EXISTS v_ordens_abertas CASCADE;
DROP VIEW IF EXISTS v_ordens_finalizadas CASCADE;
DROP VIEW IF EXISTS v_resumo_veiculos CASCADE;
DROP VIEW IF EXISTS v_historico_completo CASCADE;
DROP VIEW IF EXISTS vw_veiculos_disponiveis CASCADE;

-- View: v_ordens_abertas
CREATE OR REPLACE VIEW v_ordens_abertas AS
SELECT 
  o.id,
  o.numero_ordem,
  p.nome as prefixo,
  v.placa,
  v.marca,
  v.modelo,
  o.status,
  o.descricao,
  o.data_abertura,
  EXTRACT(EPOCH FROM (NOW() - o.data_abertura)) / 60 AS tempo_parado_minutos_atual,
  ROUND(EXTRACT(EPOCH FROM (NOW() - o.data_abertura)) / 3600, 2) AS tempo_parado_horas_atual,
  o.observacoes
FROM ordens_manutencao o
INNER JOIN veiculos v ON o.veiculo_id = v.id
LEFT JOIN prefixos p ON v.prefixo_id = p.id
WHERE o.data_fechamento IS NULL
ORDER BY o.data_abertura ASC;

-- View: v_ordens_finalizadas
CREATE OR REPLACE VIEW v_ordens_finalizadas AS
SELECT 
  o.id,
  o.numero_ordem,
  p.nome as prefixo,
  v.placa,
  v.marca,
  v.modelo,
  o.status,
  o.descricao,
  o.data_abertura,
  o.data_fechamento,
  o.tempo_parado_minutos,
  ROUND(o.tempo_parado_minutos / 60.0, 2) AS tempo_parado_horas,
  o.observacoes
FROM ordens_manutencao o
INNER JOIN veiculos v ON o.veiculo_id = v.id
LEFT JOIN prefixos p ON v.prefixo_id = p.id
WHERE o.data_fechamento IS NOT NULL
ORDER BY o.data_fechamento DESC;

-- View: v_resumo_veiculos
CREATE OR REPLACE VIEW v_resumo_veiculos AS
SELECT 
  v.id,
  p.nome as prefixo,
  v.placa,
  v.marca,
  v.modelo,
  COUNT(o.id) AS total_ordens,
  COUNT(CASE WHEN o.data_fechamento IS NULL THEN 1 END) AS ordens_abertas,
  COUNT(CASE WHEN o.data_fechamento IS NOT NULL THEN 1 END) AS ordens_finalizadas,
  COALESCE(SUM(o.tempo_parado_minutos), 0) AS total_tempo_parado_minutos,
  ROUND(COALESCE(SUM(o.tempo_parado_minutos), 0) / 60.0, 2) AS total_tempo_parado_horas,
  ROUND(COALESCE(AVG(o.tempo_parado_minutos), 0), 2) AS media_tempo_parado_minutos
FROM veiculos v
LEFT JOIN ordens_manutencao o ON v.id = o.veiculo_id
LEFT JOIN prefixos p ON v.prefixo_id = p.id
GROUP BY v.id, p.nome, v.placa, v.marca, v.modelo
ORDER BY p.nome;

-- View: v_historico_completo
CREATE OR REPLACE VIEW v_historico_completo AS
SELECT 
  h.id,
  h.ordem_id,
  o.numero_ordem,
  p.nome as prefixo,
  v.placa,
  h.status_anterior,
  h.status_novo,
  h.data_mudanca,
  h.observacao,
  EXTRACT(EPOCH FROM (
    LEAD(h.data_mudanca) OVER (PARTITION BY h.ordem_id ORDER BY h.data_mudanca) - h.data_mudanca
  )) / 60 AS minutos_neste_status
FROM historico_status h
INNER JOIN ordens_manutencao o ON h.ordem_id = o.id
INNER JOIN veiculos v ON o.veiculo_id = v.id
LEFT JOIN prefixos p ON v.prefixo_id = p.id
ORDER BY h.ordem_id, h.data_mudanca;

-- View: vw_veiculos_disponiveis
CREATE OR REPLACE VIEW vw_veiculos_disponiveis AS
SELECT 
  v.id AS veiculo_id,
  p.nome as prefixo,
  v.placa,
  v.marca,
  v.modelo,
  v.ano,
  v.cor,
  lt.nome as local_trabalho,
  -- Última manutenção (se existir)
  (
    SELECT MAX(om.data_abertura)
    FROM ordens_manutencao om
    WHERE om.veiculo_id = v.id
      AND om.data_fechamento IS NOT NULL
  ) AS data_ultima_manutencao,
  -- Tempo total em manutenção (horas)
  COALESCE(
    (
      SELECT SUM(om.tempo_parado_minutos) / 60.0
      FROM ordens_manutencao om
      WHERE om.veiculo_id = v.id
        AND om.data_fechamento IS NOT NULL
    ), 0
  ) AS total_horas_manutencao,
  -- Quantidade de manutenções realizadas
  (
    SELECT COUNT(*)
    FROM ordens_manutencao om
    WHERE om.veiculo_id = v.id
      AND om.data_fechamento IS NOT NULL
  ) AS qtde_manutencoes
FROM veiculos v
LEFT JOIN prefixos p ON v.prefixo_id = p.id
LEFT JOIN locais_trabalho lt ON v.local_trabalho_id = lt.id
WHERE NOT EXISTS (
  SELECT 1
  FROM ordens_manutencao om
  WHERE om.veiculo_id = v.id
    AND om.data_fechamento IS NULL
)
ORDER BY p.nome ASC;

-- Remover colunas antigas
ALTER TABLE veiculos 
DROP COLUMN IF EXISTS prefixo,
DROP COLUMN IF EXISTS local_trabalho;

-- Atualizar função uppercase_text para não referenciar as colunas removidas
CREATE OR REPLACE FUNCTION uppercase_text()
RETURNS TRIGGER AS $$
BEGIN
  -- Veiculos
  IF TG_TABLE_NAME = 'veiculos' THEN
    NEW.placa := UPPER(TRIM(NEW.placa));
    IF NEW.modelo IS NOT NULL THEN
      NEW.modelo := UPPER(TRIM(NEW.modelo));
    END IF;
    IF NEW.nome_motorista IS NOT NULL THEN
      NEW.nome_motorista := UPPER(TRIM(NEW.nome_motorista));
    END IF;
  END IF;
  
  -- Prefixos
  IF TG_TABLE_NAME = 'prefixos' THEN
    NEW.nome := UPPER(TRIM(NEW.nome));
    IF NEW.descricao IS NOT NULL THEN
      NEW.descricao := UPPER(TRIM(NEW.descricao));
    END IF;
  END IF;
  
  -- Locais de trabalho
  IF TG_TABLE_NAME = 'locais_trabalho' THEN
    NEW.nome := UPPER(TRIM(NEW.nome));
    IF NEW.descricao IS NOT NULL THEN
      NEW.descricao := UPPER(TRIM(NEW.descricao));
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

-- Atualizar view vw_veiculos_completos para não referenciar colunas removidas
CREATE OR REPLACE VIEW vw_veiculos_completos AS
SELECT 
  v.id,
  v.placa,
  v.modelo,
  v.nome_motorista,
  v.telefone_motorista,
  v.created_at,
  v.updated_at,
  p.nome as prefixo,
  lt.nome as local_trabalho
FROM veiculos v
LEFT JOIN prefixos p ON v.prefixo_id = p.id
LEFT JOIN locais_trabalho lt ON v.local_trabalho_id = lt.id;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Colunas antigas removidas com sucesso!';
  RAISE NOTICE 'Tabela veiculos agora usa apenas prefixo_id e local_trabalho_id.';
END $$;
