# Sistema de Controle de Veículos em Oficina

Sistema web completo para gerenciamento de veículos e ordens de manutenção em oficinas mecânicas.

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica

- **Frontend/Backend**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Estilização**: Tailwind CSS
- **Validação**: Zod
- **Exportação**: XLSX (SheetJS)
- **Ícones**: Lucide React

### Estrutura de Pastas

```
vehicle-workshop/
├── src/
│   ├── app/                          # App Router do Next.js 14
│   │   ├── api/                      # API Routes (Backend)
│   │   │   ├── vehicles/             # Endpoints de veículos
│   │   │   │   ├── route.ts          # GET (listar) e POST (criar)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # GET, PATCH, DELETE por ID
│   │   │   ├── maintenance/          # Endpoints de manutenção
│   │   │   │   ├── route.ts          # GET (listar) e POST (criar)
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET, PATCH, DELETE por ID
│   │   │   │       ├── start/        # POST - iniciar manutenção
│   │   │   │       │   └── route.ts
│   │   │   │       └── complete/     # POST - finalizar manutenção
│   │   │   │           └── route.ts
│   │   │   └── reports/              # Endpoints de relatórios
│   │   │       ├── vehicles-in-maintenance/
│   │   │       │   └── route.ts
│   │   │       └── downtime/
│   │   │           └── route.ts
│   │   ├── dashboard/                # Página principal
│   │   │   └── page.tsx
│   │   ├── layout.tsx                # Layout raiz
│   │   ├── page.tsx                  # Página inicial (redirect)
│   │   └── globals.css               # Estilos globais
│   │
│   └── lib/                          # Lógica de negócio e utilitários
│       ├── services/                 # Camada de serviços (REGRAS DE NEGÓCIO)
│       │   ├── vehicle.service.ts    # Lógica de veículos
│       │   ├── maintenance.service.ts # Lógica de manutenção
│       │   └── export.service.ts     # Exportação para Excel
│       │
│       ├── validations/              # Schemas de validação (Zod)
│       │   ├── vehicle.schema.ts     # Validação de veículos
│       │   └── maintenance.schema.ts # Validação de manutenção
│       │
│       ├── supabase/                 # Configuração Supabase
│       │   ├── client.ts             # Cliente para componentes
│       │   ├── server.ts             # Cliente para server components
│       │   └── database.types.ts     # Tipos TypeScript do banco
│       │
│       └── utils.ts                  # Funções utilitárias
│
├── supabase/
│   └── schema.sql                    # Schema completo do banco de dados
│
├── package.json                      # Dependências do projeto
├── tsconfig.json                     # Configuração TypeScript
├── tailwind.config.ts                # Configuração Tailwind
├── next.config.js                    # Configuração Next.js
└── .env.local.example                # Exemplo de variáveis de ambiente
```

## 🔄 Fluxo de Dados

### Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                  │
│  - Componentes de UI                                         │
│  - Páginas (Server Components)                               │
│  - Client Components para interatividade                     │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    API ROUTES (Backend)                      │
│  - Autenticação (middleware)                                 │
│  - Validação de entrada                                      │
│  - Orquestração de serviços                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                  CAMADA DE SERVIÇOS                          │
│  ⚠️  REGRAS DE NEGÓCIO CRÍTICAS AQUI ⚠️                      │
│  - VehicleService                                            │
│  - MaintenanceService                                        │
│  - ExportService                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                  VALIDAÇÃO (Zod Schemas)                     │
│  - Validação de tipos                                        │
│  - Regras de formato                                         │
│  - Sanitização de dados                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE CLIENT (Abstração DB)                  │
│  - Queries SQL                                               │
│  - Row Level Security (RLS)                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                 BANCO DE DADOS (PostgreSQL)                  │
│  - Tabelas                                                   │
│  - Views                                                     │
│  - Triggers                                                  │
│  - Functions                                                 │
└─────────────────────────────────────────────────────────────┘
```

### Exemplo de Fluxo: Criar Ordem de Manutenção

1. **Frontend**: Usuário preenche formulário
2. **API Route** (`/api/maintenance`): Recebe POST request
3. **Autenticação**: Verifica se usuário está autenticado
4. **Validação**: Schema Zod valida dados de entrada
5. **Service Layer**: `MaintenanceService.create()`
   - Valida unicidade do número da ordem
   - Aplica regras de negócio
6. **Supabase Client**: Insere no banco de dados
7. **Database Trigger**: Atualiza status do veículo automaticamente
8. **Database Trigger**: Registra histórico na timeline
9. **Response**: Retorna ordem criada para o frontend

## 🔐 Regras Críticas de Negócio

### Localização das Regras

**⚠️ IMPORTANTE**: Todas as regras de negócio críticas estão na camada de serviços (`src/lib/services/`).

### VehicleService (`vehicle.service.ts`)

**Regras Implementadas:**

1. **Validação de Placa Única**
   - Método: `validatePlateUniqueness()`
   - Garante que não existam placas duplicadas

2. **Proteção contra Exclusão**
   - Método: `delete()`
   - Impede exclusão de veículos com manutenção ativa

3. **Filtros e Busca**
   - Método: `list()`
   - Busca por status, placa, marca ou modelo

### MaintenanceService (`maintenance.service.ts`)

**Regras Implementadas:**

1. **Validação de Número de Ordem Único**
   - Método: `validateOrderNumberUniqueness()`
   - Garante unicidade do número da ordem

2. **Controle de Status**
   - Método: `start()`
   - Apenas ordens "pending" podem ser iniciadas
   - Registra automaticamente tempo parado (downtime)

3. **Finalização de Manutenção**
   - Método: `complete()`
   - Apenas ordens "in_progress" podem ser finalizadas
   - Valida horas reais vs estimadas (alerta se > 50%)
   - Fecha automaticamente o registro de downtime

4. **Cancelamento**
   - Método: `cancel()`
   - Não permite cancelar ordens já finalizadas

5. **Proteção contra Exclusão**
   - Método: `delete()`
   - Impede exclusão de ordens em andamento

### Regras no Banco de Dados (Triggers)

**Localização**: `supabase/schema.sql`

1. **Atualização Automática de Status do Veículo**
   - Trigger: `trigger_update_vehicle_status`
   - Quando manutenção inicia → veículo fica "in_maintenance"
   - Quando manutenção finaliza → veículo volta para "available"

2. **Registro Automático de Timeline**
   - Trigger: `trigger_track_maintenance_timeline`
   - Toda mudança de status é registrada automaticamente

3. **Fechamento Automático de Downtime**
   - Trigger: `trigger_auto_close_downtime`
   - Quando manutenção finaliza, fecha o registro de tempo parado

4. **Atualização de Timestamps**
   - Trigger: `update_vehicles_updated_at`
   - Trigger: `update_maintenance_orders_updated_at`
   - Atualiza `updated_at` automaticamente

## 🔒 Segurança

### 1. Autenticação

- **Supabase Auth** em todas as rotas de API
- Verificação de usuário autenticado antes de qualquer operação
- Token JWT gerenciado automaticamente

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
}
```

### 2. Row Level Security (RLS)

**Todas as tabelas têm RLS habilitado:**

```sql
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;
```

**Políticas Implementadas:**
- Usuários autenticados podem ler todos os registros
- Usuários autenticados podem inserir/atualizar registros
- Proteção contra acesso não autorizado

### 3. Validação de Dados

**Camada Dupla de Validação:**

1. **Frontend**: Validação de formulário (UX)
2. **Backend**: Schemas Zod obrigatórios (Segurança)

```typescript
// Exemplo de validação
const validated = vehicleSchema.parse(data)
```

### 4. Proteção contra SQL Injection

- **Supabase Client** usa prepared statements automaticamente
- Nunca concatenamos SQL manualmente
- Todos os parâmetros são escapados

### 5. Variáveis de Ambiente

**Nunca exponha no frontend:**
- `SUPABASE_SERVICE_ROLE_KEY` → Apenas backend

**Seguro para frontend:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ⚡ Performance

### 1. Índices no Banco de Dados

