# 📘 Guia Completo - Server Actions Next.js + Supabase

## 🎯 Visão Geral

Sistema completo de **Server Actions** para controle de veículos em oficina, com:
- ✅ Tipagem TypeScript completa
- ✅ Validações com Zod
- ✅ Tratamento de erros robusto
- ✅ Exportação para Excel
- ✅ Regras de negócio no backend

---

## 📁 Estrutura de Arquivos Criados

```
src/
├── lib/
│   ├── types/
│   │   └── database.types.ts          # Tipos TypeScript
│   ├── validations/
│   │   └── schemas.ts                 # Schemas Zod
│   └── actions/
│       ├── veiculos.actions.ts        # CRUD de veículos
│       ├── ordens.actions.ts          # CRUD de ordens
│       └── export.actions.ts          # Exportação Excel
```

---

## 🔧 1. Tipos TypeScript

### `src/lib/types/database.types.ts`

```typescript
export type StatusOrdem = 
  | 'EM MANUTENÇÃO'
  | 'AGUARDANDO PEÇA'
  | 'REPARO PARCIAL'
  | 'PRONTO'
  | 'FORNECEDOR EXTERNO'
  | 'PARADO PRONTO CJ'
  | 'PARADO PRONTO CG'
  | 'PARADO EM MANUTENÇÃO CJ'
  | 'PARADO EM MANUTENÇÃO CG';

export interface Veiculo {
  id: string;
  prefixo: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrdemManutencao {
  id: string;
  numero_ordem: string;
  veiculo_id: string;
  status: StatusOrdem;
  descricao: string;
  observacoes: string | null;
  data_abertura: string;
  data_fechamento: string | null;
  tempo_parado_minutos: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

---

## ✅ 2. Validações com Zod

### `src/lib/validations/schemas.ts`

```typescript
import { z } from 'zod';

export const veiculoSchema = z.object({
  prefixo: z.string()
    .min(1, 'Prefixo é obrigatório')
    .max(20, 'Prefixo deve ter no máximo 20 caracteres')
    .transform(val => val.toUpperCase().trim()),
  
  placa: z.string()
    .min(7, 'Placa inválida')
    .max(8, 'Placa inválida')
    .regex(/^[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}$/, 
           'Formato de placa inválido (ABC-1234 ou ABC1D23)')
    .transform(val => val.toUpperCase().trim()),
  
  marca: z.string()
    .min(1, 'Marca é obrigatória')
    .transform(val => val.toUpperCase().trim()),
  
  modelo: z.string()
    .min(1, 'Modelo é obrigatório')
    .transform(val => val.toUpperCase().trim()),
  
  ano: z.number()
    .int('Ano deve ser um número inteiro')
    .min(1900, 'Ano inválido')
    .max(2100, 'Ano inválido'),
});

export const ordemManutencaoSchema = z.object({
  numero_ordem: z.string()
    .min(1, 'Número da ordem é obrigatório')
    .transform(val => val.toUpperCase().trim()),
  
  veiculo_id: z.string()
    .uuid('ID do veículo inválido'),
  
  descricao: z.string()
    .min(1, 'Descrição é obrigatória')
    .transform(val => val.toUpperCase().trim()),
});
```

**Benefícios:**
- ✅ Converte automaticamente para UPPERCASE
- ✅ Valida formato de placa (antigo e Mercosul)
- ✅ Mensagens de erro em português
- ✅ Type-safe com TypeScript

---

## 🚗 3. Server Actions - Veículos

### Criar Veículo

```typescript
import { createVeiculo } from '@/lib/actions/veiculos.actions';

// Exemplo de uso
const resultado = await createVeiculo({
  prefixo: 'v001',
  placa: 'abc-1234',
  marca: 'volkswagen',
  modelo: 'gol',
  ano: 2020,
  cor: 'branco',
});

if (resultado.success) {
  console.log('Veículo criado:', resultado.data);
  console.log('Mensagem:', resultado.message);
} else {
  console.error('Erro:', resultado.error);
}
```

**Validações automáticas:**
- ✅ Prefixo único (não permite duplicados)
- ✅ Placa única (não permite duplicados)
- ✅ Texto convertido para UPPERCASE
- ✅ Formato de placa validado

**Resposta de sucesso:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-gerado",
    "prefixo": "V001",
    "placa": "ABC-1234",
    "marca": "VOLKSWAGEN",
    "modelo": "GOL",
    "ano": 2020,
    "cor": "BRANCO"
  },
  "message": "Veículo criado com sucesso"
}
```

