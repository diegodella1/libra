-- Libra: Tabla de personas y relación con documentos
-- Aplicar: sudo docker exec -i supabase-db psql -U supabase_admin -d postgres < db/migrations/003_persons.sql

-- Unique constraint on file_path (needed for upsert in ingest.py)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_file_path_key'
  ) THEN
    ALTER TABLE documents ADD CONSTRAINT documents_file_path_key UNIQUE (file_path);
  END IF;
END $$;

-- Personas vinculadas al caso
CREATE TABLE IF NOT EXISTS persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_persons_name ON persons(lower(name));

-- Relación N:M documentos ↔ personas
CREATE TABLE IF NOT EXISTS document_persons (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, person_id)
);
CREATE INDEX IF NOT EXISTS idx_doc_persons_person ON document_persons(person_id);

-- RLS
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY persons_read ON persons FOR SELECT USING (true);
ALTER TABLE document_persons ENABLE ROW LEVEL SECURITY;
CREATE POLICY doc_persons_read ON document_persons FOR SELECT USING (true);

-- Seed: personas conocidas del caso
INSERT INTO persons (name, aliases, role) VALUES
  ('Javier Milei', ARRAY['Milei', 'Javier Milei'], 'investigado'),
  ('Karina Milei', ARRAY['KARINA MILEI RRPP', 'Karina Milei'], 'investigado'),
  ('Manuel Terrones Godoy', ARRAY['Manu Terrones Godoy', 'Manu Terrones', 'Manuel Terrones'], 'investigado'),
  ('Sergio Daniel Morales', ARRAY['Sergio Crypto City', 'Sergio Morales'], 'investigado'),
  ('Hayden Mark Davis', ARRAY['Hayden Davis', 'Hayden'], 'investigado'),
  ('Mauricio Novelli', ARRAY['Novelli'], 'investigado'),
  ('Julian Peh', ARRAY['Julian Peh kIP', 'Julian Peh KIP'], 'mencionado'),
  ('Charles Hoskinson', ARRAY['Hoskinson'], 'mencionado')
ON CONFLICT ((lower(name))) DO NOTHING;
