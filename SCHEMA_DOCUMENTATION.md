# Documentação do Schema SQL - Sistema de Controle de Veículos

## 📋 Visão Geral

Schema SQL completo para sistema de controle de veículos em oficina com **automações inteligentes** e **validações rigorosas**.

## 🎯 Requisitos Implementados

### ✅ Todos os Requisitos Atendidos

- [x] **Prefixo único** - Constraint UNIQUE na coluna `prefixo`
- [x] **Placa única com hífen** - Constraint UNIQUE + validação de formato
- [x] **Todo texto em UPPERCASE** - Trigger automático em INSERT/UPDATE
- [x] **Controle de tempo automático** - Triggers calculam tempo parado
- [x] **Impedir ordens duplicadas** - Trigger valida ordem única aberta por veículo
- [x] **Cálculo de tempo no backend** - Functions PostgreSQL
- [x] **9 Status possíveis** - ENUM type com todos os status

## 📊 Estrutura das Tabelas

### Tabela: `veiculos`

```sql
CREATE TABLE veiculos (
  id UUID PRIMARY KEY,
  prefixo VARCHAR(20) UNIQUE NOT NULL,      -- Prefixo único (UPPERCASE)
  placa VARCHAR(8) UNIQUE NOT NULL,         -- ABC-1234 ou ABC1D23 (UPPERCASE)
  marca VARCHAR(100) NOT NULL,              -- UPPERCASE
  modelo VARCHAR(100) NOT NULL,             -- UPPERCASE
  ano INTEGER NOT NULL,
  cor VARCHAR(50),                          -- UPPERCASE
  observacoes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Constraints:**
- `prefixo_not_empty` - Prefixo não pode ser vazio
- `placa_format` - Valida formato ABC-1234 ou ABC1D23
- `ano_valido` - Ano entre 1900 e 2100

### Tabela: `ordens_manutencao`

```sql
CREATE TABLE ordens_manutencao (
  id UUID PRIMARY KEY,
  numero_ordem VARCHAR(20) UNIQUE NOT NULL,  -- UPPERCASE
  veiculo_id UUID REFERENCES veiculos(id),
  status status_ordem NOT NULL,
  descricao TEXT NOT NULL,                   -- UPPERCASE
  observacoes TEXT,                          -- UPPERCASE
  
  -- Controle automático de tempo
  data_abertura TIMESTAMPTZ NOT NULL,
  data_fechamento TIMESTAMPTZ,               -- Preenchido automaticamente
  tempo_parado_minutos INTEGER,              -- Calculado automaticamente
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
)
```

**Constraints:**
- `descricao_not_empty` - Descrição obrigatória
- `data_fechamento_valida` - Fechamento >= abertura
- `tempo_parado_positivo` - Tempo >= 0

### Tabela: `historico_status`

```sql
CREATE TABLE historico_status (
  id UUID PRIMARY KEY,
  ordem_id UUID REFERENCES ordens_manutencao(id),
  status_anterior status_ordem,
  status_novo status_ordem NOT NULL,
  data_mudanca TIMESTAMPTZ NOT NULL,
  observacao TEXT,
  changed_by UUID
)
```

## 🔄 Status Possíveis (ENUM)

```sql
CREATE TYPE status_ordem AS ENUM (
  'EM MANUTENÇÃO',
  'AGUARDANDO PEÇA',
  'REPARO PARCIAL',
  'PRONTO',
  'FORNECEDOR EXTERNO',
  'PARADO PRONTO CJ',
  'PARADO PRONTO CG',
  'PARADO EM MANUTENÇÃO CJ',
  'PARADO EM MANUTENÇÃO CG'
);
```

## ⚙️ Automações (Triggers)

### 1. UPPERCASE Automático

**Trigger:** `trigger_uppercase_veiculos` e `trigger_uppercase_ordens`

**Função:** Converte automaticamente para UPPERCASE:
- Prefixo
- Placa
- Marca
- Modelo
- Cor
- Número da ordem
- Descrição
- Observações

**Exemplo:**
```sql
INSERT INTO veiculos (prefixo, placa, marca, modelo, ano)
VALUES ('v001', 'abc-1234', 'volkswagen', 'gol', 2020);

