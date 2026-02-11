-- ============================================================================
-- SCHEMA SQL COMPLETO - SISTEMA DE CONTROLE DE VEÍCULOS EM OFICINA
-- ============================================================================
-- Requisitos:
-- - Prefixo único
-- - Placa única (com hífen)
-- - Todo texto em UPPERCASE
-- - Controle automático de tempo parado
-- - Impedir ordens duplicadas abertas para mesmo veículo
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Para gen_random_uuid()

-- ============================================================================
-- TIPOS ENUMERADOS
-- ============================================================================

-- Remove o tipo se já existir (permite reexecução do script)
DROP TYPE IF EXISTS status_ordem CASCADE;

CREATE TYPE status_ordem AS ENUM (
  'EM MANUTENÇÃO',
  'AGUARDANDO PEÇA',
  'REPARO PARCIAL',
  'PRONTO',
  'FORNECEDOR EXTERNO',
  'PARADO PRONTO CJ',
  'PARADO PRONTO CG',
  'PARADO EM MANUTENÇÃO CJ',
  'PARADO EM MANUTENÇÃO CG'
);

-- ============================================================================
-- TABELA: veiculos
-- ============================================================================

-- Remove tabelas se já existirem (permite reexecução do script)
-- ATENÇÃO: CASCADE remove TODOS os dados relacionados
DROP TABLE IF EXISTS historico_status CASCADE;
DROP TABLE IF EXISTS ordens_manutencao CASCADE;
DROP TABLE IF EXISTS veiculos CASCADE;

CREATE TABLE veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prefixo VARCHAR(20) UNIQUE NOT NULL,
  placa VARCHAR(8) UNIQUE NOT NULL, -- Formato: ABC-1234 (hífen obrigatório)
  marca VARCHAR(100) NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  ano INTEGER NOT NULL,
  cor VARCHAR(50),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT prefixo_not_empty CHECK (LENGTH(TRIM(prefixo)) > 0),
  CONSTRAINT placa_format CHECK (placa ~ '^[A-Z]{3}-[0-9][A-Z0-9][0-9]{2}$'),
  CONSTRAINT ano_valido CHECK (ano >= 1900 AND ano <= 2100)
);

-- Comentários
COMMENT ON TABLE veiculos IS 'Cadastro de veículos da oficina';
COMMENT ON COLUMN veiculos.prefixo IS 'Prefixo único do veículo (UPPERCASE)';
COMMENT ON COLUMN veiculos.placa IS 'Placa do veículo com hífen (UPPERCASE)';

-- ============================================================================
-- TABELA: ordens_manutencao
-- ============================================================================

CREATE TABLE ordens_manutencao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_ordem VARCHAR(20) UNIQUE NOT NULL,
  veiculo_id UUID NOT NULL REFERENCES veiculos(id) ON DELETE RESTRICT,
  status status_ordem NOT NULL DEFAULT 'EM MANUTENÇÃO',
  descricao TEXT NOT NULL,
  observacoes TEXT,
  
  -- Reserva de veículo
  is_reserva BOOLEAN NOT NULL DEFAULT FALSE,
  nome_motorista VARCHAR(200),
  telefone_motorista VARCHAR(20),
  
  -- Controle de tempo
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_fechamento TIMESTAMPTZ,
  tempo_parado_minutos INTEGER, -- Calculado automaticamente ou editado manualmente
  tempo_editado_manualmente BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Auditoria
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT descricao_not_empty CHECK (LENGTH(TRIM(descricao)) > 0),
  CONSTRAINT data_fechamento_valida CHECK (data_fechamento IS NULL OR data_fechamento >= data_abertura),
  CONSTRAINT tempo_parado_positivo CHECK (tempo_parado_minutos IS NULL OR tempo_parado_minutos >= 0)
);

