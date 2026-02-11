-- ============================================================================
-- MIGRAÇÃO: Criar tabelas de prefixos e locais de trabalho
-- ============================================================================
-- Estas tabelas permitem cadastrar prefixos e locais de trabalho separadamente
-- para que os veículos possam selecionar de uma lista pré-cadastrada
-- ============================================================================

-- Tabela de prefixos
CREATE TABLE IF NOT EXISTS prefixos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(20) UNIQUE NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE prefixos IS 'Cadastro de prefixos disponíveis para os veículos';
COMMENT ON COLUMN prefixos.nome IS 'Nome do prefixo (UPPERCASE, único)';
COMMENT ON COLUMN prefixos.ativo IS 'Indica se o prefixo está ativo para uso';

-- Tabela de locais de trabalho
CREATE TABLE IF NOT EXISTS locais_trabalho (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) UNIQUE NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE locais_trabalho IS 'Cadastro de locais de trabalho disponíveis para os veículos';
COMMENT ON COLUMN locais_trabalho.nome IS 'Nome do local de trabalho (UPPERCASE, único)';
COMMENT ON COLUMN locais_trabalho.ativo IS 'Indica se o local está ativo para uso';

-- Índices
CREATE INDEX IF NOT EXISTS idx_prefixos_ativo ON prefixos(ativo);
CREATE INDEX IF NOT EXISTS idx_locais_ativo ON locais_trabalho(ativo);

-- Trigger para uppercase
CREATE OR REPLACE FUNCTION uppercase_cadastros()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'prefixos' THEN
    NEW.nome := UPPER(TRIM(NEW.nome));
    IF NEW.descricao IS NOT NULL THEN
      NEW.descricao := UPPER(TRIM(NEW.descricao));
    END IF;
  END IF;
  
  IF TG_TABLE_NAME = 'locais_trabalho' THEN
    NEW.nome := UPPER(TRIM(NEW.nome));
    IF NEW.descricao IS NOT NULL THEN
      NEW.descricao := UPPER(TRIM(NEW.descricao));
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_uppercase_prefixos
  BEFORE INSERT OR UPDATE ON prefixos
  FOR EACH ROW
  EXECUTE FUNCTION uppercase_cadastros();

CREATE TRIGGER trigger_uppercase_locais
  BEFORE INSERT OR UPDATE ON locais_trabalho
  FOR EACH ROW
  EXECUTE FUNCTION uppercase_cadastros();

-- Trigger para updated_at
CREATE TRIGGER trigger_updated_at_prefixos
  BEFORE UPDATE ON prefixos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_updated_at_locais
  BEFORE UPDATE ON locais_trabalho
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE prefixos ENABLE ROW LEVEL SECURITY;
ALTER TABLE locais_trabalho ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar prefixos"
  ON prefixos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir prefixos"
  ON prefixos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar prefixos"
  ON prefixos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar prefixos"
  ON prefixos FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem visualizar locais"
  ON locais_trabalho FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir locais"
  ON locais_trabalho FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar locais"
  ON locais_trabalho FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar locais"
  ON locais_trabalho FOR DELETE
  USING (auth.role() = 'authenticated');

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migração concluída! Tabelas prefixos e locais_trabalho criadas.';
END $$;
