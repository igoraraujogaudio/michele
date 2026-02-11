# 🎨 Guia Completo - Frontend Next.js 14

## 📋 Visão Geral

Sistema frontend completo para controle de veículos em oficina, usando:
- ✅ **Next.js 14** com App Router
- ✅ **React Hook Form** + **Zod** para formulários
- ✅ **Tailwind CSS** para estilização
- ✅ **Inputs UPPERCASE automáticos**
- ✅ **Contador de tempo em tempo real**
- ✅ **Upload Excel/CSV**

---

## 📁 Estrutura Criada

```
src/
├── components/
│   └── ui/
│       ├── Input.tsx          # Input com UPPERCASE automático
│       ├── Select.tsx         # Select estilizado
│       ├── Button.tsx         # Button com loading
│       └── Card.tsx           # Card container
├── app/
│   ├── veiculos/
│   │   ├── page.tsx           # Lista de veículos
│   │   └── novo/
│   │       └── page.tsx       # Cadastro de veículo
│   ├── ordens/
│   │   ├── nova/
│   │   │   └── page.tsx       # Nova ordem
│   │   └── [id]/
│   │       └── page.tsx       # Editar ordem
│   ├── relatorios/
│   │   ├── em-manutencao/
│   │   │   └── page.tsx       # Relatório com contador
│   │   └── disponiveis/
│   │       └── page.tsx       # Veículos disponíveis
│   ├── upload/
│   │   └── page.tsx           # Upload Excel/CSV
│   └── api/
│       └── export/
│           ├── em-manutencao/
│           │   └── route.ts   # API export
│           └── disponiveis/
│               └── route.ts   # API export
```

---

## 🎨 Componentes UI

### 1. Input com UPPERCASE Automático

**`src/components/ui/Input.tsx`**

```typescript
<Input
  label="Prefixo"
  placeholder="V001"
  uppercase  // ← Converte automaticamente para UPPERCASE
  {...register('prefixo')}
  error={errors.prefixo?.message}
  required
/>
```

**Funcionalidades:**
- ✅ Conversão automática para UPPERCASE
- ✅ Label com asterisco para campos obrigatórios
- ✅ Mensagem de erro integrada
- ✅ Estilização Tailwind CSS
- ✅ Compatível com React Hook Form

---

### 2. Select Estilizado

**`src/components/ui/Select.tsx`**

```typescript
<Select
  label="Status"
  options={[
    { value: 'EM MANUTENÇÃO', label: 'EM MANUTENÇÃO' },
    { value: 'PRONTO', label: 'PRONTO' },
  ]}
  {...register('status')}
  error={errors.status?.message}
  required
/>
```

**Funcionalidades:**
- ✅ Opção "Selecione..." padrão
- ✅ Mensagem de erro integrada
- ✅ Estilização consistente

---

### 3. Button com Loading

**`src/components/ui/Button.tsx`**

```typescript
<Button 
  type="submit" 
  loading={loading}  // ← Mostra spinner
  variant="primary"  // primary | secondary | danger | success
>
  Salvar
</Button>
```

**Variantes:**
- `primary` - Azul (ação principal)
- `secondary` - Cinza (ação secundária)
- `danger` - Vermelho (ação destrutiva)
- `success` - Verde (ação positiva)

---

### 4. Card Container

**`src/components/ui/Card.tsx`**

```typescript
<Card title="Dados do Veículo">
  <p>Conteúdo do card</p>
</Card>
```

---

## 📄 Telas Criadas

### 1. Cadastro de Veículos

**Rota:** `/veiculos/novo`

**Funcionalidades:**
- ✅ Formulário com React Hook Form + Zod
- ✅ Todos os inputs em UPPERCASE automático
- ✅ Validação em tempo real
- ✅ Mensagens de erro em português
- ✅ Botão com loading state

**Campos:**
- Prefixo (obrigatório, UPPERCASE)
- Placa (obrigatório, UPPERCASE, validação de formato)
- Marca (obrigatório, UPPERCASE)
- Modelo (obrigatório, UPPERCASE)
- Ano (obrigatório, número)
- Cor (opcional, UPPERCASE)
- Observações (opcional, UPPERCASE)

**Validações:**
- Prefixo único
- Placa única
- Formato de placa: ABC-1234 ou ABC1D23

---

### 2. Lista de Veículos

**Rota:** `/veiculos`

**Funcionalidades:**
- ✅ Server Component (SSR)
- ✅ Tabela responsiva
- ✅ Link para criar nova ordem
- ✅ Link para ver detalhes

**Ações:**
- Ver detalhes do veículo
- Criar nova ordem de manutenção

---

### 3. Nova Ordem de Manutenção

**Rota:** `/ordens/nova`

**Funcionalidades:**
- ✅ Select de veículos disponíveis
- ✅ Auto-preenchimento ao selecionar veículo
- ✅ Card com dados do veículo selecionado
- ✅ Textarea com UPPERCASE automático
- ✅ Validação de veículo cadastrado

**Campos:**
- Número da Ordem (obrigatório, UPPERCASE)
- Veículo (select, apenas disponíveis)
- Descrição (obrigatório, UPPERCASE, textarea)
- Observações (opcional, UPPERCASE, textarea)

