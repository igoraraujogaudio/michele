# Prefixo - Criação Automática

## Mudança Implementada

O campo **prefixo** agora funciona de forma simplificada:
- ✅ Campo de **texto simples** no formulário
- ✅ **Criação automática** na tabela `prefixos` se não existir
- ✅ **Reutilização** se o prefixo já existir
- ✅ Campo **opcional** - pode deixar em branco

## Como Funciona

### 1. **No Formulário**
```tsx
// Campo de texto simples
<input 
  type="text"
  name="prefixo"
  placeholder="OPCIONAL"
/>
```

### 2. **Ao Cadastrar/Editar Veículo**

**Fluxo automático:**

```
Usuário digita prefixo "VAN-01"
         ↓
Sistema verifica se "VAN-01" existe na tabela prefixos
         ↓
    ┌────────────────┐
    │ Já existe?     │
    └────┬───────┬───┘
         │       │
      SIM│       │NÃO
         │       │
         ▼       ▼
   Usa o ID    Cria novo registro
   existente   em prefixos com
               nome="VAN-01" e ativo=true
         │       │
         └───┬───┘
             ▼
   Associa prefixo_id ao veículo
```

## Código Implementado

### Schema de Validação
```typescript
export const veiculoSchema = z.object({
  prefixo: z.string()
    .max(20, 'Prefixo deve ter no máximo 20 caracteres')
    .transform(val => val.toUpperCase().trim())
    .optional(),
  // ... outros campos
});
```

### Action - createVeiculo
```typescript
// Extrai o prefixo do formulário
const { placa, prefixo } = validatedData;

let prefixo_id = null;
if (prefixo && prefixo.trim() !== '') {
  // Verifica se já existe
  const { data: existingPrefixo } = await supabase
    .from('prefixos')
    .select('id')
    .eq('nome', prefixo)
    .single();

  if (existingPrefixo) {
    // Reutiliza o existente
    prefixo_id = existingPrefixo.id;
  } else {
    // Cria novo
    const { data: newPrefixo } = await supabase
      .from('prefixos')
      .insert({ nome: prefixo, ativo: true })
      .select('id')
      .single();
    
    prefixo_id = newPrefixo.id;
  }
}

// Insere veículo com prefixo_id
await supabase
  .from('veiculos')
  .insert({ ...veiculoData, prefixo_id });
```

### Action - updateVeiculo
```typescript
// Mesma lógica do create
// Se prefixo for alterado, cria novo ou reutiliza existente
// Se prefixo for removido (string vazia), seta prefixo_id = null
```

## Exemplos de Uso

### Exemplo 1: Criar veículo com prefixo novo
```
Prefixo: VAN-01
Placa: ABC-1234
```
**Resultado:**
- Cria registro em `prefixos` com nome="VAN-01"
- Cria veículo com `prefixo_id` apontando para o novo prefixo

### Exemplo 2: Criar veículo com prefixo existente
```
Prefixo: VAN-01  (já existe)
Placa: DEF-5678
```
**Resultado:**
- Reutiliza o prefixo existente
- Cria veículo com `prefixo_id` apontando para o prefixo existente

### Exemplo 3: Criar veículo sem prefixo
```
Prefixo: (vazio)
Placa: GHI-9012
```
**Resultado:**
- Cria veículo com `prefixo_id = null`

### Exemplo 4: Editar veículo e mudar prefixo
```
Antes: VAN-01
Depois: CARRO-05
```
**Resultado:**
- Se "CARRO-05" não existe, cria novo registro em `prefixos`
- Atualiza veículo com novo `prefixo_id`

## Vantagens

✅ **Simplicidade** - Usuário só digita o texto, sem precisar cadastrar prefixo separadamente
✅ **Flexibilidade** - Prefixo é opcional
✅ **Organização** - Prefixos ficam centralizados na tabela `prefixos`
✅ **Reutilização** - Mesmo prefixo pode ser usado em vários veículos
✅ **Automático** - Não precisa ir em "Cadastros > Prefixos" antes

## Arquivos Modificados

### Schemas
- `src/lib/validations/schemas.ts` - Campo `prefixo` como string opcional

### Types
- `src/lib/types/database.types.ts` - DTOs com `prefixo` como string

### Actions
- `src/lib/actions/veiculos.actions.ts`
  - `createVeiculo()` - Cria prefixo automaticamente
  - `updateVeiculo()` - Atualiza/cria prefixo conforme necessário

### Componentes
- `src/components/veiculos/VeiculoForm.tsx` - Campo de texto para prefixo

## Banco de Dados

A tabela `prefixos` continua existindo e sendo populada automaticamente:

```sql
CREATE TABLE prefixos (
  id UUID PRIMARY KEY,
  nome VARCHAR NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

A tabela `veiculos` tem a foreign key:

```sql
ALTER TABLE veiculos 
  ADD COLUMN prefixo_id UUID REFERENCES prefixos(id);
```

## Resumo

**Antes:** Usuário tinha que cadastrar prefixo em "Cadastros > Prefixos" primeiro, depois selecionar no dropdown

**Agora:** Usuário digita o prefixo diretamente no campo de texto, e o sistema cria automaticamente se não existir

🎯 **Muito mais simples e rápido!**
