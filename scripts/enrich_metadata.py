"""
Libra — Pipeline de enriquecimiento de metadata.

Enriquece documentos ya ingestados sin re-ingestar:
  Phase 1: Regex (gratis) — participantes WA, fechas, links personas por contenido
  Phase 2: LLM extraction (~$0.80) — entidades via GPT-4o-mini/OpenRouter
  Phase 3: Cross-referencing (gratis) — FTS links + reporte de red

Uso:
  source venv/bin/activate
  python scripts/enrich_metadata.py --db-password <pwd> --phase 1 [--dry-run]
  python scripts/enrich_metadata.py --db-password <pwd> --phase 2 --openrouter-key <key> [--limit 50] [--dry-run]
  python scripts/enrich_metadata.py --db-password <pwd> --phase 3 [--dry-run]
"""

import re
import sys
import json
import time
import argparse
from collections import Counter, defaultdict

import psycopg2
import psycopg2.extras

from lib.common import (
    KNOWN_PERSONS, MONTHS_ES,
    get_db_connection, get_person_id_cache, link_persons,
)


def log_enrichment(conn, doc_id: str, phase: int, status: str,
                   metadata: dict | None = None, error: str | None = None):
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO enrichment_log (document_id, phase, status, metadata, error_message, completed_at)
            VALUES (%s, %s, %s, %s, %s, CASE WHEN %s IN ('done', 'error') THEN now() ELSE NULL END)
            ON CONFLICT (document_id, phase) DO UPDATE SET
                status = EXCLUDED.status,
                metadata = EXCLUDED.metadata,
                error_message = EXCLUDED.error_message,
                completed_at = CASE WHEN EXCLUDED.status IN ('done', 'error') THEN now() ELSE enrichment_log.completed_at END
        """, (doc_id, phase, status,
              json.dumps(metadata) if metadata else None,
              error[:500] if error else None,
              status))


# ---------------------------------------------------------------------------
# Phase 1: Regex extraction (free)
# ---------------------------------------------------------------------------

RE_WA_PARTICIPANTS = re.compile(r'Participantes?:\s*(.+?)(?:\n|$)', re.IGNORECASE)
RE_WA_ENTRY = re.compile(r'(\d+@s\.whatsapp\.net)\s+([^,\d@]+?)(?:,|$)')

RE_DATE_DMY_SLASH = re.compile(r'(\d{1,2})/(\d{1,2})/(\d{4})')
RE_DATE_DMY_DASH = re.compile(r'(\d{1,2})-(\d{1,2})-(\d{4})')
RE_DATE_SPANISH = re.compile(
    r'(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})',
    re.IGNORECASE,
)


def extract_wa_participants(content: str) -> list[str]:
    """Extrae nombres de participantes de headers WhatsApp."""
    head = content[:500]
    match = RE_WA_PARTICIPANTS.search(head)
    if not match:
        return []
    line = match.group(1)
    entries = RE_WA_ENTRY.findall(line)
    return [name.strip() for _, name in entries if name.strip()]


def extract_date_from_content(content: str) -> str | None:
    """Busca fecha en las primeras 2000 chars del contenido."""
    head = content[:2000]

    # DD/MM/YYYY
    m = RE_DATE_DMY_SLASH.search(head)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if 1 <= d <= 31 and 1 <= mo <= 12 and 2000 <= y <= 2030:
            return f"{y:04d}-{mo:02d}-{d:02d}"

    # DD-MM-YYYY
    m = RE_DATE_DMY_DASH.search(head)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if 1 <= d <= 31 and 1 <= mo <= 12 and 2000 <= y <= 2030:
            return f"{y:04d}-{mo:02d}-{d:02d}"

    # "N de enero de YYYY"
    m = RE_DATE_SPANISH.search(head)
    if m:
        d = int(m.group(1))
        mo = MONTHS_ES.get(m.group(2).lower())
        y = int(m.group(3))
        if mo and 1 <= d <= 31 and 2000 <= y <= 2030:
            return f"{y:04d}-{mo:02d}-{d:02d}"

    return None


def match_persons_in_content(content: str) -> list[str]:
    """Busca aliases de personas conocidas en el contenido completo."""
    content_lower = content.lower()
    matched = []
    for canonical, aliases in KNOWN_PERSONS.items():
        for alias in aliases:
            if alias.lower() in content_lower:
                matched.append(canonical)
                break
    return matched


def run_phase1(conn, dry_run: bool):
    print("\n=== PHASE 1: Regex extraction ===\n")

    stats = {
        'wa_participants': 0,
        'dates_filled': 0,
        'persons_linked': 0,
        'docs_processed': 0,
    }

    person_cache = get_person_id_cache(conn)

    # Fetch all docs with content
    with conn.cursor(name='phase1_cursor') as cur:
        cur.itersize = 500
        cur.execute("""
            SELECT id, doc_type, date, participants, content
            FROM documents
            WHERE content IS NOT NULL AND length(content) > 0
        """)

        batch = []
        for row in cur:
            batch.append(row)
            if len(batch) >= 500:
                _process_phase1_batch(conn, batch, person_cache, stats, dry_run)
                batch = []
        if batch:
            _process_phase1_batch(conn, batch, person_cache, stats, dry_run)

    if not dry_run:
        conn.commit()

    print(f"\n--- Phase 1 Results ---")
    print(f"Docs procesados: {stats['docs_processed']}")
    print(f"Participantes WA extraidos: {stats['wa_participants']} docs")
    print(f"Fechas rellenadas: {stats['dates_filled']}")
    print(f"Person links creados: {stats['persons_linked']}")


def _process_phase1_batch(conn, batch, person_cache, stats, dry_run):
    for doc_id, doc_type, date, participants, content in batch:
        stats['docs_processed'] += 1
        doc_id_str = str(doc_id)
        changes = {}

        # 1a: Participantes WhatsApp
        if doc_type == 'conversacion' and (not participants or len(participants) == 0):
            names = extract_wa_participants(content)
            if names:
                changes['participants'] = names
                stats['wa_participants'] += 1

        # 1b: Fechas
        if date is None:
            extracted_date = extract_date_from_content(content)
            if extracted_date:
                changes['date'] = extracted_date
                stats['dates_filled'] += 1

        # 1c: Person links por contenido
        matched = match_persons_in_content(content)

        if dry_run:
            if changes or matched:
                preview = []
                if 'participants' in changes:
                    preview.append(f"participants={changes['participants']}")
                if 'date' in changes:
                    preview.append(f"date={changes['date']}")
                if matched:
                    preview.append(f"persons={matched}")
                print(f"  {doc_id_str[:8]}... -> {', '.join(preview)}")
            continue

        # Apply changes
        if changes:
            sets = []
            vals = []
            if 'participants' in changes:
                sets.append("participants = %s")
                vals.append(changes['participants'])
            if 'date' in changes:
                sets.append("date = %s")
                vals.append(changes['date'])
            if sets:
                vals.append(doc_id_str)
                with conn.cursor() as uc:
                    uc.execute(
                        f"UPDATE documents SET {', '.join(sets)} WHERE id = %s",
                        vals,
                    )

        # Link persons
        if matched:
            n = link_persons(conn, doc_id_str, matched, person_cache)
            stats['persons_linked'] += n

        # Log enrichment
        log_enrichment(conn, doc_id_str, 1, 'done', metadata={
            'participants_added': len(changes.get('participants', [])),
            'date_filled': 'date' in changes,
            'persons_matched': matched,
        })

        if stats['docs_processed'] % 500 == 0:
            conn.commit()
            print(f"  [{stats['docs_processed']}] WA: {stats['wa_participants']} | Dates: {stats['dates_filled']} | Links: {stats['persons_linked']}")


# ---------------------------------------------------------------------------
# Phase 2: LLM extraction
# ---------------------------------------------------------------------------

LLM_SYSTEM_PROMPT = """Sos un extractor de entidades de documentos judiciales argentinos del caso $LIBRA (token crypto).
Extrae SOLO entidades que aparecen explicitamente en el texto. No inventes ni inferis.
Responde SOLO con JSON valido, sin markdown ni explicaciones."""

LLM_USER_PROMPT = """Extrae entidades del siguiente fragmento de documento judicial:

