-- 009_entity_explorer.sql — RPC for browsing entities with pagination

CREATE OR REPLACE FUNCTION browse_entities(
    p_type TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_page INT DEFAULT 1,
    p_limit INT DEFAULT 30
)
RETURNS TABLE (
    id UUID,
    entity_type TEXT,
    value TEXT,
    display_name TEXT,
    doc_count BIGINT,
    total_count BIGINT
) LANGUAGE sql STABLE AS $$
    WITH filtered AS (
        SELECT
            e.id,
            e.entity_type,
            e.value,
            e.display_name,
            COUNT(de.document_id) AS doc_count
        FROM entities e
        LEFT JOIN document_entities de ON de.entity_id = e.id
        WHERE (p_type IS NULL OR e.entity_type = p_type)
          AND (p_search IS NULL OR e.value ILIKE '%' || p_search || '%' OR e.display_name ILIKE '%' || p_search || '%')
        GROUP BY e.id, e.entity_type, e.value, e.display_name
        HAVING COUNT(de.document_id) > 0
    ),
    counted AS (
        SELECT COUNT(*) AS total FROM filtered
    )
    SELECT
        f.id,
        f.entity_type,
        f.value,
        f.display_name,
        f.doc_count,
        c.total AS total_count
    FROM filtered f, counted c
    ORDER BY f.doc_count DESC, f.value
    OFFSET (p_page - 1) * p_limit
    LIMIT p_limit;
$$;