**Auto-preenchimento:**
Ao selecionar um veículo, exibe card com:
- Prefixo
- Placa
- Marca
- Modelo
- Ano
- Cor

---

### 4. Editar Ordem de Manutenção

**Rota:** `/ordens/[id]`

**Funcionalidades:**
- ✅ Visualização completa da ordem
- ✅ Dados do veículo
- ✅ Alterar status com select
- ✅ Adicionar observação na mudança
- ✅ Histórico completo de status
- ✅ Cálculo de tempo parado

**Cards:**
1. **Dados do Veículo** - Prefixo, placa, marca, modelo, ano
2. **Dados da Ordem** - Status (badge colorido), datas, tempo parado
3. **Descrição** - Descrição e observações
4. **Alterar Status** - Select + textarea + botão
5. **Histórico de Status** - Timeline com todas as mudanças

**Status com cores:**
- `PRONTO` - Verde
- `EM MANUTENÇÃO` - Azul
- `AGUARDANDO PEÇA` - Amarelo
- Outros - Cinza

---

### 5. Relatório de Veículos em Manutenção

**Rota:** `/relatorios/em-manutencao`

**Funcionalidades:**
- ✅ **Contador de tempo em tempo real** (atualiza a cada segundo)
- ✅ Grid responsivo de cards
- ✅ Alertas visuais por tempo parado
- ✅ Botão de exportar Excel
- ✅ Link para ver detalhes da ordem

**Contador em Tempo Real:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    // Atualiza tempo a cada 1 segundo
    const minutos = Math.floor((agora - dataAbertura) / 1000 / 60);
    setTemposAtuais({ ...tempos, [ordemId]: minutos });
  }, 1000);

  return () => clearInterval(interval);
}, [ordens]);
```

**Alertas Visuais:**
- 🟢 **Normal** - Borda cinza (< 24h)
- 🟡 **Alerta** - Borda amarela (24h - 48h)
- 🔴 **Urgente** - Borda vermelha (> 48h)

**Formato do tempo:**
- `2d 5h 30min` - Mais de 1 dia
- `15h 45min` - Menos de 1 dia

---

### 6. Relatório de Veículos Disponíveis

**Rota:** `/relatorios/disponiveis`

**Funcionalidades:**
- ✅ Server Component (SSR)
- ✅ Tabela de veículos sem ordem aberta
- ✅ Badge "DISPONÍVEL" verde
- ✅ Link para criar ordem
- ✅ Botão de exportar Excel

---

### 7. Upload de Veículos (Excel/CSV)

**Rota:** `/upload`

**Funcionalidades:**
- ✅ Upload de arquivo Excel ou CSV
- ✅ Preview dos dados antes de importar
- ✅ Validação linha por linha
- ✅ Relatório de sucesso/erros
- ✅ Download de template Excel

**Fluxo:**
1. Usuário faz upload do arquivo
2. Sistema lê e exibe preview em tabela
3. Usuário confirma importação
4. Sistema importa linha por linha
5. Exibe resultado: X sucessos, Y erros

**Colunas aceitas:**
- `prefixo` (obrigatório)
- `placa` (obrigatório)
- `marca` (obrigatório)
- `modelo` (obrigatório)
- `ano` (obrigatório)
- `cor` (opcional)
- `observacoes` (opcional)

**Template Excel:**
Botão para baixar arquivo de exemplo com:
```
prefixo | placa    | marca      | modelo | ano  | cor    | observacoes
V001    | ABC-1234 | VOLKSWAGEN | GOL    | 2020 | BRANCO | Exemplo
```

---

## 🔄 Fluxo de Dados

### Cadastro de Veículo

```
1. Usuário preenche formulário
2. React Hook Form valida com Zod
3. Inputs convertem para UPPERCASE
4. Submit chama createVeiculo()
5. Server Action valida no backend
6. Salva no Supabase
7. Revalida cache do Next.js
8. Redireciona para /veiculos
```

### Nova Ordem

```
1. Carrega veículos disponíveis
2. Usuário seleciona veículo
3. Auto-preenche dados do veículo
4. Usuário preenche descrição
5. Submit chama createOrdemManutencao()
6. Valida: veículo existe + não tem ordem aberta
7. Salva ordem no Supabase
8. Trigger do banco registra histórico
9. Redireciona para /ordens
```

### Alterar Status

```
1. Usuário seleciona novo status
2. Opcionalmente adiciona observação
3. Submit chama updateOrdemStatus()
4. Server Action atualiza status
5. Se PRONTO/REPARO PARCIAL:
   - Define data_fechamento
   - Calcula tempo_parado_minutos
6. Trigger registra no histórico
7. Recarrega página
```

### Contador em Tempo Real

```
1. Componente carrega ordens abertas
2. useEffect inicia setInterval(1000ms)
3. A cada segundo:
   - Calcula: NOW() - data_abertura
   - Atualiza estado local
   - Re-renderiza contador
