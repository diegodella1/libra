-- Libra: Archivo periodístico — schema inicial
-- Aplicar: sudo docker exec -i supabase-db psql -U supabase_admin -d postgres < db/migrations/001_initial.sql

-- Extensiones
CREATE EXTENSION IF NOT EXISTS vector;

-- Documentos
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  doc_type TEXT NOT NULL DEFAULT 'transcripcion', -- 'transcripcion', 'imagen', 'otro'
  date DATE,
  participants TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  content TEXT, -- texto completo (OCR o extraído)
  file_path TEXT NOT NULL, -- ruta al archivo original (relativa a /documents/)
  file_size BIGINT,
  page_count INT,
  ocr_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'done', 'error', 'skipped'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Full-text search en español
CREATE INDEX IF NOT EXISTS idx_documents_fts
  ON documents USING gin(to_tsvector('spanish', coalesce(content, '')));

CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(date);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);

-- Chunks para RAG (embeddings)
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Tracking de ingesta (para proceso resumible)
CREATE TABLE IF NOT EXISTS ingestion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'ocr', 'indexed', 'embedded', 'error'
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_status ON ingestion_log(status);

-- RLS (Row Level Security) — lectura pública, escritura solo service role
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_read ON documents FOR SELECT USING (true);
CREATE POLICY chunks_read ON document_chunks FOR SELECT USING (true);

-- Función de búsqueda full-text
CREATE OR REPLACE FUNCTION search_documents(query TEXT, max_results INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  title TEXT,
  doc_type TEXT,
  date DATE,
  participants TEXT[],
  file_path TEXT,
  snippet TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.title,
    d.doc_type,
    d.date,
    d.participants,
    d.file_path,
    ts_headline('spanish', d.content, plainto_tsquery('spanish', query),
      'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20') AS snippet,
    ts_rank(to_tsvector('spanish', coalesce(d.content, '')), plainto_tsquery('spanish', query)) AS rank
  FROM documents d
  WHERE to_tsvector('spanish', coalesce(d.content, '')) @@ plainto_tsquery('spanish', query)
  ORDER BY rank DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Función de búsqueda semántica (para RAG)
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  chunk_index INT,
  content TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
