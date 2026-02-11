# Documentação Técnica da Arquitetura

## 🏛️ Visão Geral da Arquitetura

Este sistema segue uma **arquitetura em camadas** (Layered Architecture) com separação clara de responsabilidades.

### Princípios Arquiteturais

1. **Separation of Concerns**: Cada camada tem responsabilidade única
2. **Single Responsibility**: Cada classe/módulo faz apenas uma coisa
3. **Dependency Inversion**: Camadas superiores dependem de abstrações
4. **Type Safety**: TypeScript end-to-end com validação runtime

## 📐 Camadas da Aplicação

### Camada 1: Apresentação (Frontend)

**Localização**: `src/app/`

**Responsabilidades:**
- Renderização de UI
- Interação com usuário
- Navegação
- Chamadas para API

**Tecnologias:**
- Next.js 14 App Router
- React Server Components
- Tailwind CSS

**Padrões:**
- Server Components por padrão (performance)
- Client Components apenas quando necessário
- Composição de componentes

### Camada 2: API (Backend)

**Localização**: `src/app/api/`

**Responsabilidades:**
- Autenticação e autorização
- Validação de entrada
- Orquestração de serviços
- Serialização de resposta

**NÃO faz:**
- Lógica de negócio (vai para Services)
- Queries diretas ao banco (vai para Services)

**Padrão de API Route:**

```typescript
export async function POST(request: NextRequest) {
  // 1. Autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return unauthorized()

  // 2. Parse e validação
  const body = await request.json()
  
  // 3. Delegar para service
  const service = new VehicleService(supabase)
  const result = await service.create(body, user.id)
  
  // 4. Retornar resposta
  return NextResponse.json(result, { status: 201 })
}
```

### Camada 3: Serviços (Business Logic)

**Localização**: `src/lib/services/`

**⚠️ CAMADA MAIS IMPORTANTE - REGRAS DE NEGÓCIO AQUI**

**Responsabilidades:**
- **Todas** as regras de negócio
- Validações complexas
- Orquestração de operações
- Transações
- Cálculos de negócio

**Padrão de Service:**

```typescript
export class VehicleService {
  constructor(private supabase: SupabaseClient<Database>) {}

  async create(data: VehicleInput, userId: string) {
    // 1. Validação com Zod
    const validated = vehicleSchema.parse(data)
    
    // 2. Regras de negócio
    const isUnique = await this.validatePlateUniqueness(validated.plate)
    if (!isUnique) throw new Error('Placa já existe')
    
    // 3. Operação no banco
    const { data: vehicle, error } = await this.supabase
      .from('vehicles')
      .insert({ ...validated, created_by: userId })
      .select()
      .single()
    
    // 4. Tratamento de erro
    if (error) throw new Error(`Erro: ${error.message}`)
    
    return vehicle
  }
}
```

### Camada 4: Validação

**Localização**: `src/lib/validations/`

**Responsabilidades:**
- Schemas de validação
- Tipos TypeScript inferidos
- Regras de formato
- Sanitização

**Padrão:**

```typescript
export const vehicleSchema = z.object({
  plate: z.string()
    .min(7)
    .max(10)
    .regex(/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/),
  brand: z.string().min(2).max(100),
  // ...
})

export type VehicleInput = z.infer<typeof vehicleSchema>
```

### Camada 5: Acesso a Dados

**Localização**: `src/lib/supabase/`

**Responsabilidades:**
- Configuração do cliente Supabase
- Abstração de acesso ao banco
- Tipos do banco de dados

**Padrões:**
- Client para componentes cliente
- Server para server components
- Types gerados do schema

### Camada 6: Banco de Dados

**Localização**: `supabase/schema.sql`

**Responsabilidades:**
- Persistência de dados
- Integridade referencial
- Triggers e automações
- Views para relatórios

## 🔄 Fluxo de Dados Detalhado

### Exemplo: Iniciar Manutenção

