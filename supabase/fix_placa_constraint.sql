-- ============================================================================
-- FIX: Remover constraint de formato da placa
-- ============================================================================
-- A placa agora pode conter o prefixo (ex: LTS, L888) que não segue o formato
-- padrão de placa brasileira (ABC-1234). Portanto, removemos a constraint.
-- ============================================================================

-- Remover constraint de formato se existir
ALTER TABLE veiculos 
DROP CONSTRAINT IF EXISTS placa_format_opcional;

-- Remover constraint antiga de formato se existir
ALTER TABLE veiculos 
DROP CONSTRAINT IF EXISTS placa_format;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Constraint de formato da placa removida com sucesso!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'A coluna placa agora aceita qualquer texto (ex: LTS, L888, ABC-1234).';
  RAISE NOTICE 'Isso permite usar o prefixo como placa quando o veículo não tem placa real.';
  RAISE NOTICE '============================================================================';
END $$;
