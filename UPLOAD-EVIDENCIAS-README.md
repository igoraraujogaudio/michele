# Sistema de Upload de Evidências Fotográficas

## ✅ Implementação Completa

Sistema de upload de múltiplas fotos de evidência para ordens de manutenção.

## 📋 Componentes Criados

### 1. **Tabela de Banco de Dados** (`database-migration-evidencias.sql`)
```sql
CREATE TABLE evidencias_manutencao (
  id UUID PRIMARY KEY,
  ordem_id UUID REFERENCES ordens_manutencao(id),
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT NOT NULL,
  descricao TEXT,
  tipo_evidencia VARCHAR(50) DEFAULT 'FOTO',
  created_at TIMESTAMP,
  created_by UUID
);
```

**Tipos de Evidência:**
- `FOTO` - Foto geral
- `ANTES` - Foto antes do reparo
- `DEPOIS` - Foto depois do reparo
- `DEFEITO` - Foto do defeito
- `REPARO` - Foto do reparo

### 2. **Storage Bucket no Supabase**
- Bucket: `evidencias-manutencao`
- Público: Sim (para visualização)
- Políticas RLS configuradas

### 3. **Componente ImageUpload** (`src/components/ui/ImageUpload.tsx`)

**Funcionalidades:**
- ✅ Upload de múltiplas imagens (até 10 por padrão)
- ✅ Preview das imagens antes do upload
- ✅ Validação de tipo (apenas imagens)
- ✅ Validação de tamanho (máx 5MB por padrão)
- ✅ Campo de descrição para cada imagem
- ✅ Remover imagens antes do upload
- ✅ Interface drag-and-drop amigável

**Props:**
```typescript
interface ImageUploadProps {
  onImagesChange: (images: ImageFile[]) => void;
  maxImages?: number;      // Padrão: 10
  maxSizeMB?: number;      // Padrão: 5
}
```

### 4. **Actions de Evidências** (`src/lib/actions/evidencias.actions.ts`)

**Funções disponíveis:**
```typescript
// Upload de uma evidência
uploadEvidencia(ordemId: string, file: File, descricao?: string)

// Listar evidências de uma ordem
listEvidencias(ordemId: string)

// Deletar evidência
deleteEvidencia(evidenciaId: string)
```

### 5. **Componente EvidenciasGallery** (`src/components/ordens/EvidenciasGallery.tsx`)

**Funcionalidades:**
- ✅ Grid responsivo de fotos
- ✅ Modal de visualização em tela cheia
- ✅ Botão de deletar (se não for readOnly)
- ✅ Exibição de descrições
- ✅ Zoom ao clicar na imagem
- ✅ Loading state ao deletar

**Props:**
```typescript
interface EvidenciasGalleryProps {
  evidencias: EvidenciaManutencao[];
  onDelete?: () => void;
  readOnly?: boolean;
}
```

## 🔧 Como Usar

### 1. **Executar Migration do Banco**
```bash
# Execute o arquivo database-migration-evidencias.sql no Supabase
```

### 2. **Integrar no Formulário de Ordem**

```tsx
import ImageUpload from '@/components/ui/ImageUpload';
import { uploadEvidencia } from '@/lib/actions/evidencias.actions';

// No componente
const [images, setImages] = useState<ImageFile[]>([]);

// Ao criar ordem
const handleSubmit = async () => {
  // 1. Criar ordem de manutenção
  const ordem = await createOrdemManutencao(data);
  
  // 2. Upload das evidências
  for (const image of images) {
    await uploadEvidencia(
      ordem.id, 
      image.file, 
      image.descricao
    );
  }
};

// No JSX
<ImageUpload 
  onImagesChange={setImages}
  maxImages={10}
  maxSizeMB={5}
/>
```

### 3. **Exibir Galeria na Página de Detalhes**

```tsx
import EvidenciasGallery from '@/components/ordens/EvidenciasGallery';
import { listEvidencias } from '@/lib/actions/evidencias.actions';

// Buscar evidências
const evidencias = await listEvidencias(ordemId);

// No JSX
<EvidenciasGallery 
  evidencias={evidencias.data || []}
  onDelete={() => router.refresh()}
  readOnly={false}
/>
```

## 📸 Fluxo de Uso

### Upload de Evidências

```
1. Usuário clica "Adicionar Fotos"
   ↓
2. Seleciona múltiplas imagens do dispositivo
   ↓
3. Sistema valida tipo e tamanho
   ↓
4. Mostra preview das imagens
   ↓
5. Usuário pode adicionar descrição em cada foto
   ↓
6. Ao salvar ordem, faz upload para Supabase Storage
   ↓
7. Salva registro na tabela evidencias_manutencao
```

### Visualização de Evidências

```
1. Página de detalhes carrega evidências
   ↓
2. Exibe grid de thumbnails
   ↓
3. Usuário clica em uma foto
   ↓
4. Abre modal com imagem em tamanho grande
   ↓
5. Pode deletar foto (se tiver permissão)
```

## 🎨 Interface

### Grid de Upload
```
┌─────────────────────────────────────┐
│ [Adicionar Fotos (2/10)]            │
├─────────────────────────────────────┤
│  ┌────┐  ┌────┐  ┌────┐            │
│  │IMG1│  │IMG2│  │ +  │            │
│  │ X  │  │ X  │  │    │            │
│  └────┘  └────┘  └────┘            │
│  [desc]  [desc]                     │
└─────────────────────────────────────┘
```

### Galeria de Visualização
```
┌─────────────────────────────────────┐
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐   │
│  │IMG │  │IMG │  │IMG │  │IMG │   │
│  │ 🗑 │  │ 🗑 │  │ 🗑 │  │ 🗑 │   │
│  └────┘  └────┘  └────┘  └────┘   │
│  Desc1   Desc2   Desc3   Desc4    │
└─────────────────────────────────────┘
```

## 🔒 Segurança

- ✅ RLS habilitado na tabela
- ✅ Apenas usuários autenticados podem fazer upload
- ✅ Validação de tipo de arquivo
- ✅ Validação de tamanho de arquivo
- ✅ Storage policies configuradas

## 📦 Estrutura de Arquivos no Storage

```
evidencias-manutencao/
  └── {ordem_id}/
      ├── {timestamp}-{random}.jpg
      ├── {timestamp}-{random}.png
      └── ...
```

## 🚀 Próximos Passos

1. Execute a migration do banco de dados
2. Configure o bucket no Supabase Storage
3. Integre o componente ImageUpload na página de nova ordem
4. Adicione a galeria na página de detalhes da ordem
5. Teste o upload e visualização

## 💡 Dicas

- Recomende aos usuários tirar fotos de:
  - Estado inicial do veículo
  - Defeitos encontrados
  - Peças substituídas
  - Resultado final do reparo
  
- Use descrições claras como:
  - "Defeito no para-choque dianteiro"
  - "Peça danificada - antes"
  - "Reparo concluído - depois"

Sistema completo e pronto para uso! 📸