-- Comentários
COMMENT ON TABLE ordens_manutencao IS 'Ordens de manutenção dos veículos';
COMMENT ON COLUMN ordens_manutencao.is_reserva IS 'Indica se é uma reserva de veículo (TRUE) ou manutenção real (FALSE)';
COMMENT ON COLUMN ordens_manutencao.nome_motorista IS 'Nome do motorista (opcional)';
COMMENT ON COLUMN ordens_manutencao.telefone_motorista IS 'Telefone do motorista (opcional)';
COMMENT ON COLUMN ordens_manutencao.tempo_parado_minutos IS 'Tempo total parado em minutos (calculado automaticamente ou editado manualmente)';
COMMENT ON COLUMN ordens_manutencao.tempo_editado_manualmente IS 'Indica se o tempo foi editado manualmente pelo usuário';
COMMENT ON COLUMN ordens_manutencao.data_fechamento IS 'Preenchido quando status = PRONTO ou REPARO PARCIAL';

-- ============================================================================
-- TABELA: historico_status
-- ============================================================================

CREATE TABLE historico_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_id UUID NOT NULL REFERENCES ordens_manutencao(id) ON DELETE CASCADE,
  status_anterior status_ordem,
  status_novo status_ordem NOT NULL,
  data_mudanca TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observacao TEXT,
  changed_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT status_diferente CHECK (status_anterior IS DISTINCT FROM status_novo)
);

-- Comentários
COMMENT ON TABLE historico_status IS 'Histórico de mudanças de status das ordens';
COMMENT ON COLUMN historico_status.status_anterior IS 'Status anterior (NULL na criação)';

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices em veiculos
CREATE INDEX idx_veiculos_prefixo ON veiculos(prefixo);
CREATE INDEX idx_veiculos_placa ON veiculos(placa);
CREATE INDEX idx_veiculos_marca_modelo ON veiculos(marca, modelo);

-- Índices em ordens_manutencao
CREATE INDEX idx_ordens_veiculo ON ordens_manutencao(veiculo_id);
CREATE INDEX idx_ordens_status ON ordens_manutencao(status);
CREATE INDEX idx_ordens_numero ON ordens_manutencao(numero_ordem);
CREATE INDEX idx_ordens_abertas ON ordens_manutencao(veiculo_id, status) 
  WHERE data_fechamento IS NULL;
CREATE INDEX idx_ordens_data_abertura ON ordens_manutencao(data_abertura DESC);

-- Índice parcial otimizado para dashboards (ordens abertas por status)
CREATE INDEX idx_ordens_status_abertas ON ordens_manutencao(status)
  WHERE data_fechamento IS NULL;

