-- Migration: Add evidencias_manutencao table and storage
-- Date: 2024
-- Description: Add support for multiple photo evidence uploads in maintenance orders

-- Create evidencias_manutencao table
CREATE TABLE IF NOT EXISTS evidencias_manutencao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_id UUID NOT NULL REFERENCES ordens_manutencao(id) ON DELETE CASCADE,
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT NOT NULL,
  descricao TEXT,
  tipo_evidencia VARCHAR(50) DEFAULT 'FOTO',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT evidencias_tipo_check CHECK (tipo_evidencia IN ('FOTO', 'ANTES', 'DEPOIS', 'DEFEITO', 'REPARO'))
);

-- Create index for ordem_id
CREATE INDEX IF NOT EXISTS idx_evidencias_ordem_id ON evidencias_manutencao(ordem_id);

-- Create index for created_at
CREATE INDEX IF NOT EXISTS idx_evidencias_created_at ON evidencias_manutencao(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE evidencias_manutencao ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for authenticated users" ON evidencias_manutencao
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON evidencias_manutencao
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON evidencias_manutencao
  FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket for maintenance evidence photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias-manutencao', 'evidencias-manutencao', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for authenticated users to upload
CREATE POLICY "Authenticated users can upload evidence photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'evidencias-manutencao');

-- Create storage policy for public read access
CREATE POLICY "Public read access to evidence photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'evidencias-manutencao');

-- Create storage policy for authenticated users to delete
CREATE POLICY "Authenticated users can delete evidence photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'evidencias-manutencao');
