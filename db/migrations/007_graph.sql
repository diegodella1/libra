-- Funciones para el grafo de red de conexiones
-- Aplicar: sudo docker exec -i supabase-db psql -U supabase_admin -d postgres < db/migrations/007_graph.sql

-- Nodos: personas con cantidad de documentos vinculados
CREATE OR REPLACE FUNCTION graph_nodes()
RETURNS TABLE (id UUID, name TEXT, role TEXT, doc_count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT p.id, p.name, p.role, COUNT(dp.document_id) AS doc_count
  FROM persons p
  LEFT JOIN document_persons dp ON p.id = dp.person_id
  GROUP BY p.id, p.name, p.role
  HAVING COUNT(dp.document_id) > 0
  ORDER BY doc_count DESC;
$$;

-- Edges: documentos compartidos entre personas
CREATE OR REPLACE FUNCTION graph_edges()
RETURNS TABLE (source UUID, target UUID, weight BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT dp1.person_id AS source, dp2.person_id AS target, COUNT(*) AS weight
  FROM document_persons dp1
  JOIN document_persons dp2
    ON dp1.document_id = dp2.document_id
    AND dp1.person_id < dp2.person_id
  GROUP BY dp1.person_id, dp2.person_id
  ORDER BY weight DESC;
$$;