---
{text}
---

Responde con este JSON exacto (arrays vacios si no encontras nada):
{{"persons": ["Nombre Apellido"], "organizations": ["Org"], "phones": ["+5411..."], "emails": ["email@..."], "dates": ["YYYY-MM-DD"]}}"""


def call_openrouter(text: str, api_key: str) -> dict | None:
    """Llama a OpenRouter con GPT-4o-mini para extraer entidades."""
    import urllib.request

    payload = json.dumps({
        "model": "openai/gpt-4o-mini",
        "messages": [
            {"role": "system", "content": LLM_SYSTEM_PROMPT},
            {"role": "user", "content": LLM_USER_PROMPT.format(text=text)},
        ],
        "temperature": 0.1,
        "max_tokens": 500,
        "response_format": {"type": "json_object"},
    }).encode()

    req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://libra.diegodella.ar",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
        content = data["choices"][0]["message"]["content"]
        return json.loads(content)
    except Exception as e:
        print(f"    LLM error: {e}", file=sys.stderr)
        return None


def run_phase2(conn, api_key: str, limit: int | None, dry_run: bool):
    print("\n=== PHASE 2: LLM extraction ===\n")

    person_cache = get_person_id_cache(conn)

    # Get docs not yet enriched in phase 2
    with conn.cursor() as cur:
        query = """
            SELECT d.id, d.content
            FROM documents d
            WHERE d.content IS NOT NULL AND length(d.content) > 100
              AND NOT EXISTS (
                SELECT 1 FROM enrichment_log e
                WHERE e.document_id = d.id AND e.phase = 2 AND e.status = 'done'
              )
            ORDER BY d.created_at
        """
        if limit:
            query += f" LIMIT {int(limit)}"
        cur.execute(query)
        docs = cur.fetchall()

    total = len(docs)
    print(f"Docs a procesar: {total}")
    if dry_run:
        print("(dry-run, no se llamara al LLM)")
        return

    # Track new person names across docs
    new_person_counts = Counter()
    stats = {'processed': 0, 'errors': 0, 'persons_linked': 0}

    for i, (doc_id, content) in enumerate(docs, 1):
        doc_id_str = str(doc_id)
        truncated = content[:3000]

        result = call_openrouter(truncated, api_key)
        time.sleep(0.5)  # Rate limit

        if result is None:
            stats['errors'] += 1
            log_enrichment(conn, doc_id_str, 2, 'error', error='LLM call failed')
            conn.commit()
            continue

        stats['processed'] += 1

        # Match extracted persons against known persons
        extracted_persons = result.get('persons', [])
        matched = []
        for name in extracted_persons:
            name_lower = name.lower()
            if name_lower in person_cache:
                matched.append(name)
            else:
                # Check partial match against known aliases
                for canonical, aliases in KNOWN_PERSONS.items():
                    if any(alias.lower() in name_lower or name_lower in alias.lower()
                           for alias in aliases):
                        matched.append(canonical)
                        break
                else:
                    new_person_counts[name] += 1

        # Link matched persons
        if matched:
            n = link_persons(conn, doc_id_str, matched, person_cache)
            stats['persons_linked'] += n

        # Log enrichment with full LLM result
        log_enrichment(conn, doc_id_str, 2, 'done', metadata=result)
        conn.commit()

        if i % 50 == 0 or i == total:
            print(f"  [{i}/{total}] OK: {stats['processed']} | Err: {stats['errors']} | Links: {stats['persons_linked']}")

    # Report suggested new persons (appear in 3+ docs)
    frequent = [(name, count) for name, count in new_person_counts.most_common() if count >= 3]
    print(f"\n--- Phase 2 Results ---")
    print(f"Procesados: {stats['processed']}")
    print(f"Errores: {stats['errors']}")
    print(f"Person links creados: {stats['persons_linked']}")

    if frequent:
        print(f"\nPersonas sugeridas para agregar (aparecen en 3+ docs):")
        for name, count in frequent:
            print(f"  {name}: {count} docs")


# ---------------------------------------------------------------------------
# Phase 3: Cross-referencing
# ---------------------------------------------------------------------------

def run_phase3(conn, dry_run: bool):
    print("\n=== PHASE 3: Cross-referencing ===\n")

    person_cache = get_person_id_cache(conn)

    # 3a: FTS linking — for each person, search content via tsquery
    stats = {'links_created': 0, 'persons_searched': 0}

    with conn.cursor() as cur:
        cur.execute("SELECT id, name, aliases FROM persons")
        persons = cur.fetchall()

    for pid, name, aliases in persons:
        pid_str = str(pid)
        search_terms = [name] + (aliases or [])

        for term in search_terms:
            # Skip very short terms that would match too broadly
            if len(term) < 4:
                continue

            with conn.cursor() as cur:
                cur.execute("""
                    SELECT id FROM documents
                    WHERE content IS NOT NULL
                      AND to_tsvector('spanish', content) @@ plainto_tsquery('spanish', %s)
                      AND id NOT IN (
                        SELECT document_id FROM document_persons WHERE person_id = %s
                      )
                """, (term, pid_str))
                doc_ids = [str(r[0]) for r in cur.fetchall()]

            if doc_ids and not dry_run:
                with conn.cursor() as cur:
                    for did in doc_ids:
                        cur.execute("""
                            INSERT INTO document_persons (document_id, person_id)
                            VALUES (%s, %s) ON CONFLICT DO NOTHING
                        """, (did, pid_str))
                        stats['links_created'] += cur.rowcount
                conn.commit()
            elif doc_ids and dry_run:
                stats['links_created'] += len(doc_ids)

            stats['persons_searched'] += 1

        if not dry_run:
            # Log enrichment for docs linked to this person
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT document_id FROM document_persons WHERE person_id = %s
                """, (pid_str,))
                for (did,) in cur.fetchall():
                    log_enrichment(conn, str(did), 3, 'done', metadata={'fts_linked': True})
            conn.commit()

    print(f"Personas buscadas: {stats['persons_searched']}")
    print(f"Links creados via FTS: {stats['links_created']}")

    # 3b: Network report — who communicates with whom
    print(f"\n--- Red de comunicacion (docs compartidos) ---\n")

    with conn.cursor() as cur:
        cur.execute("""
            SELECT p1.name, p2.name, COUNT(*) as shared_docs
            FROM document_persons dp1
            JOIN document_persons dp2 ON dp1.document_id = dp2.document_id AND dp1.person_id < dp2.person_id
            JOIN persons p1 ON dp1.person_id = p1.id
            JOIN persons p2 ON dp2.person_id = p2.id
            GROUP BY p1.name, p2.name
            ORDER BY shared_docs DESC
        """)
        pairs = cur.fetchall()

    if pairs:
        for p1, p2, count in pairs:
            bar = '#' * min(count, 50)
            print(f"  {p1} <-> {p2}: {count} docs {bar}")
    else:
        print("  (sin conexiones encontradas)")

    # Per-person doc count
    print(f"\n--- Docs por persona ---\n")
    with conn.cursor() as cur:
        cur.execute("""
            SELECT p.name, COUNT(*) as doc_count
            FROM document_persons dp
            JOIN persons p ON dp.person_id = p.id
            GROUP BY p.name
            ORDER BY doc_count DESC
        """)
        for name, count in cur.fetchall():
            bar = '#' * min(count, 50)
            print(f"  {name}: {count} docs {bar}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description='Libra — Enriquecimiento de metadata')
    parser.add_argument('--db-password', required=True, help='Password de supabase_admin')
    parser.add_argument('--db-host', default='192.168.1.14')
    parser.add_argument('--db-port', type=int, default=54329)
    parser.add_argument('--phase', type=int, required=True, choices=[1, 2, 3],
                        help='Fase a ejecutar: 1=regex, 2=LLM, 3=cross-ref')
    parser.add_argument('--openrouter-key', help='API key de OpenRouter (requerido para phase 2)')
    parser.add_argument('--limit', type=int, help='Limitar cantidad de docs (phase 2)')
    parser.add_argument('--dry-run', action='store_true', help='Solo mostrar que se haria')
    args = parser.parse_args()

    if args.phase == 2 and not args.openrouter_key and not args.dry_run:
        print("Error: --openrouter-key requerido para phase 2")
        sys.exit(1)

    conn = get_db_connection(args.db_password, args.db_host, args.db_port)
    print(f"Conectado a PostgreSQL en {args.db_host}:{args.db_port}")

    try:
        if args.phase == 1:
            run_phase1(conn, args.dry_run)
        elif args.phase == 2:
            run_phase2(conn, args.openrouter_key, args.limit, args.dry_run)
        elif args.phase == 3:
            run_phase3(conn, args.dry_run)
    finally:
        conn.close()


if __name__ == '__main__':
    main()
