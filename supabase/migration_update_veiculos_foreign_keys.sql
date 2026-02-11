-- ============================================================================
-- MIGRAÇÃO: Atualizar tabela veiculos para usar foreign keys
-- ============================================================================
-- Transforma prefixo e local_trabalho em foreign keys das tabelas prefixos e locais_trabalho
-- Mantém compatibilidade com dados existentes
-- ============================================================================

-- 1. Adicionar novas colunas de foreign key
ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS prefixo_id UUID REFERENCES prefixos(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS local_trabalho_id UUID REFERENCES locais_trabalho(id) ON DELETE RESTRICT;

-- 2. Migrar dados existentes para as novas colunas
-- Migrar prefixos
UPDATE veiculos 
SET prefixo_id = p.id
FROM prefixos p
WHERE UPPER(TRIM(veiculos.prefixo)) = UPPER(TRIM(p.nome)) AND veiculos.prefixo_id IS NULL;

-- Migrar locais de trabalho
UPDATE veiculos 
SET local_trabalho_id = lt.id
FROM locais_trabalho lt
WHERE UPPER(TRIM(veiculos.local_trabalho)) = UPPER(TRIM(lt.nome)) AND veiculos.local_trabalho_id IS NULL;

-- 3. Criar prefixos e locais para valores que não existem ainda
-- Criar prefixos que não existem na tabela prefixos
INSERT INTO prefixos (nome, descricao, ativo)
SELECT DISTINCT 
  UPPER(TRIM(prefixo)) as nome,
  'Prefixo migrado de veículos' as descricao,
  true as ativo
FROM veiculos v
WHERE NOT EXISTS (
  SELECT 1 FROM prefixos p 
  WHERE UPPER(TRIM(p.nome)) = UPPER(TRIM(v.prefixo))
) AND v.prefixo IS NOT NULL AND v.prefixo_id IS NULL
ON CONFLICT (nome) DO NOTHING;

-- Criar locais que não existem na tabela locais_trabalho
INSERT INTO locais_trabalho (nome, descricao, ativo)
SELECT DISTINCT 
  UPPER(TRIM(local_trabalho)) as nome,
  'Local migrado de veículos' as descricao,
  true as ativo
FROM veiculos v
WHERE NOT EXISTS (
  SELECT 1 FROM locais_trabalho lt 
  WHERE UPPER(TRIM(lt.nome)) = UPPER(TRIM(v.local_trabalho))
) AND v.local_trabalho IS NOT NULL AND v.local_trabalho_id IS NULL
ON CONFLICT (nome) DO NOTHING;

-- 4. Atualizar novamente para garantir que todos os dados foram migrados
UPDATE veiculos 
SET prefixo_id = p.id
FROM prefixos p
WHERE UPPER(TRIM(veiculos.prefixo)) = UPPER(TRIM(p.nome)) AND veiculos.prefixo_id IS NULL;

UPDATE veiculos 
SET local_trabalho_id = lt.id
FROM locais_trabalho lt
WHERE UPPER(TRIM(veiculos.local_trabalho)) = UPPER(TRIM(lt.nome)) AND veiculos.local_trabalho_id IS NULL;

-- 5. Tornar as novas colunas NOT NULL após migração
-- Primeiro, verificar se todos os registros têm valores
DO $$
DECLARE
  count_prefixo_null INTEGER;
  count_local_null INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_prefixo_null FROM veiculos WHERE prefixo_id IS NULL;
  SELECT COUNT(*) INTO count_local_null FROM veiculos WHERE local_trabalho_id IS NULL;
  
  IF count_prefixo_null = 0 THEN
    ALTER TABLE veiculos ALTER COLUMN prefixo_id SET NOT NULL;
    RAISE NOTICE 'prefixo_id agora é NOT NULL';
  ELSE
    RAISE NOTICE 'AVISO: %d veículos ainda sem prefixo_id', count_prefixo_null;
  END IF;
  
  IF count_local_null = 0 THEN
    ALTER TABLE veiculos ALTER COLUMN local_trabalho_id SET NOT NULL;
    RAISE NOTICE 'local_trabalho_id agora é NOT NULL';
  ELSE
    RAISE NOTICE 'AVISO: %d veículos ainda sem local_trabalho_id', count_local_null;
  END IF;
END $$;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_veiculos_prefixo_id ON veiculos(prefixo_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_local_trabalho_id ON veiculos(local_trabalho_id);

-- 7. Criar views para facilitar consultas com nomes legíveis
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

COMMENT ON VIEW vw_veiculos_completos IS 'View com veículos incluindo nomes de prefixo e local de trabalho';

-- 8. Atualizar função uppercase_text para não processar as colunas antigas
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

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migração concluída! Tabela veiculos atualizada com foreign keys.';
  RAISE NOTICE 'Execute SELECT * FROM vw_veiculos_completos para visualizar os dados migrados.';
END $$;