-- Resultado armazenado:
-- prefixo: 'V001'
-- placa: 'ABC-1234'
-- marca: 'VOLKSWAGEN'
-- modelo: 'GOL'
```

### 2. Controle Automático de Tempo Parado

**Trigger:** `trigger_fechamento_ordem`

**Comportamento:**

#### Ao mudar status para PRONTO ou REPARO PARCIAL:
1. Define `data_fechamento = NOW()`
2. Calcula `tempo_parado_minutos` automaticamente
3. Fórmula: `(data_fechamento - data_abertura) em minutos`

#### Ao reabrir ordem (status sai de PRONTO/REPARO PARCIAL):
1. Remove `data_fechamento`
2. Limpa `tempo_parado_minutos`

**Exemplo:**
```sql
-- Criar ordem (inicia contagem automaticamente)
INSERT INTO ordens_manutencao (numero_ordem, veiculo_id, descricao)
VALUES ('OM-001', '...', 'TROCA DE ÓLEO');
-- data_abertura = NOW() automaticamente

-- Finalizar ordem (encerra contagem)
UPDATE ordens_manutencao 
SET status = 'PRONTO' 
WHERE numero_ordem = 'OM-001';
-- data_fechamento = NOW() automaticamente
-- tempo_parado_minutos = calculado automaticamente
```

### 3. Validação de Ordem Única Aberta

**Trigger:** `trigger_validar_ordem_unica`

**Regra:** Um veículo NÃO pode ter duas ordens abertas simultaneamente.

**Validação:**
- Ordem está aberta se `data_fechamento IS NULL`
- Ao tentar criar nova ordem, verifica se já existe ordem aberta
- Se existir, **lança exceção** e impede a criação

**Exemplo de erro:**
```sql
-- Ordem 1 aberta para veículo V001
INSERT INTO ordens_manutencao (numero_ordem, veiculo_id, descricao)
VALUES ('OM-001', 'v001_id', 'TROCA DE ÓLEO');

-- Tentar criar ordem 2 para mesmo veículo
INSERT INTO ordens_manutencao (numero_ordem, veiculo_id, descricao)
VALUES ('OM-002', 'v001_id', 'REVISÃO');

-- ERRO: Veículo já possui uma ordem de manutenção aberta
```

### 4. Histórico Automático de Status

**Trigger:** `trigger_historico_status`

**Comportamento:**
- Registra automaticamente toda mudança de status
- Na criação: registra status inicial (status_anterior = NULL)
- Na atualização: registra status anterior e novo

**Exemplo:**
```sql
-- Criar ordem
INSERT INTO ordens_manutencao (numero_ordem, veiculo_id, status, descricao)
VALUES ('OM-001', '...', 'EM MANUTENÇÃO', 'TROCA DE ÓLEO');
-- Histórico: NULL → 'EM MANUTENÇÃO'

-- Mudar status
UPDATE ordens_manutencao SET status = 'AGUARDANDO PEÇA' WHERE numero_ordem = 'OM-001';
-- Histórico: 'EM MANUTENÇÃO' → 'AGUARDANDO PEÇA'

