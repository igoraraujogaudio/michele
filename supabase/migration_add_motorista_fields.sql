-- ============================================================================
-- MIGRAÇÃO: Adicionar campos nome_motorista e telefone_motorista na tabela veiculos
-- ============================================================================

ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS nome_motorista VARCHAR(200);

ALTER TABLE veiculos 
ADD COLUMN IF NOT EXISTS telefone_motorista VARCHAR(30);

COMMENT ON COLUMN veiculos.nome_motorista IS 'Nome do motorista responsável pelo veículo (UPPERCASE)';
COMMENT ON COLUMN veiculos.telefone_motorista IS 'Telefone do motorista responsável pelo veículo';

-- Permitir marca como NULL (campo não utilizado no formulário)
ALTER TABLE veiculos ALTER COLUMN marca DROP NOT NULL;