```
1. FRONTEND (dashboard/page.tsx)
   ↓ Usuário clica "Iniciar Manutenção"
   
2. CLIENT COMPONENT
   ↓ fetch('/api/maintenance/[id]/start', { method: 'POST' })
   
3. API ROUTE (/api/maintenance/[id]/start/route.ts)
   ↓ Verifica autenticação
   ↓ Parse do body
   
4. MAINTENANCE SERVICE (maintenance.service.ts)
   ↓ start(data, userId)
   ↓ Valida: ordem existe?
   ↓ Valida: status é 'pending'?
   ↓ Regra: registrar data/hora de início
   
5. SUPABASE CLIENT
   ↓ UPDATE maintenance_orders SET status='in_progress'
   
6. DATABASE TRIGGER (update_vehicle_status)
   ↓ UPDATE vehicles SET status='in_maintenance'
   
7. DATABASE TRIGGER (track_maintenance_timeline)
   ↓ INSERT INTO maintenance_timeline
   
8. SERVICE (continuação)
   ↓ INSERT INTO vehicle_downtime
   
9. RESPONSE
   ↓ Retorna ordem atualizada
   
10. FRONTEND
    ↓ Atualiza UI
```

## 🎯 Onde Ficam as Regras Críticas

### Regras no Backend (Services)

**VehicleService:**

| Regra | Método | Descrição |
|-------|--------|-----------|
| Placa única | `validatePlateUniqueness()` | Impede placas duplicadas |
| Proteção de exclusão | `delete()` | Não permite excluir veículo em manutenção |
| Busca inteligente | `list()` | Busca por múltiplos campos |

**MaintenanceService:**

| Regra | Método | Descrição |
|-------|--------|-----------|
| Ordem única | `validateOrderNumberUniqueness()` | Número de ordem único |
| Controle de início | `start()` | Apenas pending pode iniciar |
| Registro de downtime | `start()` | Cria registro automático |
| Validação de horas | `complete()` | Alerta se exceder 50% |
| Controle de finalização | `complete()` | Apenas in_progress pode finalizar |
| Proteção de cancelamento | `cancel()` | Não cancela se completed |
| Proteção de exclusão | `delete()` | Não exclui se in_progress |

### Regras no Banco de Dados (Triggers)

**Automações Críticas:**

| Trigger | Tabela | Ação |
|---------|--------|------|
| `update_vehicle_status` | maintenance_orders | Atualiza status do veículo automaticamente |
| `track_maintenance_timeline` | maintenance_orders | Registra histórico de mudanças |
| `auto_close_downtime` | maintenance_orders | Fecha tempo parado ao finalizar |
| `update_updated_at` | vehicles, maintenance_orders | Atualiza timestamp |

**Constraints:**

```sql
-- Garantem integridade dos dados
CONSTRAINT year_check CHECK (year >= 1900 AND year <= 2100)
CONSTRAINT priority_check CHECK (priority >= 1 AND priority <= 5)
CONSTRAINT hours_check CHECK (estimated_hours >= 0 AND actual_hours >= 0)
```

## 🔐 Segurança em Profundidade

### Camada 1: Autenticação (API Routes)

```typescript
// Todas as rotas verificam autenticação
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
}
```

### Camada 2: Row Level Security (Database)

```sql
-- Políticas RLS em todas as tabelas
CREATE POLICY "Users can view all vehicles" ON vehicles
  FOR SELECT USING (auth.role() = 'authenticated');
```

### Camada 3: Validação (Zod Schemas)

```typescript
// Validação obrigatória antes de processar
const validated = maintenanceOrderSchema.parse(data)
```

### Camada 4: Prepared Statements (Supabase)

```typescript
// Supabase usa prepared statements automaticamente
// Proteção contra SQL Injection
await supabase.from('vehicles').select('*').eq('id', userId)
```

### Camada 5: Variáveis de Ambiente

