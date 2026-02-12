-- ============================================================================
-- FIX: Corrigir função uppercase_text para não referenciar coluna prefixo
-- ============================================================================
-- A coluna prefixo não existe mais na tabela veiculos (foi substituída por prefixo_id)
-- Esta migration corrige a função uppercase_text para não tentar acessar essa coluna
-- ============================================================================

CREATE OR REPLACE FUNCTION uppercase_text()
RETURNS TRIGGER AS $$
BEGIN
  -- Veiculos
  IF TG_TABLE_NAME = 'veiculos' THEN
    IF NEW.placa IS NOT NULL THEN
      NEW.placa := UPPER(TRIM(NEW.placa));
    END IF;
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
  
  -- Gerências
  IF TG_TABLE_NAME = 'gerencias' THEN
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
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Função uppercase_text() corrigida com sucesso!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'A função não tenta mais acessar a coluna "prefixo" que não existe.';
  RAISE NOTICE 'Agora ela trabalha corretamente com prefixo_id.';
  RAISE NOTICE '============================================================================';
END $$;
