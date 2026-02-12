-- ============================================================================
-- MIGRAÇÃO: Tornar placa opcional - Prefixo é o identificador principal
-- ============================================================================
-- Alguns veículos não terão placa, portanto o prefixo deve ser o identificador
-- principal ao invés da placa
-- ============================================================================

-- 1. Remover constraint UNIQUE da placa
ALTER TABLE veiculos 
DROP CONSTRAINT IF EXISTS veiculos_placa_key;

-- 2. Remover constraint de formato da placa (vamos recriar como opcional)
ALTER TABLE veiculos 
DROP CONSTRAINT IF EXISTS placa_format;

-- 3. Tornar a coluna placa NULLABLE
ALTER TABLE veiculos 
ALTER COLUMN placa DROP NOT NULL;

-- 4. Remover constraint de formato da placa
-- A placa agora pode conter o prefixo (ex: LTS, L888) que não segue o formato padrão
-- Portanto, não aplicamos nenhuma constraint de formato

-- 5. Criar índice parcial UNIQUE para placas não-nulas
-- Isso garante que placas preenchidas continuem únicas, mas permite múltiplos NULLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_veiculos_placa_unique 
ON veiculos(placa) 
WHERE placa IS NOT NULL;

-- 6. Remover índice antigo da placa se existir
DROP INDEX IF EXISTS idx_veiculos_placa;

-- 7. Atualizar função uppercase_text para lidar com placa NULL
CREATE OR REPLACE FUNCTION uppercase_text()
RETURNS TRIGGER AS $$
BEGIN
  -- Veiculos
  IF TG_TABLE_NAME = 'veiculos' THEN
    NEW.prefixo := UPPER(TRIM(NEW.prefixo));
    IF NEW.placa IS NOT NULL THEN
      NEW.placa := UPPER(TRIM(NEW.placa));
    END IF;
    NEW.marca := UPPER(TRIM(NEW.marca));
    NEW.modelo := UPPER(TRIM(NEW.modelo));
    IF NEW.cor IS NOT NULL THEN
      NEW.cor := UPPER(TRIM(NEW.cor));
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

-- 8. Atualizar views para mostrar prefixo como identificador principal
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

-- 9. Atualizar view vw_veiculos_completos se existir
DROP VIEW IF EXISTS vw_veiculos_completos CASCADE;
CREATE OR REPLACE VIEW vw_veiculos_completos AS
SELECT 
  v.id,
  p.nome as prefixo,
  v.placa,
  v.modelo,
  v.nome_motorista,
  v.telefone_motorista,
  v.created_at,
  v.updated_at,
  lt.nome as local_trabalho
FROM veiculos v
LEFT JOIN prefixos p ON v.prefixo_id = p.id
LEFT JOIN locais_trabalho lt ON v.local_trabalho_id = lt.id;

COMMENT ON VIEW vw_veiculos_completos IS 'View com veículos incluindo nomes de prefixo e local de trabalho. Placa é opcional.';

-- 10. Atualizar comentários da tabela
COMMENT ON COLUMN veiculos.prefixo_id IS 'ID do prefixo do veículo (foreign key para prefixos) - IDENTIFICADOR PRINCIPAL';
COMMENT ON COLUMN veiculos.placa IS 'Placa do veículo com hífen (UPPERCASE) - OPCIONAL, alguns veículos não têm placa';

-- 11. Atualizar função de busca por período
CREATE OR REPLACE FUNCTION buscar_ordens_periodo(
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ
)
RETURNS TABLE (
  numero_ordem VARCHAR,
  prefixo VARCHAR,
  placa VARCHAR,
  status status_ordem,
  data_abertura TIMESTAMPTZ,
  data_fechamento TIMESTAMPTZ,
  tempo_parado_horas NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.numero_ordem,
    p.nome as prefixo,
    v.placa,
    o.status,
    o.data_abertura,
    o.data_fechamento,
    ROUND(COALESCE(o.tempo_parado_minutos, 0) / 60.0, 2) AS tempo_parado_horas
  FROM ordens_manutencao o
  INNER JOIN veiculos v ON o.veiculo_id = v.id
  LEFT JOIN prefixos p ON v.prefixo_id = p.id
  WHERE o.data_abertura BETWEEN data_inicio AND data_fim
  ORDER BY o.data_abertura DESC;
END;
$$ LANGUAGE plpgsql;

-- Mensagem de sucesso
DO $$
DECLARE
  count_sem_placa INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_sem_placa FROM veiculos WHERE placa IS NULL;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Migração concluída com sucesso!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'PREFIXO agora é o identificador principal dos veículos';
  RAISE NOTICE 'PLACA agora é OPCIONAL (pode ser NULL)';
  RAISE NOTICE 'Veículos sem placa: %', count_sem_placa;
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Alterações realizadas:';
  RAISE NOTICE '  - Placa agora aceita NULL';
  RAISE NOTICE '  - Constraint UNIQUE da placa removida';
  RAISE NOTICE '  - Índice parcial criado (placas não-nulas continuam únicas)';
  RAISE NOTICE '  - Views atualizadas para priorizar prefixo';
  RAISE NOTICE '  - Funções atualizadas para lidar com placa NULL';
  RAISE NOTICE '============================================================================';
END $$;
