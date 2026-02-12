# Implementação de Gerências e Atualização de Veículos

## Resumo das Mudanças

### 1. **Prefixo agora é OPCIONAL**
- O campo `prefixo_id` não é mais obrigatório
- Veículos podem ser cadastrados sem prefixo

### 2. **Status do Veículo Automático**
- **Status padrão**: `OPERAÇÃO`
- **Mudança automática para `MANUTENÇÃO`**: Quando uma ordem de manutenção é criada
- **Mudança automática para `OPERAÇÃO`**: Quando a ordem é fechada (status PRONTO ou REPARO PARCIAL)

### 3. **Novo Campo: Gerência**
- Adicionado campo `gerencia_id` na tabela `veiculos`
- Campo opcional para associar veículos a gerências

## Arquivos Criados

### Componentes
- `src/components/gerencias/GerenciaForm.tsx` - Formulário de cadastro/edição
- `src/components/gerencias/GerenciaTable.tsx` - Tabela de listagem

### Páginas
- `src/app/cadastros/gerencias/page.tsx` - Página principal de gerências
- `src/app/cadastros/gerencias/[id]/edit/page.tsx` - Página de edição

### Actions
- `src/lib/actions/gerencias.actions.ts` - CRUD completo de gerências

### Banco de Dados
- `database-migration-gerencias.sql` - Script de migração

## Arquivos Modificados

### Schemas e Types
- `src/lib/validations/schemas.ts`
  - Adicionado `statusVeiculoSchema`
  - Adicionado `gerenciaSchema` e `updateGerenciaSchema`
  - Atualizado `veiculoSchema` para usar `prefixo_id` e `local_trabalho_id` (opcionais)
  - Adicionado campo `gerencia_id` (opcional)
  - Adicionado campo `status` com default 'OPERAÇÃO'

- `src/lib/types/database.types.ts`
  - Adicionado type `StatusVeiculo`
  - Adicionado interface `Gerencia`
  - Atualizado interface `Veiculo` com `gerencia_id` e `status`
  - Adicionado `CreateGerenciaDTO` e `UpdateGerenciaDTO`
  - Atualizado `CreateVeiculoDTO` e `UpdateVeiculoDTO`

### Actions
- `src/lib/actions/veiculos.actions.ts`
  - Removida validação de unicidade de prefixo (agora é opcional)

- `src/lib/actions/ordens.actions.ts`
  - **createOrdemManutencao**: Atualiza status do veículo para 'MANUTENÇÃO'
  - **updateOrdemStatus**: Atualiza status do veículo para 'OPERAÇÃO' quando ordem é fechada

### Componentes
- `src/components/veiculos/VeiculoForm.tsx`
  - Campo `prefixo_id` agora é opcional (dropdown)
  - Campo `local_trabalho_id` agora é opcional (dropdown)
  - Adicionado campo `gerencia_id` (dropdown opcional)
  - Carrega lista de gerências ativas

## Migração do Banco de Dados

Execute o arquivo `database-migration-gerencias.sql` no Supabase:

```sql
-- Cria tabela gerencias
-- Adiciona colunas gerencia_id e status em veiculos
-- Remove constraint NOT NULL de prefixo_id e local_trabalho_id
-- Adiciona constraint de check para status
-- Cria índices e políticas RLS
```

### Principais alterações:
1. **Nova tabela**: `gerencias`
2. **Novas colunas em `veiculos`**:
   - `gerencia_id` (UUID, nullable, FK para gerencias)
   - `status` (VARCHAR(20), NOT NULL, default 'OPERAÇÃO')
3. **Constraints removidas**:
   - `prefixo_id NOT NULL` → agora é opcional
   - `local_trabalho_id NOT NULL` → agora é opcional

## Fluxo de Status do Veículo

```
┌─────────────┐
│  OPERAÇÃO   │ ← Status padrão ao criar veículo
└──────┬──────┘
       │
       │ Criar ordem de manutenção
       ▼
┌─────────────┐
│ MANUTENÇÃO  │
└──────┬──────┘
       │
       │ Fechar ordem (PRONTO/REPARO PARCIAL)
       ▼
┌─────────────┐
│  OPERAÇÃO   │
└─────────────┘
```

## Como Usar

### Cadastrar Gerência
1. Acesse `/cadastros/gerencias`
2. Preencha o formulário no lado esquerdo
3. Clique em "Cadastrar Gerência"

### Cadastrar Veículo
1. Acesse `/veiculos`
2. **Prefixo**: Opcional - selecione se desejar
3. **Placa**: Obrigatório
4. **Modelo**: Opcional
5. **Local de Trabalho**: Opcional - selecione se desejar
6. **Gerência**: Opcional - selecione se desejar
7. Status será automaticamente "OPERAÇÃO"

### Criar Ordem de Manutenção
- Ao criar ordem, o status do veículo muda automaticamente para "MANUTENÇÃO"

### Fechar Ordem de Manutenção
- Ao mudar status para "PRONTO" ou "REPARO PARCIAL", o veículo volta para "OPERAÇÃO"

## Validações

### Gerência
- **Nome**: Obrigatório, único, máx 100 caracteres
- **Descrição**: Opcional, máx 500 caracteres
- **Ativo**: Boolean, default true

### Veículo (alterações)
- **prefixo_id**: Opcional (UUID válido)
- **local_trabalho_id**: Opcional (UUID válido)
- **gerencia_id**: Opcional (UUID válido)
- **status**: Automático ('OPERAÇÃO' ou 'MANUTENÇÃO')

## Notas Importantes

1. **Não é possível excluir gerência** com veículos vinculados
2. **Status do veículo é gerenciado automaticamente** pelas ordens de manutenção
3. **Prefixo e Local de Trabalho** agora são opcionais para maior flexibilidade
4. **Gerência** é completamente opcional e serve para organização adicional
