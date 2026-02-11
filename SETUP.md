# Guia de Configuração e Deploy

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Git instalado
- Editor de código (VS Code recomendado)

## 🚀 Setup Inicial

### 1. Configurar Supabase

#### 1.1. Criar Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Clique em "Start your project"
3. Crie uma nova organização (se necessário)
4. Clique em "New Project"
5. Preencha:
   - **Name**: vehicle-workshop
   - **Database Password**: (escolha uma senha forte)
   - **Region**: escolha a mais próxima
6. Aguarde a criação do projeto (~2 minutos)

#### 1.2. Executar Schema SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo de `supabase/schema.sql`
4. Cole no editor
5. Clique em **Run** (ou Ctrl+Enter)
6. Verifique se todas as tabelas foram criadas:
   - Vá em **Table Editor**
   - Deve ver: vehicles, maintenance_orders, maintenance_timeline, vehicle_downtime

#### 1.3. Copiar Credenciais

1. Vá em **Settings** → **API**
2. Copie:
   - **Project URL** (ex: https://xxxxx.supabase.co)
   - **anon/public key** (chave pública)
   - **service_role key** (chave privada - ⚠️ NUNCA exponha)

### 2. Configurar Projeto Local

#### 2.1. Clonar/Copiar Arquivos

```bash
# Se estiver usando Git
git clone <seu-repositorio>
cd vehicle-workshop

# Ou copie a pasta vehicle-workshop para seu local de trabalho
```

#### 2.2. Instalar Dependências

```bash
npm install
```

#### 2.3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.local.example .env.local
```

Edite `.env.local` e adicione suas credenciais:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **IMPORTANTE**: Nunca commite o arquivo `.env.local` no Git!

### 3. Executar em Desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000)

## 🔐 Configurar Autenticação

### Opção 1: Email/Password (Recomendado para início)

1. No Supabase, vá em **Authentication** → **Providers**
2. Habilite **Email**
3. Configure:
   - ✅ Enable email confirmations (recomendado)
   - ✅ Enable email change confirmations

### Opção 2: OAuth (Google, GitHub, etc.)

1. Vá em **Authentication** → **Providers**
2. Escolha o provider (ex: Google)
3. Siga as instruções para configurar OAuth
4. Adicione as credenciais

### Criar Primeiro Usuário

**Via Supabase Dashboard:**

1. Vá em **Authentication** → **Users**
2. Clique em **Add user** → **Create new user**
3. Preencha email e senha
4. Clique em **Create user**

**Via Código (implementar página de registro):**

```typescript
// Exemplo de registro
const { data, error } = await supabase.auth.signUp({
  email: 'usuario@exemplo.com',
  password: 'senha-forte-123',
})
```

## 📊 Verificar Instalação

### Checklist

- [ ] Projeto Supabase criado
- [ ] Schema SQL executado com sucesso
- [ ] Tabelas visíveis no Table Editor
- [ ] Views criadas (v_vehicles_in_maintenance, etc.)
- [ ] Variáveis de ambiente configuradas
- [ ] `npm install` executado sem erros
- [ ] `npm run dev` rodando
- [ ] Consegue acessar http://localhost:3000
- [ ] Usuário de teste criado

### Testar Funcionalidades

1. **Criar Veículo**
   ```bash
   # Via API (use Postman ou curl)
   POST http://localhost:3000/api/vehicles
   Headers: Authorization: Bearer <seu-token>
   Body: {
     "plate": "ABC1D23",
     "brand": "Toyota",
     "model": "Corolla",
     "year": 2023
   }
   ```

2. **Listar Veículos**
   ```bash
   GET http://localhost:3000/api/vehicles
   ```

## 🌐 Deploy em Produção

### Opção 1: Vercel (Recomendado)

1. Instale Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Configure variáveis de ambiente:
   - Vá no dashboard da Vercel
   - Settings → Environment Variables
   - Adicione as mesmas variáveis do `.env.local`

4. Redeploy:
   ```bash
   vercel --prod
   ```

### Opção 2: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build e run:
```bash
docker build -t vehicle-workshop .
docker run -p 3000:3000 --env-file .env.local vehicle-workshop
```

## 🔧 Troubleshooting

### Erro: "Cannot find module"

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Unauthorized" nas APIs

- Verifique se o usuário está autenticado
- Verifique se o token JWT é válido
- Verifique RLS policies no Supabase

### Erro: "Relation does not exist"

- Execute novamente o `schema.sql`
- Verifique se está conectado ao projeto correto

### Erro: "Invalid API key"

- Verifique se copiou as chaves corretas
- Verifique se não há espaços extras
- Verifique se está usando a chave do projeto correto

### Erro de CORS

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}
```

## 📈 Monitoramento

### Logs do Supabase

1. Vá em **Logs** no dashboard
2. Monitore:
   - Database logs
   - API logs
   - Auth logs

### Logs do Next.js

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

### Métricas Importantes

- Tempo de resposta das APIs
- Taxa de erro
- Número de queries ao banco
- Uso de memória

## 🔄 Atualizações

### Atualizar Schema do Banco

```sql
-- Sempre use migrations
-- Exemplo: adicionar coluna
ALTER TABLE vehicles ADD COLUMN vin VARCHAR(17);

-- Criar índice
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
```

### Atualizar Dependências

```bash
# Verificar atualizações
npm outdated

# Atualizar
npm update

# Atualizar major versions (cuidado!)
npm install next@latest react@latest
```

## 📚 Recursos Adicionais

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Guia de Deploy Vercel](https://vercel.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique a documentação
2. Consulte os logs
3. Verifique issues no GitHub
4. Entre em contato com a equipe
