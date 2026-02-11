-- ============================================================================
-- MIGRAÇÃO: Adicionar campo veiculo_reserva_id para indicar qual veículo substituiu
-- ============================================================================
-- Este campo indica qual veículo foi usado como reserva para substituir o veículo em manutenção
-- Exemplo: Se V001 está em manutenção e V005 foi usado como reserva, veiculo_reserva_id = id de V005
-- ============================================================================

ALTER TABLE ordens_manutencao 
ADD COLUMN IF NOT EXISTS veiculo_reserva_id UUID REFERENCES veiculos(id) ON DELETE SET NULL;

COMMENT ON COLUMN ordens_manutencao.veiculo_reserva_id IS 'ID do veículo que foi usado como reserva para substituir o veículo em manutenção';

-- Criar índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_ordens_veiculo_reserva ON ordens_manutencao(veiculo_reserva_id);

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migração concluída! Campo veiculo_reserva_id adicionado à tabela ordens_manutencao.';
END $$;
