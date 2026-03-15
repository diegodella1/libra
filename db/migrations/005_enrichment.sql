-- Libra: Log de enriquecimiento de metadata por fases
-- Aplicar: sudo docker exec -i supabase-db psql -U supabase_admin -d postgres < db/migrations/005_enrichment.sql

CREATE TABLE IF NOT EXISTS enrichment_log (
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  phase INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  error_message TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (document_id, phase)
);
CREATE INDEX IF NOT EXISTS idx_enrichment_phase_status ON enrichment_log(phase, status);
ALTER TABLE enrichment_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY enrichment_read ON enrichment_log FOR SELECT USING (true);
