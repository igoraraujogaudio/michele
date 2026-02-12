# Correções de Schema - Veículos e Prefixos

## Problema Identificado

O banco de dados não possui uma coluna `prefixo` na tabela `veiculos`. A estrutura real é:
- `prefixo_id` (UUID) - Foreign key para tabela `prefixos`
- `local_trabalho_id` (UUID) - Foreign key para tabela `locais_trabalho`

O código estava tentando acessar `veiculo.prefixo` diretamente, causando erro:
```
ERROR: 42703: column veiculos.prefixo does not exist
```

## Correções Implementadas

### 1. **Queries com JOIN**
Atualizadas todas as queries para fazer JOIN com as tabelas relacionadas:

```typescript
// Antes
.select('*')

// Depois
.select(`
  *,
  prefixo:prefixos(nome),
  local_trabalho:locais_trabalho(nome),
  gerencia:gerencias(nome)
`)
```

**Arquivos modificados:**
- `src/lib/actions/veiculos.actions.ts` - `listVeiculos()`, `listVeiculosDisponiveis()`, `getVeiculo()`
- `src/lib/actions/ordens.actions.ts` - `createOrdemManutencao()`

### 2. **Tipos Atualizados**
Interface `Veiculo` atualizada para refletir a estrutura real:

```typescript
export interface Veiculo {
  id: string;
  prefixo_id: string | null;
  placa: string;
  modelo: string | null;
  local_trabalho_id: string | null;
  gerencia_id: string | null;
  status: StatusVeiculo;
  // ... outros campos
  
  // Campos joinados (opcionais)
  prefixo?: { nome: string } | null;
  local_trabalho?: { nome: string } | null;
  gerencia?: { nome: string } | null;
}
```

### 3. **Componentes Atualizados**
Todos os componentes que exibiam `prefixo` foram corrigidos para acessar `prefixo?.nome`:

**Arquivos modificados:**
- `src/components/veiculos/VeiculoTable.tsx`
- `src/components/ordens/NovaOrdemForm.tsx`
- `src/components/ordens/OrdemDetail.tsx`
- `src/components/ordens/OrdensTable.tsx`
- `src/app/veiculos/[id]/edit/page.tsx`

**Exemplo de correção:**
```tsx
// Antes
<div>{veiculo.prefixo}</div>

// Depois
<div>{veiculo.prefixo?.nome || '-'}</div>
```

### 4. **Ordenação Corrigida**
Mudança de ordenação de `prefixo` (que não existe) para `placa`:

```typescript
// Antes
.order('prefixo', { ascending: true })

// Depois
.order('placa', { ascending: true })
```

### 5. **Schema de Validação**
Atualizado para usar IDs em vez de texto:

```typescript
export const veiculoSchema = z.object({
  prefixo_id: z.string().uuid('ID do prefixo inválido').optional(),
  placa: z.string()...,
  modelo: z.string()...,
  local_trabalho_id: z.string().uuid('ID do local de trabalho inválido').optional(),
  gerencia_id: z.string().uuid('ID da gerência inválido').optional(),
  status: statusVeiculoSchema.default('OPERAÇÃO').optional(),
  // ...
});
```

### 6. **Formulário de Veículo**
Restaurado para usar dropdowns (selects) em vez de campos de texto:

```tsx
// Prefixo - Dropdown
<select name="prefixo_id">
  <option value="">Selecione um prefixo (opcional)</option>
  {prefixos.map(p => <option value={p.id}>{p.nome}</option>)}
</select>

// Local de Trabalho - Dropdown
<select name="local_trabalho_id">
  <option value="">Selecione um local (opcional)</option>
  {locais.map(l => <option value={l.id}>{l.nome}</option>)}
</select>

// Gerência - Dropdown (novo)
<select name="gerencia_id">
  <option value="">Selecione uma gerência (opcional)</option>
  {gerencias.map(g => <option value={g.id}>{g.nome}</option>)}
</select>
```

## Estrutura Final

### Campos Obrigatórios
- ✅ **placa** - Único campo obrigatório

### Campos Opcionais
- ⭕ **prefixo_id** - Opcional (FK para prefixos)
- ⭕ **local_trabalho_id** - Opcional (FK para locais_trabalho)
- ⭕ **gerencia_id** - Opcional (FK para gerencias)
- ⭕ **modelo** - Opcional
- ⭕ **nome_motorista** - Opcional
- ⭕ **telefone_motorista** - Opcional

### Campos Automáticos
- 🤖 **status** - Default 'OPERAÇÃO', muda automaticamente com ordens de manutenção

## Migração Necessária

Execute o arquivo `database-migration-gerencias.sql` para:
1. Criar tabela `gerencias`
2. Adicionar coluna `gerencia_id` em `veiculos`
3. Adicionar coluna `status` em `veiculos`
4. Tornar `prefixo_id` e `local_trabalho_id` opcionais (remover NOT NULL)

## Resultado

✅ Todos os erros de schema resolvidos
✅ Queries fazem JOIN correto com tabelas relacionadas
✅ Componentes exibem dados corretamente
✅ Formulários usam dropdowns para seleção de FKs
✅ Validação usa UUIDs em vez de texto
✅ Prefixo e Local de Trabalho agora são opcionais
✅ Gerência adicionada como campo opcional
✅ Status do veículo gerenciado automaticamente
