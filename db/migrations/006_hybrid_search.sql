-- Libra: Hybrid search (FTS + semantic) para RAG
-- Aplicar: sudo docker exec -i supabase-db psql -U supabase_admin -d postgres < db/migrations/006_hybrid_search.sql

CREATE OR REPLACE FUNCTION hybrid_search(
  query_text TEXT,
  query_embedding vector(1536) DEFAULT NULL,
  max_results INT DEFAULT 10,
  fts_weight FLOAT DEFAULT 0.3,
  semantic_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  title TEXT,
  doc_type TEXT,
  date DATE,
  participants TEXT[],
  file_path TEXT,
  snippet TEXT,
  chunk_content TEXT,
  score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH fts_results AS (
    SELECT
      d.id AS doc_id,
      NULL::UUID AS chunk_id,
      d.title,
      d.doc_type,
      d.date,
      d.participants,
      d.file_path,
      ts_headline('spanish', d.content, plainto_tsquery('spanish', query_text),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=60, MinWords=25') AS snippet,
      LEFT(d.content, 2000) AS chunk_content,
      ts_rank(to_tsvector('spanish', coalesce(d.content, '')),
              plainto_tsquery('spanish', query_text)) AS fts_rank
    FROM documents d
    WHERE to_tsvector('spanish', coalesce(d.content, '')) @@ plainto_tsquery('spanish', query_text)
    ORDER BY fts_rank DESC
    LIMIT 20
  ),
  semantic_results AS (
    SELECT
      d.id AS doc_id,
      dc.id AS chunk_id,
      d.title,
      d.doc_type,
      d.date,
      d.participants,
      d.file_path,
      LEFT(dc.content, 300) AS snippet,
      dc.content AS chunk_content,
      1 - (dc.embedding <=> query_embedding) AS similarity
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE query_embedding IS NOT NULL
      AND dc.embedding IS NOT NULL
      AND 1 - (dc.embedding <=> query_embedding) > 0.6
    ORDER BY dc.embedding <=> query_embedding
    LIMIT 20
  ),
  combined AS (
    SELECT
      f.doc_id, f.chunk_id, f.title, f.doc_type, f.date, f.participants,
      f.file_path, f.snippet, f.chunk_content,
      f.fts_rank AS fts_score,
      NULL::FLOAT AS sem_score
    FROM fts_results f

    UNION ALL

    SELECT
      s.doc_id, s.chunk_id, s.title, s.doc_type, s.date, s.participants,
      s.file_path, s.snippet, s.chunk_content,
      NULL::FLOAT AS fts_score,
      s.similarity AS sem_score
    FROM semantic_results s
  ),
  scored AS (
    SELECT
      c.doc_id,
      c.chunk_id,
      c.title,
      c.doc_type,
      c.date,
      c.participants,
      c.file_path,
      c.snippet,
      c.chunk_content,
      COALESCE(c.fts_score, 0) * fts_weight + COALESCE(c.sem_score, 0) * semantic_weight AS final_score
    FROM combined c
  ),
  deduplicated AS (
    SELECT DISTINCT ON (s.doc_id)
      s.doc_id,
      s.chunk_id,
      s.title,
      s.doc_type,
      s.date,
      s.participants,
      s.file_path,
      s.snippet,
      s.chunk_content,
      MAX(s.final_score) OVER (PARTITION BY s.doc_id) AS final_score
    FROM scored s
    ORDER BY s.doc_id, s.final_score DESC
  )
  SELECT
    dd.doc_id AS id,
    dd.chunk_id AS document_id,
    dd.title,
    dd.doc_type,
    dd.date,
    dd.participants,
    dd.file_path,
    dd.snippet,
    dd.chunk_content,
    dd.final_score AS score
  FROM deduplicated dd
  ORDER BY dd.final_score DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