```sql
-- Índices para queries frequentes
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_maintenance_orders_vehicle ON maintenance_orders(vehicle_id);
CREATE INDEX idx_maintenance_orders_status ON maintenance_orders(status);
```

### 2. Views Materializadas

**Views otimizadas para relatórios:**
- `v_vehicles_in_maintenance`: Lista veículos em manutenção
- `v_vehicle_downtime_summary`: Resumo de tempo parado
- `v_maintenance_performance`: Performance de manutenções

### 3. Server Components

- Páginas renderizadas no servidor (Next.js 14)
- Reduz JavaScript enviado ao cliente
- Melhora SEO e performance inicial

### 4. Paginação

```typescript
// Implementado em todos os métodos list()
const { limit, offset } = filters
query = query.limit(limit).range(offset, offset + limit - 1)
```

### 5. Caching

- Next.js faz cache automático de Server Components
- Revalidação sob demanda com `revalidatePath()`

## 📊 Funcionalidades Principais

### 1. Cadastro de Veículos
- CRUD completo
- Validação de placa (formato brasileiro)
- Status automático baseado em manutenções

### 2. Ordens de Manutenção
- Criação com número único
- Controle de prioridade (1-5)
- Estimativa vs horas reais
- Timeline de mudanças de status

### 3. Controle de Tempo Parado
- Registro automático ao iniciar manutenção
- Fechamento automático ao finalizar
- Cálculo de horas paradas (computed column)

### 4. Relatórios
- Veículos em manutenção
- Veículos disponíveis
- Resumo de tempo parado por veículo
- Performance de manutenções (estimado vs real)

### 5. Exportação para Excel
- Exportação de veículos
- Exportação de ordens de manutenção
- Exportação de relatórios
- Formatação automática de datas

## 🚀 Como Executar

### 1. Configurar Supabase

```bash
# Criar projeto no Supabase
# Executar o schema.sql no SQL Editor
# Copiar credenciais
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.local.example .env.local
# Editar .env.local com suas credenciais
```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Executar em Desenvolvimento

```bash
npm run dev
```

### 5. Build para Produção

```bash
npm run build
npm start
```

## 📝 Boas Práticas Implementadas

### 1. Separação de Responsabilidades
- **API Routes**: Apenas autenticação e orquestração
- **Services**: Lógica de negócio
- **Validations**: Schemas de validação
- **Database**: Integridade e triggers

### 2. Type Safety
- TypeScript em 100% do código
- Tipos gerados automaticamente do banco (`database.types.ts`)
- Validação runtime com Zod

### 3. Error Handling
- Try-catch em todas as API routes
- Mensagens de erro descritivas
- Logs de erros importantes

### 4. Code Organization
- Um arquivo por responsabilidade
- Nomenclatura clara e consistente
- Comentários em regras complexas

### 5. Database Design
- Normalização adequada
- Foreign keys com CASCADE/SET NULL apropriados
- Constraints para integridade de dados
- Computed columns para cálculos

## 🔧 Manutenção e Extensibilidade

### Adicionar Nova Funcionalidade

1. **Criar tabela** em `supabase/schema.sql`
2. **Atualizar types** em `database.types.ts`
3. **Criar schema** de validação em `src/lib/validations/`
4. **Criar service** em `src/lib/services/`
5. **Criar API routes** em `src/app/api/`
6. **Criar páginas** em `src/app/`

### Modificar Regra de Negócio

- **Localização**: `src/lib/services/*.service.ts`
- Nunca modificar regras diretamente nas API routes
- Sempre validar com schemas Zod

### Adicionar Novo Relatório

1. Criar view no banco de dados
2. Adicionar método no service apropriado
3. Criar API route em `/api/reports/`
4. Adicionar função de exportação em `export.service.ts`

## 📚 Documentação Adicional

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Zod](https://zod.dev/)

## 🎯 Próximos Passos Sugeridos

1. Implementar autenticação completa (login/registro)
2. Adicionar testes unitários e de integração
3. Implementar sistema de notificações
4. Adicionar dashboard com gráficos
5. Implementar upload de fotos dos veículos
6. Adicionar histórico de peças utilizadas
7. Sistema de orçamentos
8. Integração com WhatsApp/Email