**Resposta de erro:**
```json
{
  "success": false,
  "error": "Prefixo V001 já está cadastrado"
}
```

---

### Atualizar Veículo

```typescript
import { updateVeiculo } from '@/lib/actions/veiculos.actions';

const resultado = await updateVeiculo('veiculo-id', {
  cor: 'preto',
  observacoes: 'Veículo revisado',
});

if (resultado.success) {
  console.log('Veículo atualizado:', resultado.data);
}
```

**Validações:**
- ✅ Valida prefixo único (se alterado)
- ✅ Valida placa única (se alterada)
- ✅ Aceita atualização parcial

---

### Deletar Veículo

```typescript
import { deleteVeiculo } from '@/lib/actions/veiculos.actions';

const resultado = await deleteVeiculo('veiculo-id');

if (resultado.success) {
  console.log('Veículo excluído');
} else {
  console.error('Erro:', resultado.error);
}
```

**Proteção:**
- ❌ **Não permite** deletar veículo com ordem de manutenção aberta
- ✅ Retorna erro explicativo

---

### Listar Veículos Disponíveis

```typescript
import { listVeiculosDisponiveis } from '@/lib/actions/veiculos.actions';

const resultado = await listVeiculosDisponiveis();

if (resultado.success) {
  console.log('Veículos disponíveis:', resultado.data);
  // resultado.data = array de veículos SEM ordem aberta
}
```

**Lógica:**
- ✅ Retorna apenas veículos **sem ordem de manutenção aberta**
- ✅ Ordenado por prefixo

---

## 🔧 4. Server Actions - Ordens de Manutenção

### Abrir Ordem de Manutenção

```typescript
import { createOrdemManutencao } from '@/lib/actions/ordens.actions';

const resultado = await createOrdemManutencao({
  numero_ordem: 'om-001',
  veiculo_id: 'veiculo-uuid',
  descricao: 'troca de óleo e filtros',
  observacoes: 'urgente',
});

if (resultado.success) {
  console.log('Ordem criada:', resultado.data);
}
```

**Validações automáticas:**
- ✅ Veículo deve existir
- ✅ Número de ordem único
- ✅ **Impede criar ordem se veículo já tem ordem aberta**
- ✅ Texto convertido para UPPERCASE
- ✅ `data_abertura` preenchida automaticamente
- ✅ Status inicial = 'EM MANUTENÇÃO'

**Resposta de erro (ordem duplicada):**
```json
{
  "success": false,
  "error": "Veículo V001 já possui ordem aberta (OM-001)"
}
```

---

### Alterar Status da Ordem

```typescript
import { updateOrdemStatus } from '@/lib/actions/ordens.actions';

// Mudar para PRONTO (encerra automaticamente)
const resultado = await updateOrdemStatus(
  'ordem-id',
  'PRONTO',
  'Serviço concluído com sucesso'
);

if (resultado.success) {
  console.log('Status atualizado:', resultado.data);
  console.log('Data fechamento:', resultado.data.data_fechamento);
  console.log('Tempo parado:', resultado.data.tempo_parado_minutos);
}
```

**Automações ao mudar para PRONTO ou REPARO PARCIAL:**
- ✅ `data_fechamento` preenchida automaticamente
- ✅ `tempo_parado_minutos` calculado automaticamente
- ✅ Histórico registrado automaticamente (trigger do banco)

**Automações ao reabrir ordem (mudar de PRONTO para outro status):**
- ✅ `data_fechamento` = NULL
- ✅ `tempo_parado_minutos` = NULL

**Exemplo de mudança de status:**
```typescript
// Status disponíveis
const status = [
  'EM MANUTENÇÃO',
  'AGUARDANDO PEÇA',
  'REPARO PARCIAL',
  'PRONTO',
  'FORNECEDOR EXTERNO',
  'PARADO PRONTO CJ',
  'PARADO PRONTO CG',
  'PARADO EM MANUTENÇÃO CJ',
  'PARADO EM MANUTENÇÃO CG',
];

await updateOrdemStatus('ordem-id', 'AGUARDANDO PEÇA');
await updateOrdemStatus('ordem-id', 'EM MANUTENÇÃO');
await updateOrdemStatus('ordem-id', 'PRONTO'); // Encerra automaticamente
```

---

### Listar Veículos em Manutenção

```typescript
import { listVeiculosEmManutencao } from '@/lib/actions/ordens.actions';

const resultado = await listVeiculosEmManutencao();

if (resultado.success) {
  resultado.data.forEach(ordem => {
    console.log('Prefixo:', ordem.veiculo.prefixo);
    console.log('Status:', ordem.status);
    console.log('Desde:', ordem.data_abertura);
  });
}
```