-- Finalizar
UPDATE ordens_manutencao SET status = 'PRONTO' WHERE numero_ordem = 'OM-001';
-- Histórico: 'AGUARDANDO PEÇA' → 'PRONTO'
```

## 📈 Views Úteis

### 1. `v_ordens_abertas`

Lista todas as ordens abertas com **tempo parado em tempo real**.

```sql
SELECT * FROM v_ordens_abertas;
```

**Colunas:**
- `numero_ordem`
- `prefixo`, `placa`, `marca`, `modelo`
- `status`
- `data_abertura`
- `tempo_parado_minutos_atual` - Calculado em tempo real
- `tempo_parado_horas_atual` - Em horas (decimal)

### 2. `v_ordens_finalizadas`

Lista ordens finalizadas com tempo total parado.

```sql
SELECT * FROM v_ordens_finalizadas;
```

**Colunas:**
- `numero_ordem`
- `prefixo`, `placa`
- `status` (PRONTO ou REPARO PARCIAL)
- `data_abertura`, `data_fechamento`
- `tempo_parado_minutos` - Tempo total
- `tempo_parado_horas` - Em horas

### 3. `v_resumo_veiculos`

Estatísticas por veículo.

```sql
SELECT * FROM v_resumo_veiculos;
```

**Colunas:**
- `prefixo`, `placa`, `marca`, `modelo`
- `total_ordens`
- `ordens_abertas`
- `ordens_finalizadas`
- `total_tempo_parado_minutos`
- `total_tempo_parado_horas`
- `media_tempo_parado_minutos`

### 4. `v_historico_completo`

Histórico detalhado com tempo em cada status.

```sql
SELECT * FROM v_historico_completo WHERE numero_ordem = 'OM-001';
```

**Colunas:**
- `numero_ordem`, `prefixo`, `placa`
- `status_anterior`, `status_novo`
- `data_mudanca`
- `minutos_neste_status` - Quanto tempo ficou neste status

## 🔧 Functions Úteis

### 1. `calcular_tempo_parado_atual(ordem_id UUID)`

Calcula tempo parado atual de uma ordem (em minutos).

```sql
-- Para ordem fechada: retorna tempo_parado_minutos
-- Para ordem aberta: calcula tempo até NOW()
SELECT calcular_tempo_parado_atual('ordem_uuid');
```

### 2. `buscar_ordens_periodo(data_inicio, data_fim)`

Busca ordens em um período específico.

```sql
SELECT * FROM buscar_ordens_periodo(
  '2024-01-01 00:00:00',
  '2024-01-31 23:59:59'
);
```

## 🚀 Índices para Performance

```sql
-- Veículos
idx_veiculos_prefixo          -- Busca por prefixo
idx_veiculos_placa            -- Busca por placa
idx_veiculos_marca_modelo     -- Busca por marca/modelo

-- Ordens
idx_ordens_veiculo            -- Ordens de um veículo
idx_ordens_status             -- Filtro por status
idx_ordens_numero             -- Busca por número
idx_ordens_abertas            -- Ordens abertas (WHERE data_fechamento IS NULL)
idx_ordens_data_abertura      -- Ordenação por data
idx_ordens_periodo            -- Relatórios por período

-- Histórico
idx_historico_ordem           -- Histórico de uma ordem
idx_historico_data            -- Ordenação por data
idx_historico_periodo         -- Relatórios por período
```

## 📝 Exemplos de Uso

### Criar Veículo

```sql
INSERT INTO veiculos (prefixo, placa, marca, modelo, ano, cor)
VALUES ('v001', 'abc-1234', 'volkswagen', 'gol', 2020, 'branco');

-- Armazenado como:
-- prefixo: 'V001'
-- placa: 'ABC-1234'
-- marca: 'VOLKSWAGEN'
-- modelo: 'GOL'
-- cor: 'BRANCO'
```

### Criar Ordem de Manutenção

```sql
INSERT INTO ordens_manutencao (numero_ordem, veiculo_id, descricao)
SELECT 'om-001', id, 'troca de óleo e filtros'
FROM veiculos WHERE prefixo = 'V001';

-- Automático:
-- - numero_ordem convertido para 'OM-001'
-- - descricao convertida para 'TROCA DE ÓLEO E FILTROS'
-- - data_abertura = NOW()
-- - status = 'EM MANUTENÇÃO' (default)
-- - Registro criado em historico_status
```

### Mudar Status

```sql
UPDATE ordens_manutencao 
SET status = 'AGUARDANDO PEÇA' 
WHERE numero_ordem = 'OM-001';

-- Automático:
-- - Registro criado em historico_status
-- - updated_at = NOW()
```

### Finalizar Ordem

```sql
UPDATE ordens_manutencao 
SET status = 'PRONTO' 
WHERE numero_ordem = 'OM-001';

-- Automático:
-- - data_fechamento = NOW()
-- - tempo_parado_minutos = calculado
-- - Registro criado em historico_status
```

### Consultar Ordens Abertas

```sql
-- Todas as ordens abertas
SELECT * FROM v_ordens_abertas;

-- Ordens abertas de um veículo específico
SELECT * FROM v_ordens_abertas 
WHERE prefixo = 'V001';

-- Ordens abertas há mais de 24 horas
SELECT * FROM v_ordens_abertas 
WHERE tempo_parado_horas_atual > 24;
```

### Relatório de Tempo Parado

```sql
-- Veículos com mais tempo parado
SELECT prefixo, placa, total_tempo_parado_horas
FROM v_resumo_veiculos
ORDER BY total_tempo_parado_horas DESC
LIMIT 10;
```

### Histórico de uma Ordem

```sql
SELECT 
  status_anterior,
  status_novo,
  data_mudanca,
  minutos_neste_status
