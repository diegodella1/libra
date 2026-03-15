# Libra — TODO

## Completado

### Ingesta
- [x] Script de ingesta principal (`ingest.py`) — 6500+ docs ingestados
- [x] Script de ingesta de imágenes con OCR (`ingest_images.py`)
- [x] Script de ingesta de audio con Groq Whisper (`ingest_audio.py`)
- [x] OCR para PDFs pendientes (`ocr_pending.py`)
- [x] Enriquecimiento de metadata 3 fases (`enrich_metadata.py`)

### Frontend + API (sesión 2026-03-14)
- [x] Fix search API: filtros server-side (type, date_from, date_to, person)
- [x] Nuevo endpoint browse `/api/documents` — navegar sin búsqueda
- [x] Nuevo endpoint stats `/api/stats` — conteos por tipo, rango fechas, personas
- [x] Refactor explorador: browse mode + chips con conteo + filtros fecha/persona + "Cargar más"
- [x] DocumentRow: tags como chips
- [x] DOC_TYPES ampliado (conversacion, documento, pdf, llamadas, planilla, etc.)

### Scripts refactor (sesión 2026-03-14)
- [x] Módulo compartido `scripts/lib/common.py` — eliminado código duplicado
- [x] Todos los scripts importan de `lib.common`
- [x] `scripts/requirements.txt` creado

### RAG (sesión 2026-03-14 + 2026-03-15)
- [x] Migration `006_hybrid_search.sql` — función `hybrid_search()` aplicada
- [x] `scripts/chunk_documents.py` creado
- [x] `scripts/embed_chunks.py` creado
- [x] 57.551 chunks con embeddings generados
- [x] Chat API con hybrid search (FTS + semántico) + búsqueda por persona
- [x] System prompt mejorado (timeline 14/02, links clickeables, cruce de docs)

### Forensic Parser (sesión 2026-03-15)
- [x] Parser para llamadas Cellebrite (normalización de texto garbled de PDF)
- [x] Parser para conversaciones (formato PDF + formato TXT)
- [x] Renderer ForensicContent con vistas especializadas (llamadas/chat/fallback)
- [x] DocumentViewer: panel único para llamadas/conversaciones (sin iframe 404)

### Red de conexiones (sesión 2026-03-15)
- [x] Funciones SQL `graph_nodes()` y `graph_edges()`
- [x] API `/api/graph` con cache 1h
- [x] Componente NetworkGraph con d3-force (draggable, click → explorador)
- [x] 46 personas, 30+ conexiones mapeadas
- [x] Escala logarítmica para nodos/edges
- [x] Tooltips nativos en nodos

### Mejoras de datos (sesión 2026-03-15)
- [x] 38 personas nuevas agregadas (gobierno, NW traders, crypto, medios, etc.)
- [x] Novelli y Terrones linkeados a docs de sus teléfonos
- [x] 9292 documentos con participants actualizados desde document_persons
- [x] Snippets en lista del explorador (preview del contenido sin entrar)
- [x] Función `person_documents()` para búsqueda por persona/alias en chat

### Búsqueda mejorada (sesión 2026-03-15)
- [x] Índices GIN en content y title (búsquedas de ms)
- [x] `websearch_to_tsquery` (soporta OR, frases)
- [x] Búsqueda por título + FTS en contenido
- [x] Fallback ILIKE en títulos
- [x] Timeout del role anon aumentado a 8s
- [x] `ts_headline` optimizado (solo top-N, solo primeros 2000 chars)

### Seguridad (sesión 2026-03-15)
- [x] Login gate con SITE_TOKEN (localStorage + API verify)
- [x] Auth middleware `validateRequest()` en todas las APIs públicas
- [x] `authFetch()` wrapper que inyecta token en headers
- [x] Fix XSS: `safeSnippet()` stripea HTML excepto `<mark>`
- [x] parseInt hardening con radix 10 + fallback NaN

### UX/UI (sesión 2026-03-15)
- [x] DocumentRow con iconos y colores para los 12 tipos de documento
- [x] SearchBar con icono de lupa, botón limpiar, placeholder descriptivo
- [x] Skeletons animados en explorador y docs relacionados
- [x] Estado de error con botón "Reintentar"
- [x] Mensajes contextuales ("X resultados para «query»" vs "X documentos")
- [x] Empty states diferenciados por contexto
- [x] Título del audio en panel Original
- [x] Detalle documento: type badge, fecha formateada, participantes con icono
- [x] Link "Red" en nav + CTA en home

---

## Backlog

- [ ] DNS y Cloudflare tunnel (subdominio público)
- [ ] Optimización performance Pi (logflare usa 317MB)
- [ ] Plan de migración a VPS
