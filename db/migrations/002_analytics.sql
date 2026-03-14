-- Analytics tables for Archivo Libra admin panel

CREATE TABLE IF NOT EXISTS query_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'search' | 'chat'
  query TEXT NOT NULL,
  results_count INT DEFAULT 0,
  ip_hash TEXT,
  response_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_query_log_type ON query_log(type);
CREATE INDEX IF NOT EXISTS idx_query_log_created ON query_log(created_at);

CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Allow public SELECT on query_log and site_config (service role does writes)
ALTER TABLE query_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read query_log" ON query_log FOR SELECT USING (true);

ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read site_config" ON site_config FOR SELECT USING (true);