4. Cleanup ao desmontar componente
```

---

## 🎯 Funcionalidades Especiais

### 1. UPPERCASE Automático

**Todos os inputs de texto** convertem automaticamente para UPPERCASE:

```typescript
// No componente Input
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (uppercase) {
    e.target.value = e.target.value.toUpperCase();
  }
  onChange?.(e);
};
```

**Também em textareas:**
```typescript
<textarea
  onChange={(e) => setObservacao(e.target.value.toUpperCase())}
  className="uppercase"
/>
```

---

### 2. Auto-preenchimento de Veículo

Ao selecionar veículo no select, exibe card com todos os dados:

```typescript
useEffect(() => {
  if (veiculoId) {
    const veiculo = veiculos.find(v => v.id === veiculoId);
    setVeiculoSelecionado(veiculo || null);
  }
}, [veiculoId, veiculos]);
```

---

### 3. Validação de Formato de Placa

Aceita dois formatos:
- **Antigo:** ABC-1234
- **Mercosul:** ABC1D23

```typescript
placa: z.string()
  .regex(/^[A-Za-z]{3}-?[0-9][A-Za-z0-9][0-9]{2}$/, 
         'Formato de placa inválido')
```

---

### 4. Exportação Excel

**API Routes criadas:**
- `/api/export/em-manutencao` - Veículos em manutenção
- `/api/export/disponiveis` - Veículos disponíveis

**Uso:**
```typescript
<a href="/api/export/em-manutencao" target="_blank">
  <Button variant="success">Exportar Excel</Button>
</a>
```

---

## 🎨 Estilização

### Tailwind CSS

**Classes principais:**
- `container mx-auto px-4 py-8` - Container responsivo
- `grid grid-cols-1 md:grid-cols-2 gap-4` - Grid responsivo
- `bg-white rounded-lg shadow-md` - Card
- `px-4 py-2 rounded-md font-medium` - Button
- `border border-gray-300 rounded-md` - Input

### Cores do Sistema

```css
Primary (Azul): bg-blue-600, text-blue-600
Success (Verde): bg-green-600, text-green-600
Warning (Amarelo): bg-yellow-600, text-yellow-600
Danger (Vermelho): bg-red-600, text-red-600
Secondary (Cinza): bg-gray-600, text-gray-600
```

---

## 📱 Responsividade

Todas as telas são responsivas:

**Mobile (< 768px):**
- Grid de 1 coluna
- Tabelas com scroll horizontal
- Cards empilhados

**Tablet (768px - 1024px):**
- Grid de 2 colunas
- Tabelas responsivas

**Desktop (> 1024px):**
- Grid de 3 colunas (relatórios)
- Grid de 2 colunas (formulários)
- Tabelas completas

---

## 🚀 Como Usar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Ambiente

```bash
cp .env.local.example .env.local
# Editar .env.local com credenciais do Supabase
```

### 3. Executar em Desenvolvimento

```bash
npm run dev
```

### 4. Acessar Telas

- Veículos: http://localhost:3000/veiculos
- Nova Ordem: http://localhost:3000/ordens/nova
- Relatório: http://localhost:3000/relatorios/em-manutencao
- Upload: http://localhost:3000/upload

---

## 📋 Checklist de Funcionalidades

### Componentes UI
- [x] Input com UPPERCASE automático
- [x] Select estilizado
- [x] Button com loading
- [x] Card container

### Telas
- [x] Cadastro de veículos
- [x] Lista de veículos
- [x] Nova ordem de manutenção
- [x] Edição de ordem
- [x] Relatório em manutenção (com contador)
- [x] Relatório disponíveis
- [x] Upload Excel/CSV

### Funcionalidades
- [x] React Hook Form + Zod
- [x] UPPERCASE automático
- [x] Auto-preenchimento de veículo
- [x] Contador de tempo em tempo real
- [x] Alertas visuais (cores)
- [x] Exportação Excel
- [x] Upload e validação CSV/Excel
- [x] Histórico de status
- [x] Responsividade completa

---

## 🎓 Boas Práticas Aplicadas

### 1. Server Components vs Client Components

**Server Components (padrão):**
- `/veiculos/page.tsx` - Lista de veículos
- `/relatorios/disponiveis/page.tsx` - Relatório

**Client Components ('use client'):**
- `/veiculos/novo/page.tsx` - Formulário
- `/ordens/nova/page.tsx` - Formulário
- `/relatorios/em-manutencao/page.tsx` - Contador em tempo real

### 2. Validação em Múltiplas Camadas

1. **Frontend** - React Hook Form + Zod
2. **Backend** - Server Actions com Zod
3. **Banco** - Constraints e triggers

### 3. UX Simples e Funcional

- Mensagens de erro claras
- Loading states visíveis
- Feedback imediato
- Navegação intuitiva

---

## ✨ Resultado Final

Sistema frontend **completo e funcional** com:
- ✅ 7 telas criadas
- ✅ 4 componentes UI reutilizáveis
- ✅ Formulários com validação
- ✅ Contador em tempo real
- ✅ Upload Excel/CSV
- ✅ Exportação Excel
- ✅ 100% responsivo
- ✅ UX simples e eficiente

**Pronto para uso em produção!** 🚀