```
# Backend only (NUNCA expor)
SUPABASE_SERVICE_ROLE_KEY=xxx

# Frontend safe
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

## ⚡ Otimizações de Performance

### 1. Índices Estratégicos

```sql
-- Queries mais comuns
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_maintenance_orders_status ON maintenance_orders(status);
CREATE INDEX idx_maintenance_orders_vehicle ON maintenance_orders(vehicle_id);
```

### 2. Views Pré-Computadas

```sql
-- Relatórios complexos pré-calculados
CREATE VIEW v_vehicles_in_maintenance AS
SELECT v.*, mo.*, 
  EXTRACT(EPOCH FROM (NOW() - mo.start_date)) / 3600 AS hours_in_maintenance
FROM vehicles v
INNER JOIN maintenance_orders mo ON v.id = mo.vehicle_id
WHERE mo.status = 'in_progress';
```

### 3. Computed Columns

```sql
-- Cálculo automático no banco
downtime_hours DECIMAL(10,2) GENERATED ALWAYS AS (
  EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time)) / 3600
) STORED
```

### 4. Server Components

- Renderização no servidor
- Menos JavaScript no cliente
- Queries diretas ao banco (sem API)

### 5. Paginação

```typescript
// Implementado em todos os list()
query = query.limit(limit).range(offset, offset + limit - 1)
```

## 🧪 Testabilidade

### Estrutura Testável

```typescript
// Services são facilmente testáveis
const mockSupabase = createMockSupabase()
const service = new VehicleService(mockSupabase)

// Testar regras de negócio isoladamente
await expect(service.create(invalidData, userId))
  .rejects.toThrow('Placa já existe')
```

### Separação de Concerns

- **Services**: Testes unitários
- **API Routes**: Testes de integração
- **Database**: Testes de migração

## 📊 Monitoramento e Logs

### Pontos de Log Recomendados

```typescript
// 1. Erros de validação
console.error('Validação falhou:', error)

// 2. Regras de negócio violadas
console.warn(`Ordem ${orderNumber}: horas excedem estimativa`)

// 3. Operações críticas
console.info('Manutenção iniciada:', { orderId, vehicleId })
```

## 🔄 Extensibilidade

### Adicionar Nova Entidade

1. **Database**: Criar tabela em `schema.sql`
2. **Types**: Adicionar em `database.types.ts`
3. **Validation**: Criar schema em `validations/`
4. **Service**: Criar service em `services/`
5. **API**: Criar routes em `api/`
6. **Frontend**: Criar páginas em `app/`

### Adicionar Nova Regra

```typescript
// Sempre no Service, nunca na API Route
class MaintenanceService {
  async create(data: MaintenanceOrderInput, userId: string) {
    // Nova regra aqui
    if (data.priority === 5) {
      await this.notifyUrgent(data)
    }
    // ...
  }
}
```

## 🎓 Decisões Arquiteturais

### Por que Services em vez de Repository Pattern?

- **Simplicidade**: Supabase já é uma abstração
- **Foco**: Regras de negócio centralizadas
- **Manutenibilidade**: Menos camadas = mais fácil manter

### Por que Triggers no Banco?

- **Consistência**: Garantem regras mesmo fora da aplicação
- **Performance**: Executam no banco (mais rápido)
- **Atomicidade**: Parte da transação

### Por que Zod em vez de class-validator?

- **Type Inference**: Tipos TypeScript automáticos
- **Runtime + Compile Time**: Validação dupla
- **Composição**: Schemas reutilizáveis

### Por que Next.js App Router?

- **Server Components**: Performance superior
- **Colocation**: API e UI no mesmo projeto
- **Type Safety**: End-to-end TypeScript
- **Streaming**: Melhor UX

## 📚 Referências

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Next.js Best Practices](https://nextjs.org/docs/app/building-your-application)
- [Supabase Architecture](https://supabase.com/docs/guides/database)
