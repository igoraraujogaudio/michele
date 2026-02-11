# 🔐 Guia de Configuração de Autenticação e Segurança

## 📋 Ordem de Execução no Supabase

### **1️⃣ Executar Schema Principal**
```bash
# No Supabase SQL Editor, execute:
schema_custom.sql
```
**O que faz:**
- Cria tabelas: `veiculos`, `ordens_manutencao`, `historico_status`
- Cria tipo ENUM `status_ordem`
- Cria triggers automáticos (UPPERCASE, tempo parado, histórico)
- Cria funções de validação

---

### **2️⃣ Executar Políticas RLS**
```bash
# No Supabase SQL Editor, execute:
rls_policies.sql
```
**O que faz:**
- ✅ Habilita RLS em todas as tabelas
- ✅ Cria políticas para usuários autenticados
- ✅ Bloqueia acesso de usuários anônimos
- ✅ Permite SELECT, INSERT, UPDATE, DELETE apenas para `authenticated`

**Políticas Criadas:**
- `veiculos`: 4 políticas (SELECT, INSERT, UPDATE, DELETE)
- `ordens_manutencao`: 4 políticas (SELECT, INSERT, UPDATE, DELETE)
- `historico_status`: 2 políticas (SELECT, INSERT - apenas sistema)

---

### **3️⃣ Executar Queries de Relatórios**
```bash
# No Supabase SQL Editor, execute:
queries_relatorios.sql
```
**O que faz:**
- Cria view `vw_veiculos_em_manutencao`
- Cria view `vw_veiculos_disponiveis`
- Cria funções de busca com filtros
- Cria índices otimizados

---

## 🔧 Configuração do Next.js

### **1️⃣ Instalar Dependências**
```bash
npm install
```

**Novas dependências adicionadas:**
- `@supabase/ssr` - Autenticação server-side
- `react-hook-form` - Gerenciamento de formulários
- `@hookform/resolvers` - Integração Zod + React Hook Form

---

### **2️⃣ Configurar Variáveis de Ambiente**

Crie o arquivo `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
```

**Onde encontrar as chaves:**
1. Acesse seu projeto no Supabase
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

---

### **3️⃣ Habilitar Autenticação por E-mail no Supabase**

1. Acesse **Authentication** → **Providers**
2. Habilite **Email**
3. Configure:
   - ✅ Enable Email provider
   - ✅ Confirm email (opcional - recomendado para produção)
   - ✅ Secure email change (recomendado)

---

## 🚀 Estrutura de Arquivos Criados

### **Autenticação**
```
src/
├── lib/
│   └── auth/
│       └── auth.helpers.ts          # Funções de login, registro, logout
├── middleware.ts                     # Proteção de rotas automática
└── app/
    └── auth/
        ├── login/page.tsx           # Página de login
        └── register/page.tsx        # Página de registro
```

### **Componentes**
```
src/
└── components/
    └── layout/
        └── Header.tsx               # Header com logout e navegação
```

### **Banco de Dados**
```
supabase/
├── schema_custom.sql                # Schema principal
├── rls_policies.sql                 # Políticas de segurança RLS
├── queries_relatorios.sql           # Views e funções de relatórios
└── migration_add_reserva_fields.sql # Migração incremental (se necessário)
```

---

## 🔒 Funcionalidades de Segurança Implementadas

### **1. Row Level Security (RLS)**
- ✅ Todas as tabelas protegidas
- ✅ Apenas usuários autenticados têm acesso
- ✅ Usuários anônimos bloqueados
- ✅ Histórico imutável (apenas INSERT)

### **2. Middleware Next.js**
- ✅ Proteção automática de rotas
- ✅ Redirect para login se não autenticado
- ✅ Redirect para dashboard se já autenticado
- ✅ Preserva URL de destino após login

### **3. Autenticação**
- ✅ Login por e-mail e senha
- ✅ Registro de novos usuários
- ✅ Logout seguro
- ✅ Reset de senha (implementado)
- ✅ Sessão persistente com cookies

### **4. Validações**
- ✅ Senha mínima de 6 caracteres
- ✅ Confirmação de senha no registro
- ✅ E-mail válido obrigatório
- ✅ Feedback de erros amigável

---

## 📱 Rotas do Sistema

### **Rotas Públicas (Não Requerem Login)**
- `/auth/login` - Página de login
- `/auth/register` - Página de registro
- `/auth/reset-password` - Reset de senha