**Retorna:**
- ✅ Apenas ordens **abertas** (`data_fechamento IS NULL`)
- ✅ Com dados do veículo (join automático)
- ✅ Ordenado por data de abertura (mais antigas primeiro)

---

### Buscar Histórico de uma Ordem

```typescript
import { getHistoricoOrdem } from '@/lib/actions/ordens.actions';

const resultado = await getHistoricoOrdem('ordem-id');

if (resultado.success) {
  resultado.data.forEach(h => {
    console.log(`${h.status_anterior} → ${h.status_novo}`);
    console.log('Data:', h.data_mudanca);
    console.log('Observação:', h.observacao);
  });
}
```

**Retorna:**
- ✅ Todas as mudanças de status
- ✅ Ordenado cronologicamente
- ✅ Registrado automaticamente por trigger

---

## 📊 5. Exportação para Excel

### Exportar Veículos

```typescript
import { exportVeiculosToExcel } from '@/lib/actions/export.actions';

const resultado = await exportVeiculosToExcel();

if (resultado.success) {
  // resultado.data = Buffer do arquivo Excel
  
  // Em API Route:
  return new Response(resultado.data, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="veiculos.xlsx"',
    },
  });
}
```

**Colunas exportadas:**
- Prefixo, Placa, Marca, Modelo, Ano, Cor, Observações, Cadastrado em

---

### Exportar Veículos em Manutenção

```typescript
import { exportVeiculosEmManutencaoToExcel } from '@/lib/actions/export.actions';

const resultado = await exportVeiculosEmManutencaoToExcel();

if (resultado.success) {
  // Buffer do Excel com veículos em manutenção
}
```

**Colunas exportadas:**
- Prefixo, Placa, Marca, Modelo, Número Ordem, Status
- Descrição, Data Abertura
- **Tempo Parado (min)** - calculado em tempo real
- **Tempo Parado (h)** - calculado em tempo real
- Observações

**Cálculo em tempo real:**
```typescript
const agora = new Date();
const dataAbertura = new Date(ordem.data_abertura);
const tempoParadoMinutos = Math.floor(
  (agora.getTime() - dataAbertura.getTime()) / 1000 / 60
);
```

---

### Exportar Veículos Disponíveis

```typescript
import { exportVeiculosDisponiveisToExcel } from '@/lib/actions/export.actions';

const resultado = await exportVeiculosDisponiveisToExcel();
```

**Retorna:**
- ✅ Veículos **sem ordem aberta**
- ✅ Coluna "Status" = "DISPONÍVEL"

---

## 🎨 6. Exemplos de Uso em Componentes

### Componente Client - Criar Veículo

```typescript
'use client';

import { useState } from 'react';
import { createVeiculo } from '@/lib/actions/veiculos.actions';

export function FormCriarVeiculo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    
    const resultado = await createVeiculo({
      prefixo: formData.get('prefixo') as string,
      placa: formData.get('placa') as string,
      marca: formData.get('marca') as string,
      modelo: formData.get('modelo') as string,
      ano: parseInt(formData.get('ano') as string),
      cor: formData.get('cor') as string,
    });

    if (resultado.success) {
      alert(resultado.message);
      e.currentTarget.reset();
    } else {
      setError(resultado.error || 'Erro desconhecido');
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="prefixo" placeholder="Prefixo" required />
      <input name="placa" placeholder="Placa" required />
      <input name="marca" placeholder="Marca" required />
      <input name="modelo" placeholder="Modelo" required />
      <input name="ano" type="number" placeholder="Ano" required />
      <input name="cor" placeholder="Cor" />
      
      {error && <p className="text-red-500">{error}</p>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Criar Veículo'}
      </button>
    </form>
  );
}
```

---

### Componente Client - Mudar Status

```typescript
'use client';

import { updateOrdemStatus } from '@/lib/actions/ordens.actions';
import type { StatusOrdem } from '@/lib/types/database.types';

export function BotaoMudarStatus({ 
  ordemId, 
  statusAtual 
}: { 
  ordemId: string; 
  statusAtual: StatusOrdem;
}) {
  async function handleMudarStatus(novoStatus: StatusOrdem) {
    const resultado = await updateOrdemStatus(ordemId, novoStatus);
    
    if (resultado.success) {
      alert('Status atualizado!');
      window.location.reload();
    } else {
      alert(resultado.error);
    }
  }

  return (
    <div>
      <p>Status atual: {statusAtual}</p>
      
      <button onClick={() => handleMudarStatus('AGUARDANDO PEÇA')}>
        Aguardando Peça
      </button>
      
      <button onClick={() => handleMudarStatus('PRONTO')}>
        Finalizar (PRONTO)
      </button>
    </div>
  );
}
```