FROM v_historico_completo
WHERE numero_ordem = 'OM-001'
ORDER BY data_mudanca;
```

## 🔒 Segurança (RLS)

Row Level Security habilitado em todas as tabelas:

```sql
-- Apenas usuários autenticados podem acessar
-- Políticas configuradas para SELECT, INSERT, UPDATE, DELETE
```

## ⚠️ Validações Importantes

### 1. Prefixo Único
```sql
-- ERRO: duplicate key value violates unique constraint
INSERT INTO veiculos (prefixo, placa, marca, modelo, ano)
VALUES ('V001', 'XYZ-9999', 'FIAT', 'UNO', 2020);
```

### 2. Placa Única
```sql
-- ERRO: duplicate key value violates unique constraint
INSERT INTO veiculos (prefixo, placa, marca, modelo, ano)
VALUES ('V999', 'ABC-1234', 'FIAT', 'UNO', 2020);
```

### 3. Formato de Placa
```sql
-- ERRO: new row violates check constraint "placa_format"
INSERT INTO veiculos (prefixo, placa, marca, modelo, ano)
VALUES ('V002', '123-ABCD', 'FIAT', 'UNO', 2020);

-- Formatos válidos:
-- ABC-1234 (antigo)
-- ABC1D23 (Mercosul)
```

### 4. Ordem Única Aberta
```sql
-- Ordem 1 para V001
INSERT INTO ordens_manutencao (numero_ordem, veiculo_id, descricao)
VALUES ('OM-001', 'v001_id', 'TROCA DE ÓLEO');

-- ERRO: Veículo já possui uma ordem de manutenção aberta
INSERT INTO ordens_manutencao (numero_ordem, veiculo_id, descricao)
VALUES ('OM-002', 'v001_id', 'REVISÃO');

-- Solução: Finalizar OM-001 primeiro
UPDATE ordens_manutencao SET status = 'PRONTO' WHERE numero_ordem = 'OM-001';

-- Agora pode criar OM-002
INSERT INTO ordens_manutencao (numero_ordem, veiculo_id, descricao)
VALUES ('OM-002', 'v001_id', 'REVISÃO');
```

## 🎓 Boas Práticas

### 1. Sempre use os status do ENUM
```sql
-- CORRETO
UPDATE ordens_manutencao SET status = 'PRONTO';

-- ERRO: invalid input value for enum
UPDATE ordens_manutencao SET status = 'FINALIZADO';
```

### 2. Não manipule data_fechamento manualmente
```sql
-- ERRADO - deixe o trigger fazer isso
UPDATE ordens_manutencao 
SET data_fechamento = NOW() 
WHERE numero_ordem = 'OM-001';

-- CORRETO - mude o status
UPDATE ordens_manutencao 
SET status = 'PRONTO' 
WHERE numero_ordem = 'OM-001';
```

### 3. Use as views para consultas
```sql
-- ERRADO - query complexa
SELECT v.prefixo, o.status, 
  EXTRACT(EPOCH FROM (NOW() - o.data_abertura)) / 60 AS tempo
FROM ordens_manutencao o
JOIN veiculos v ON o.veiculo_id = v.id
WHERE o.data_fechamento IS NULL;

-- CORRETO - use a view
SELECT prefixo, status, tempo_parado_minutos_atual
FROM v_ordens_abertas;
```

## 📊 Monitoramento

### Ordens abertas há muito tempo
```sql
SELECT prefixo, placa, numero_ordem, 
       tempo_parado_horas_atual,
       status
FROM v_ordens_abertas
WHERE tempo_parado_horas_atual > 48
ORDER BY tempo_parado_horas_atual DESC;
```

### Veículos problemáticos
```sql
SELECT prefixo, placa, 
       total_ordens,
       total_tempo_parado_horas,
       media_tempo_parado_minutos
FROM v_resumo_veiculos
WHERE total_ordens > 5
ORDER BY total_tempo_parado_horas DESC;
```

### Mudanças de status recentes
```sql
SELECT numero_ordem, prefixo, 
       status_anterior, status_novo,
       data_mudanca
FROM v_historico_completo
WHERE data_mudanca >= NOW() - INTERVAL '24 hours'
ORDER BY data_mudanca DESC;
```