### **Rotas Protegidas (Requerem Login)**
- `/dashboard` - Dashboard principal
- `/veiculos` - Listagem de veículos
- `/veiculos/novo` - Cadastrar veículo
- `/veiculos/[id]` - Editar veículo
- `/ordens` - Listagem de ordens
- `/ordens/nova` - Nova ordem
- `/ordens/[id]` - Editar ordem
- `/relatorios/em-manutencao` - Relatório de manutenção
- `/relatorios/disponiveis` - Relatório de disponíveis
- `/upload` - Upload de planilhas

---

## 🧪 Testar Autenticação

### **1. Criar Primeiro Usuário**
```bash
# Acesse: http://localhost:3000/auth/register
# Preencha:
- Nome: Admin
- E-mail: admin@oficina.com
- Senha: 123456
```

### **2. Fazer Login**
```bash
# Acesse: http://localhost:3000/auth/login
# Use as credenciais criadas
```

### **3. Verificar Proteção de Rotas**
```bash
# Tente acessar sem login:
http://localhost:3000/dashboard
# Deve redirecionar para /auth/login

# Faça login e tente novamente
# Deve acessar normalmente
```

---

## 🔐 Boas Práticas de Segurança Implementadas

### **✅ Implementado**
1. **RLS habilitado** - Todas as tabelas protegidas
2. **Autenticação obrigatória** - Sem acesso anônimo
3. **Middleware automático** - Proteção de rotas
4. **Cookies seguros** - HttpOnly, Secure, SameSite
5. **Validação de entrada** - Zod + React Hook Form
6. **Senhas hasheadas** - Supabase Auth cuida disso
7. **HTTPS obrigatório** - Em produção
8. **Tokens JWT** - Renovação automática

### **⚠️ Recomendações Adicionais para Produção**
1. **Confirmação de e-mail** - Habilitar no Supabase
2. **2FA (Two-Factor Auth)** - Implementar se necessário
3. **Rate limiting** - Limitar tentativas de login
4. **Logs de auditoria** - Registrar ações críticas
5. **Backup automático** - Configurar no Supabase
6. **Monitoramento** - Alertas de segurança

---

## 🚨 Troubleshooting

### **Erro: "Module '@supabase/ssr' not found"**
```bash
npm install @supabase/ssr
```

### **Erro: "createClient is not exported"**
Verifique se o arquivo `src/lib/supabase/server.ts` existe e exporta `createClient`.

### **Erro: "RLS policy violation"**
1. Verifique se executou `rls_policies.sql`
2. Verifique se o usuário está autenticado
3. Verifique as políticas no Supabase Dashboard

### **Usuário não consegue fazer login**
1. Verifique se o e-mail está confirmado (se habilitado)
2. Verifique as credenciais no Supabase → Authentication → Users
3. Verifique os logs no console do navegador

---

## 📊 Verificar Segurança no Supabase

### **1. Verificar RLS Habilitado**
```sql
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('veiculos', 'ordens_manutencao', 'historico_status');
```

**Resultado esperado:** `rowsecurity = true` para todas

### **2. Listar Políticas**
```sql
SELECT 
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Resultado esperado:** 10 políticas criadas

---

## ✅ Checklist Final

- [ ] Executou `schema_custom.sql` no Supabase
- [ ] Executou `rls_policies.sql` no Supabase
- [ ] Executou `queries_relatorios.sql` no Supabase
- [ ] Configurou `.env.local` com credenciais
- [ ] Executou `npm install`
- [ ] Habilitou Email Auth no Supabase
- [ ] Criou primeiro usuário em `/auth/register`
- [ ] Testou login em `/auth/login`
- [ ] Verificou proteção de rotas
- [ ] Verificou RLS no Supabase Dashboard

---

## 🎉 Sistema Pronto!

Após completar todos os passos, o sistema estará:
- ✅ Totalmente protegido com RLS
- ✅ Autenticação funcional
- ✅ Rotas protegidas automaticamente
- ✅ Pronto para produção (com as recomendações aplicadas)

**Próximos Passos:**
1. Criar usuários no sistema
2. Cadastrar veículos
3. Criar ordens de manutenção
4. Gerar relatórios
5. Exportar para Excel

---

**Desenvolvido com ❤️ para controle de veículos em oficina**
