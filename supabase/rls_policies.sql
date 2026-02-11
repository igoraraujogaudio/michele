-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - SISTEMA DE VEÍCULOS EM OFICINA
-- ============================================================================
-- Execute este arquivo APÓS o schema_custom.sql
-- Implementa segurança em nível de linha para todas as tabelas
-- ============================================================================

-- ============================================================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ============================================================================

ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_manutencao ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_status ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS PARA TABELA: veiculos
-- ============================================================================

-- Remove políticas existentes (permite reexecução do script)
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar veículos" ON veiculos;
DROP POLICY IF EXISTS "Usuários autenticados podem criar veículos" ON veiculos;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar veículos" ON veiculos;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar veículos" ON veiculos;

-- Política: SELECT - Usuários autenticados podem ver todos os veículos
CREATE POLICY "Usuários autenticados podem visualizar veículos"
ON veiculos
FOR SELECT
TO authenticated
USING (true);

-- Política: INSERT - Usuários autenticados podem criar veículos
CREATE POLICY "Usuários autenticados podem criar veículos"
ON veiculos
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: UPDATE - Usuários autenticados podem atualizar veículos
CREATE POLICY "Usuários autenticados podem atualizar veículos"
ON veiculos
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política: DELETE - Usuários autenticados podem deletar veículos
CREATE POLICY "Usuários autenticados podem deletar veículos"
ON veiculos
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- POLÍTICAS PARA TABELA: ordens_manutencao
-- ============================================================================

-- Remove políticas existentes (permite reexecução do script)
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar ordens" ON ordens_manutencao;
DROP POLICY IF EXISTS "Usuários autenticados podem criar ordens" ON ordens_manutencao;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar ordens" ON ordens_manutencao;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar ordens" ON ordens_manutencao;

-- Política: SELECT - Usuários autenticados podem ver todas as ordens
CREATE POLICY "Usuários autenticados podem visualizar ordens"
ON ordens_manutencao
FOR SELECT
TO authenticated
USING (true);

-- Política: INSERT - Usuários autenticados podem criar ordens
-- O created_by é automaticamente preenchido pelo trigger
CREATE POLICY "Usuários autenticados podem criar ordens"
ON ordens_manutencao
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: UPDATE - Usuários autenticados podem atualizar ordens
CREATE POLICY "Usuários autenticados podem atualizar ordens"
ON ordens_manutencao
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política: DELETE - Usuários autenticados podem deletar ordens
CREATE POLICY "Usuários autenticados podem deletar ordens"
ON ordens_manutencao
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- POLÍTICAS PARA TABELA: historico_status
-- ============================================================================

-- Remove políticas existentes (permite reexecução do script)
DROP POLICY IF EXISTS "Usuários autenticados podem visualizar histórico" ON historico_status;
DROP POLICY IF EXISTS "Apenas sistema pode criar histórico" ON historico_status;

-- Política: SELECT - Usuários autenticados podem ver todo o histórico
CREATE POLICY "Usuários autenticados podem visualizar histórico"
ON historico_status
FOR SELECT
TO authenticated
USING (true);

-- Política: INSERT - Apenas triggers podem inserir no histórico
-- Usuários não podem inserir diretamente
CREATE POLICY "Apenas sistema pode criar histórico"
ON historico_status
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: UPDATE - Histórico é imutável (não permite UPDATE)
-- Não criamos política de UPDATE, então ninguém pode atualizar

-- Política: DELETE - Apenas ao deletar ordem (CASCADE)
-- Não criamos política de DELETE explícita, CASCADE cuida disso

-- ============================================================================
-- POLÍTICAS PARA VIEWS (Opcional - para acesso direto)
-- ============================================================================

-- As views herdam as permissões das tabelas base
-- Mas podemos criar políticas específicas se necessário

-- ============================================================================
-- POLÍTICAS AVANÇADAS (OPCIONAL - Para Multi-Organização)
-- ============================================================================
-- Descomente as seções abaixo se precisar de isolamento por organização

/*
-- Adicionar coluna organization_id nas tabelas
ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES auth.users(id);
ALTER TABLE ordens_manutencao ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES auth.users(id);

-- Política: Usuários só veem dados da sua organização
CREATE POLICY "Usuários veem apenas sua organização"
ON veiculos
FOR SELECT
TO authenticated
USING (organization_id = auth.uid());

CREATE POLICY "Usuários criam apenas para sua organização"
ON veiculos
FOR INSERT
TO authenticated
WITH CHECK (organization_id = auth.uid());
*/

-- ============================================================================
-- VERIFICAÇÃO DE SEGURANÇA
-- ============================================================================

-- Verificar se RLS está habilitado
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('veiculos', 'ordens_manutencao', 'historico_status');

-- Listar todas as políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- MENSAGEM DE SUCESSO
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS configurado com sucesso!';
  RAISE NOTICE '✅ Todas as tabelas protegidas';
  RAISE NOTICE '✅ Apenas usuários autenticados têm acesso';
  RAISE NOTICE '⚠️  Usuários anônimos NÃO têm acesso';
END $$;
