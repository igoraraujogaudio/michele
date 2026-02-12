-- Migration: Add gerencias table and update veiculos table
-- Date: 2024
-- Description: Add gerencia management (standalone) and update vehicle schema

-- Create gerencias table (standalone - not linked to veiculos)
CREATE TABLE IF NOT EXISTS gerencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao VARCHAR(500),
  ativo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add status column to veiculos table
ALTER TABLE veiculos 
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'OPERAÇÃO' NOT NULL;

-- Make prefixo_id optional (remove NOT NULL constraint)
ALTER TABLE veiculos 
  ALTER COLUMN prefixo_id DROP NOT NULL;

-- Make local_trabalho_id optional (remove NOT NULL constraint)
ALTER TABLE veiculos 
  ALTER COLUMN local_trabalho_id DROP NOT NULL;

-- Add check constraint for status
ALTER TABLE veiculos 
  ADD CONSTRAINT veiculos_status_check 
  CHECK (status IN ('OPERAÇÃO', 'MANUTENÇÃO'));

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_veiculos_status ON veiculos(status);

-- Update existing vehicles to have default status
UPDATE veiculos 
SET status = 'OPERAÇÃO' 
WHERE status IS NULL;

-- Create trigger to update updated_at timestamp for gerencias
CREATE OR REPLACE FUNCTION update_gerencias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gerencias_updated_at_trigger
  BEFORE UPDATE ON gerencias
  FOR EACH ROW
  EXECUTE FUNCTION update_gerencias_updated_at();

-- Enable Row Level Security (RLS) for gerencias table
ALTER TABLE gerencias ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for gerencias (adjust based on your auth setup)
CREATE POLICY "Enable read access for authenticated users" ON gerencias
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON gerencias
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON gerencias
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" ON gerencias
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert some sample gerencias (optional - remove if not needed)
-- INSERT INTO gerencias (nome, descricao) VALUES
--   ('GERÊNCIA DE OPERAÇÕES', 'Responsável pelas operações diárias'),
--   ('GERÊNCIA DE MANUTENÇÃO', 'Responsável pela manutenção da frota'),
--   ('GERÊNCIA ADMINISTRATIVA', 'Responsável pela administração');
