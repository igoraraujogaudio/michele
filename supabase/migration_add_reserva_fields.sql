-- ============================================================================
-- MIGRAÇÃO: Adicionar campos de reserva e motorista
-- ============================================================================
-- Execute este arquivo se o banco já está criado e você quer apenas
-- adicionar os novos campos sem perder dados
-- ============================================================================

-- Adicionar novos campos na tabela ordens_manutencao
ALTER TABLE ordens_manutencao 
ADD COLUMN IF NOT EXISTS is_reserva BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nome_motorista VARCHAR(200),
ADD COLUMN IF NOT EXISTS telefone_motorista VARCHAR(20),
ADD COLUMN IF NOT EXISTS tempo_editado_manualmente BOOLEAN NOT NULL DEFAULT FALSE;

-- Comentários dos novos campos
COMMENT ON COLUMN ordens_manutencao.is_reserva IS 'Indica se é uma reserva de veículo (TRUE) ou manutenção real (FALSE)';
COMMENT ON COLUMN ordens_manutencao.nome_motorista IS 'Nome do motorista (opcional)';
COMMENT ON COLUMN ordens_manutencao.telefone_motorista IS 'Telefone do motorista (opcional)';
COMMENT ON COLUMN ordens_manutencao.tempo_editado_manualmente IS 'Indica se o tempo foi editado manualmente pelo usuário';

-- Atualizar a função uppercase_text para incluir nome_motorista
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

-- Atualizar a função controlar_fechamento_ordem para respeitar edição manual
CREATE OR REPLACE FUNCTION controlar_fechamento_ordem()
RETURNS TRIGGER AS $$
BEGIN
  -- Se status mudou para PRONTO ou REPARO PARCIAL
  IF NEW.status IN ('PRONTO', 'REPARO PARCIAL') AND 
     (OLD.status IS NULL OR OLD.status NOT IN ('PRONTO', 'REPARO PARCIAL')) THEN
    
    -- Define data de fechamento se ainda não foi definida
    IF NEW.data_fechamento IS NULL THEN
      NEW.data_fechamento := NOW();
    END IF;
    
    -- Calcula tempo parado em minutos APENAS se não foi editado manualmente
    -- Usa FLOOR()::INTEGER para conversão explícita
    IF NOT NEW.tempo_editado_manualmente THEN
      NEW.tempo_parado_minutos := FLOOR(EXTRACT(EPOCH FROM (NEW.data_fechamento - NEW.data_abertura)) / 60)::INTEGER;
    END IF;
    
  -- Se status voltou de PRONTO/REPARO PARCIAL para outro
  ELSIF OLD.status IN ('PRONTO', 'REPARO PARCIAL') AND 
        NEW.status NOT IN ('PRONTO', 'REPARO PARCIAL') THEN
    
    -- Remove data de fechamento (mas mantém tempo se foi editado manualmente)
    NEW.data_fechamento := NULL;
    IF NOT NEW.tempo_editado_manualmente THEN
      NEW.tempo_parado_minutos := NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migração concluída com sucesso! Novos campos adicionados.';
END $$;