-- Índices em historico_status
CREATE INDEX idx_historico_ordem ON historico_status(ordem_id);
CREATE INDEX idx_historico_data ON historico_status(data_mudanca DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Converter texto para UPPERCASE
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

COMMENT ON FUNCTION uppercase_text() IS 'Converte automaticamente texto para UPPERCASE';

-- Function: Atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Registrar histórico de status
CREATE OR REPLACE FUNCTION registrar_historico_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Na criação da ordem
  IF TG_OP = 'INSERT' THEN
    INSERT INTO historico_status (ordem_id, status_anterior, status_novo, changed_by)
    VALUES (NEW.id, NULL, NEW.status, NEW.created_by);
    
  -- Na atualização do status
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO historico_status (ordem_id, status_anterior, status_novo, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.created_by);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION registrar_historico_status() IS 'Registra automaticamente mudanças de status no histórico';

-- Function: Controlar fechamento automático da ordem
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

COMMENT ON FUNCTION controlar_fechamento_ordem() IS 'Controla automaticamente fechamento e cálculo de tempo parado';

-- Function: Validar ordem única aberta por veículo
CREATE OR REPLACE FUNCTION validar_ordem_unica_aberta()
RETURNS TRIGGER AS $$
DECLARE
  ordens_abertas INTEGER;
BEGIN
  -- Valida SEMPRE que a ordem estiver aberta (data_fechamento IS NULL)
  -- Isso previne edge cases de reabertura manual de ordens
  IF NEW.data_fechamento IS NULL THEN
    
    -- Conta quantas ordens abertas existem para o veículo
    SELECT COUNT(*)
    INTO ordens_abertas
    FROM ordens_manutencao
    WHERE veiculo_id = NEW.veiculo_id
      AND data_fechamento IS NULL
      AND id <> NEW.id;
    
    -- Se já existe ordem aberta, impede a criação/atualização
    IF ordens_abertas > 0 THEN
      RAISE EXCEPTION 'Veículo já possui uma ordem de manutenção aberta. Finalize a ordem existente antes de criar uma nova.'
        USING ERRCODE = '23505', -- unique_violation
              HINT = 'Verifique as ordens abertas para este veículo';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_ordem_unica_aberta() IS 'Impede que o mesmo veículo tenha duas ordens abertas simultaneamente. Valida sempre que data_fechamento IS NULL.';

-- Function: Calcular tempo parado atual (para consultas)
CREATE OR REPLACE FUNCTION calcular_tempo_parado_atual(ordem_id UUID)
RETURNS INTEGER AS $$
DECLARE
  ordem RECORD;
  tempo_minutos INTEGER;
BEGIN
  SELECT data_abertura, data_fechamento, tempo_parado_minutos
  INTO ordem
  FROM ordens_manutencao
  WHERE id = ordem_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Se já está fechada, retorna o tempo calculado
  IF ordem.data_fechamento IS NOT NULL THEN
    RETURN ordem.tempo_parado_minutos;
  END IF;
  
  -- Se ainda está aberta, calcula tempo até agora
  tempo_minutos := EXTRACT(EPOCH FROM (NOW() - ordem.data_abertura)) / 60;
  
  RETURN tempo_minutos;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_tempo_parado_atual(UUID) IS 'Calcula tempo parado atual de uma ordem (em minutos)';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: UPPERCASE em veiculos
CREATE TRIGGER trigger_uppercase_veiculos
  BEFORE INSERT OR UPDATE ON veiculos
  FOR EACH ROW
  EXECUTE FUNCTION uppercase_text();

-- Trigger: UPPERCASE em ordens_manutencao
CREATE TRIGGER trigger_uppercase_ordens
  BEFORE INSERT OR UPDATE ON ordens_manutencao
  FOR EACH ROW
  EXECUTE FUNCTION uppercase_text();

-- Trigger: Atualizar updated_at em veiculos
CREATE TRIGGER trigger_updated_at_veiculos
  BEFORE UPDATE ON veiculos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger: Atualizar updated_at em ordens_manutencao
CREATE TRIGGER trigger_updated_at_ordens
  BEFORE UPDATE ON ordens_manutencao
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Trigger: Registrar histórico de status (INSERT)
CREATE TRIGGER trigger_historico_insert
  AFTER INSERT ON ordens_manutencao
  FOR EACH ROW
  EXECUTE FUNCTION registrar_historico_status();

-- Trigger: Registrar histórico de status (UPDATE - apenas quando status muda)
CREATE TRIGGER trigger_historico_update
  AFTER UPDATE OF status ON ordens_manutencao
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION registrar_historico_status();

-- Trigger: Controlar fechamento automático
CREATE TRIGGER trigger_fechamento_ordem
  BEFORE INSERT OR UPDATE ON ordens_manutencao
  FOR EACH ROW
  EXECUTE FUNCTION controlar_fechamento_ordem();

-- Trigger: Validar ordem única aberta (BEFORE para impedir inserção)
CREATE TRIGGER trigger_validar_ordem_unica
  BEFORE INSERT OR UPDATE ON ordens_manutencao
  FOR EACH ROW
  EXECUTE FUNCTION validar_ordem_unica_aberta();

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View: Ordens abertas com tempo atual
CREATE OR REPLACE VIEW v_ordens_abertas AS
SELECT 
  o.id,
  o.numero_ordem,
  v.prefixo,
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
WHERE o.data_fechamento IS NULL
ORDER BY o.data_abertura ASC;

COMMENT ON VIEW v_ordens_abertas IS 'Ordens abertas com cálculo de tempo parado em tempo real';

-- View: Ordens finalizadas com tempo total
CREATE OR REPLACE VIEW v_ordens_finalizadas AS
SELECT 
  o.id,
  o.numero_ordem,
  v.prefixo,
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
WHERE o.data_fechamento IS NOT NULL
ORDER BY o.data_fechamento DESC;

COMMENT ON VIEW v_ordens_finalizadas IS 'Ordens finalizadas com tempo total parado';

-- View: Resumo por veículo
CREATE OR REPLACE VIEW v_resumo_veiculos AS
SELECT 
  v.id,
  v.prefixo,
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
GROUP BY v.id, v.prefixo, v.placa, v.marca, v.modelo
ORDER BY v.prefixo;

COMMENT ON VIEW v_resumo_veiculos IS 'Resumo estatístico por veículo';

-- View: Histórico completo de uma ordem
CREATE OR REPLACE VIEW v_historico_completo AS
SELECT 
  h.id,
  h.ordem_id,
  o.numero_ordem,
  v.prefixo,
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
ORDER BY h.ordem_id, h.data_mudanca;

COMMENT ON VIEW v_historico_completo IS 'Histórico completo com tempo em cada status';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_manutencao ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_status ENABLE ROW LEVEL SECURITY;

-- Políticas para veiculos
CREATE POLICY "Usuários autenticados podem visualizar veículos"
  ON veiculos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir veículos"
  ON veiculos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar veículos"
  ON veiculos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar veículos"
  ON veiculos FOR DELETE
  USING (auth.role() = 'authenticated');

-- Políticas para ordens_manutencao
CREATE POLICY "Usuários autenticados podem visualizar ordens"
  ON ordens_manutencao FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem inserir ordens"
  ON ordens_manutencao FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar ordens"
  ON ordens_manutencao FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem deletar ordens"
  ON ordens_manutencao FOR DELETE
  USING (auth.role() = 'authenticated');

-- Políticas para historico_status
CREATE POLICY "Usuários autenticados podem visualizar histórico"
  ON historico_status FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Sistema pode inserir histórico"
  ON historico_status FOR INSERT
  WITH CHECK (true); -- Trigger insere automaticamente

-- ============================================================================
-- DADOS DE EXEMPLO (OPCIONAL - COMENTAR EM PRODUÇÃO)
-- ============================================================================

/*
-- Inserir veículos de exemplo
INSERT INTO veiculos (prefixo, placa, marca, modelo, ano, cor) VALUES
('V001', 'ABC-1234', 'volkswagen', 'gol', 2020, 'branco'),
('V002', 'XYZ-5678', 'fiat', 'uno', 2019, 'prata'),
('V003', 'DEF-9012', 'chevrolet', 'onix', 2021, 'preto');

-- Inserir ordem de exemplo
INSERT INTO ordens_manutencao (numero_ordem, veiculo_id, descricao, status)
SELECT 'OM-001', id, 'troca de óleo e filtros', 'EM MANUTENÇÃO'
FROM veiculos WHERE prefixo = 'V001';
*/

-- ============================================================================
-- FUNÇÕES AUXILIARES PARA RELATÓRIOS
-- ============================================================================

-- Function: Buscar ordens por período
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
    v.prefixo,
    v.placa,
    o.status,
    o.data_abertura,
    o.data_fechamento,
    ROUND(COALESCE(o.tempo_parado_minutos, 0) / 60.0, 2) AS tempo_parado_horas
  FROM ordens_manutencao o
  INNER JOIN veiculos v ON o.veiculo_id = v.id
  WHERE o.data_abertura BETWEEN data_inicio AND data_fim
  ORDER BY o.data_abertura DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_ordens_periodo(TIMESTAMPTZ, TIMESTAMPTZ) IS 'Busca ordens em um período específico';

-- ============================================================================
-- ÍNDICES ADICIONAIS PARA RELATÓRIOS
-- ============================================================================

CREATE INDEX idx_ordens_periodo ON ordens_manutencao(data_abertura, data_fechamento);
CREATE INDEX idx_historico_periodo ON historico_status(data_mudanca);

-- ============================================================================
-- GRANTS (Ajustar conforme necessário)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================

-- Verificar criação das tabelas
DO $$
BEGIN
  RAISE NOTICE 'Schema criado com sucesso!';
  RAISE NOTICE 'Tabelas: veiculos, ordens_manutencao, historico_status';
  RAISE NOTICE 'Views: v_ordens_abertas, v_ordens_finalizadas, v_resumo_veiculos, v_historico_completo';
  RAISE NOTICE 'Triggers: UPPERCASE automático, controle de tempo, validação de ordem única';
END $$;
