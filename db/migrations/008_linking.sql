-- 008_linking.sql — Entities, document_entities, document_links + RPC functions

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS entities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('phone', 'email', 'organization', 'crypto_wallet', 'url')),
    value       TEXT NOT NULL,
    display_name TEXT,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_type_value
    ON entities (entity_type, lower(value));

CREATE TABLE IF NOT EXISTS document_entities (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    entity_id   UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    context     TEXT,
    extraction_method TEXT DEFAULT 'regex' CHECK (extraction_method IN ('regex', 'path', 'llm')),
    created_at  TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (document_id, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_document_entities_entity ON document_entities(entity_id);

CREATE TABLE IF NOT EXISTS document_links (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    target_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    link_type   TEXT NOT NULL CHECK (link_type IN (
        'shared_person', 'shared_entity', 'same_thread', 'file_proximity', 'semantic_similarity'
    )),
    strength    REAL NOT NULL DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT now(),
    CHECK (source_id < target_id),
    UNIQUE (source_id, target_id, link_type)
);

CREATE INDEX IF NOT EXISTS idx_document_links_source ON document_links(source_id);
CREATE INDEX IF NOT EXISTS idx_document_links_target ON document_links(target_id);
CREATE INDEX IF NOT EXISTS idx_document_links_type   ON document_links(link_type);

-- ---------------------------------------------------------------------------
-- RPC: get_related_documents
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_related_documents(doc_uuid UUID, max_results INT DEFAULT 10)
RETURNS TABLE (
    id          UUID,
    title       TEXT,
    doc_type    TEXT,
    date        DATE,
    file_path   TEXT,
    file_size   BIGINT,
    link_type   TEXT,
    strength    REAL,
    link_metadata JSONB
) LANGUAGE sql STABLE AS $$
    SELECT
        d.id,
        d.title,
        d.doc_type,
        d.date,
        d.file_path,
        d.file_size,
        dl.link_type,
        dl.strength,
        dl.metadata AS link_metadata
    FROM document_links dl
    JOIN documents d ON d.id = CASE
        WHEN dl.source_id = doc_uuid THEN dl.target_id
        ELSE dl.source_id
    END
    WHERE dl.source_id = doc_uuid OR dl.target_id = doc_uuid
    ORDER BY dl.strength DESC, dl.created_at DESC
    LIMIT max_results;
$$;

-- ---------------------------------------------------------------------------
-- RPC: get_entity_documents
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION get_entity_documents(ent_uuid UUID)
RETURNS TABLE (
    id        UUID,
    title     TEXT,
    doc_type  TEXT,
    date      DATE,
    file_path TEXT,
    context   TEXT
) LANGUAGE sql STABLE AS $$
    SELECT
        d.id,
        d.title,
        d.doc_type,
        d.date,
        d.file_path,
        de.context
    FROM document_entities de
    JOIN documents d ON d.id = de.document_id
    WHERE de.entity_id = ent_uuid
    ORDER BY d.date DESC NULLS LAST;
$$;

-- ---------------------------------------------------------------------------
-- RLS — public read
-- ---------------------------------------------------------------------------

ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "entities_read" ON entities;
CREATE POLICY "entities_read" ON entities FOR SELECT USING (true);

DROP POLICY IF EXISTS "document_entities_read" ON document_entities;
CREATE POLICY "document_entities_read" ON document_entities FOR SELECT USING (true);

DROP POLICY IF EXISTS "document_links_read" ON document_links;
CREATE POLICY "document_links_read" ON document_links FOR SELECT USING (true);