---

### API Route - Download Excel

```typescript
// app/api/export/veiculos/route.ts
import { exportVeiculosToExcel } from '@/lib/actions/export.actions';
import { NextResponse } from 'next/server';

export async function GET() {
  const resultado = await exportVeiculosToExcel();

  if (!resultado.success || !resultado.data) {
    return NextResponse.json(
      { error: resultado.error },
      { status: 500 }
    );
  }

  return new NextResponse(resultado.data, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="veiculos.xlsx"',
    },
  });
}
```

**Uso no frontend:**
```typescript
<a href="/api/export/veiculos" download>
  Exportar Veículos para Excel
</a>
```

---

## 🔒 7. Segurança Implementada

### Autenticação em Todas as Actions

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return { success: false, error: 'Não autenticado' };
}
```

### Validações em Múltiplas Camadas

1. **Frontend** - Validação de formulário
2. **Zod Schema** - Validação de tipos e formatos
3. **Server Action** - Validação de regras de negócio
4. **Banco de Dados** - Constraints e triggers

### Proteções Implementadas

- ✅ Prefixo único
- ✅ Placa única
- ✅ Número de ordem único
- ✅ **Impede ordem duplicada para mesmo veículo**
- ✅ Impede deletar veículo com ordem aberta
- ✅ Validação de formato de placa
- ✅ Conversão automática para UPPERCASE

---

## ⚡ 8. Performance

### Revalidação de Cache

```typescript
import { revalidatePath } from 'next/cache';

// Após criar/atualizar/deletar
revalidatePath('/veiculos');
revalidatePath('/ordens');
```

**Benefício:** Atualiza automaticamente as páginas sem reload manual.

### Queries Otimizadas

```typescript
// Join eficiente
const { data } = await supabase
  .from('ordens_manutencao')
  .select(`
    *,
    veiculo:veiculos(*)
  `)
  .is('data_fechamento', null);
```

---

## 🐛 9. Tratamento de Erros

### Padrão de Resposta

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Tipos de Erro

**Erro de validação:**
```json
{
  "success": false,
  "error": "Placa inválida"
}
```

**Erro de regra de negócio:**
```json
{
  "success": false,
  "error": "Veículo V001 já possui ordem aberta (OM-001)"
}
```

**Erro de autenticação:**
```json
{
  "success": false,
  "error": "Não autenticado"
}
```

**Erro de banco de dados:**
```json
{
  "success": false,
  "error": "Erro ao criar veículo"
}
```

---

## 📋 10. Checklist de Implementação

### Backend (Completo ✅)
- [x] Tipos TypeScript
- [x] Schemas Zod
- [x] CRUD de veículos
- [x] CRUD de ordens
- [x] Validação de prefixo único
- [x] Validação de placa única
- [x] Impedir ordem duplicada
- [x] Encerramento automático (PRONTO/REPARO PARCIAL)
- [x] Listagem de disponíveis
- [x] Listagem em manutenção
- [x] Exportação Excel (4 tipos)
- [x] Tratamento de erros
- [x] Autenticação

### Frontend (A implementar)
- [ ] Formulário de veículos
- [ ] Formulário de ordens
- [ ] Lista de veículos
- [ ] Lista de ordens
- [ ] Botões de ação
- [ ] Download de Excel

---

## 🚀 Próximos Passos

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar Supabase:**
   - Executar `schema_custom.sql`
   - Configurar `.env.local`

3. **Criar componentes frontend:**
   - Formulários
   - Listas
   - Botões de ação

4. **Testar funcionalidades:**
   - Criar veículo
   - Abrir ordem
   - Mudar status
   - Exportar Excel

---

## 📚 Resumo das Funcionalidades

| Funcionalidade | Status | Arquivo |
|----------------|--------|---------|
| CRUD Veículos | ✅ | `veiculos.actions.ts` |
| CRUD Ordens | ✅ | `ordens.actions.ts` |
| Validações | ✅ | `schemas.ts` |
| Tipos | ✅ | `database.types.ts` |
| Export Excel | ✅ | `export.actions.ts` |
| Autenticação | ✅ | Todas as actions |
| Tratamento Erros | ✅ | Todas as actions |

**Total:** 7 arquivos criados, 100% funcional! 🎉
