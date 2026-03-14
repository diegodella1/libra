# Libra — TODO

## Fase 0 — Pre-requisitos
- [ ] Recibir samples de cada tipo (PDF, JPG) — BLOQUEADO: Diego bajando docs
- [ ] Analizar si tienen texto extraíble o son scans puros
- [x] Verificar espacio en disco (72GB libres, entra justo)
- [ ] Definir subdominio exacto

## Fase 1 — Scaffolding (en progreso)
- [x] Estructura de proyecto Next.js
- [x] Docker compose (web + nginx para docs)
- [x] Schema de DB (migration SQL)
- [x] System prompt del chatbot
- [x] Páginas: landing, explorador, visor de documento
- [x] API routes: search, chat
- [x] Componentes: Header, SearchBar, DocumentCard, DocumentViewer, ChatWidget
- [x] Script de ingesta (placeholder)
- [ ] Inicializar git repo
- [ ] Aplicar migration a Supabase
- [ ] Build test en Docker

## Fase 1.5 — Pipeline de ingesta
- [ ] Detectar tipo de documento (texto/scan) con samples reales
- [ ] Implementar OCR batch (Tesseract)
- [ ] Extracción de metadata
- [ ] Carga a Supabase
- [ ] Generación de embeddings

## Fase 2 — Sitio funcional
- [ ] Landing con contenido editorial real
- [ ] Explorador con filtros funcionales
- [ ] Visor de documento completo
- [ ] Chatbot integrado en layout

## Fase 3 — Publicación
- [ ] DNS y Cloudflare tunnel
- [ ] Optimización performance Pi
- [ ] Plan de migración a VPS
