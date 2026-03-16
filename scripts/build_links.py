#!/usr/bin/env python3
"""
Libra — Build document links across 5 strategies.
Usage: python scripts/build_links.py --db-password <pwd> --strategy <name>
"""

import argparse
import json
import re
import sys
from pathlib import Path

from lib.common import get_db_connection


def insert_links(cur, links: list[tuple], link_type: str):
    """Batch insert links. Each tuple: (source_id, target_id, strength, metadata_json)."""
    if not links:
        return 0
    inserted = 0
    for src, tgt, strength, meta in links:
        # Enforce source_id < target_id
        a, b = (src, tgt) if src < tgt else (tgt, src)
        cur.execute("""
            INSERT INTO document_links (source_id, target_id, link_type, strength, metadata)
            VALUES (%s, %s, %s, %s, %s::jsonb)
            ON CONFLICT (source_id, target_id, link_type) DO UPDATE SET
                strength = GREATEST(document_links.strength, EXCLUDED.strength)
        """, (a, b, link_type, strength, meta))
        inserted += cur.rowcount
    return inserted


# ---------------------------------------------------------------------------
# Strategy: shared_person
# ---------------------------------------------------------------------------

def build_shared_person(conn):
    """
    Link docs that share persons. Avoids combinatorial explosion:
    - Require >= 2 shared persons, OR
    - 1 shared person if that person has < 200 docs (rare person)
    - Max 20 links per doc
    """
    print("Building shared_person links...")
    cur = conn.cursor()

    # Get person doc counts for rarity filter
    cur.execute("SELECT person_id, COUNT(*) FROM document_persons GROUP BY person_id")
    person_doc_count = {str(r[0]): r[1] for r in cur.fetchall()}

    # Rare persons (< 200 docs)
    rare_persons = {pid for pid, cnt in person_doc_count.items() if cnt < 200}
    print(f"  {len(rare_persons)} rare persons (< 200 docs), {len(person_doc_count) - len(rare_persons)} common")

    # Strategy A: docs sharing >= 2 persons (any person)
    print("  Finding docs sharing >= 2 persons...")
    cur.execute("""
        WITH doc_pairs AS (
            SELECT dp1.document_id AS d1, dp2.document_id AS d2,
                   COUNT(*) AS shared_count,
                   array_agg(dp1.person_id::text) AS person_ids
            FROM document_persons dp1
            JOIN document_persons dp2
                ON dp1.person_id = dp2.person_id
                AND dp1.document_id < dp2.document_id
            GROUP BY dp1.document_id, dp2.document_id
            HAVING COUNT(*) >= 2
        )
        SELECT d1, d2, shared_count, person_ids FROM doc_pairs
    """)
    multi_links = []
    for d1, d2, shared, pids in cur.fetchall():
        # Strength: proportion of shared persons
        strength = min(1.0, shared / 5.0)  # 5 shared = max strength
        meta = json.dumps({"shared_persons": shared, "person_ids": [str(p) for p in pids[:5]]})
        multi_links.append((str(d1), str(d2), strength, meta))

    print(f"  {len(multi_links)} pairs from >= 2 shared persons")

    # Strategy B: docs sharing 1 rare person
    print("  Finding docs sharing rare persons...")
    rare_list = list(rare_persons)
    rare_links = []

    # Process in chunks to avoid memory explosion
    chunk_size = 50
    for i in range(0, len(rare_list), chunk_size):
        chunk = rare_list[i:i + chunk_size]
        placeholders = ','.join(['%s'] * len(chunk))
        cur.execute(f"""
            SELECT dp1.document_id, dp2.document_id, dp1.person_id
            FROM document_persons dp1
            JOIN document_persons dp2
                ON dp1.person_id = dp2.person_id
                AND dp1.document_id < dp2.document_id
            WHERE dp1.person_id IN ({placeholders})
        """, chunk)

        for d1, d2, pid in cur.fetchall():
            # Skip if already covered by multi_links
            pair_key = (str(d1), str(d2)) if str(d1) < str(d2) else (str(d2), str(d1))
            meta = json.dumps({"shared_persons": 1, "person_ids": [str(pid)]})
            rare_links.append((pair_key[0], pair_key[1], 0.3, meta))

    print(f"  {len(rare_links)} pairs from rare persons")

    # Merge: multi_links take precedence (higher strength)
    # Deduplicate by pair
    seen = set()
    final_links = []
    for src, tgt, s, m in multi_links:
        key = (src, tgt) if src < tgt else (tgt, src)
        if key not in seen:
            seen.add(key)
            final_links.append((key[0], key[1], s, m))

    for src, tgt, s, m in rare_links:
        key = (src, tgt) if src < tgt else (tgt, src)
        if key not in seen:
            seen.add(key)
            final_links.append((key[0], key[1], s, m))

    # Limit per doc: keep top 20 by strength per source
    from collections import defaultdict
    doc_links = defaultdict(list)
    for src, tgt, s, m in final_links:
        doc_links[src].append((src, tgt, s, m))
        doc_links[tgt].append((src, tgt, s, m))

    kept = set()
    for doc_id, links in doc_links.items():
        links.sort(key=lambda x: -x[2])
        for link in links[:20]:
            key = (link[0], link[1])
            kept.add(key)

    final_links = [l for l in final_links if (l[0], l[1]) in kept]
    print(f"  {len(final_links)} links after per-doc limit")

    # Insert in batches
    batch_size = 1000
    total = 0
    for i in range(0, len(final_links), batch_size):
        batch = final_links[i:i + batch_size]
        total += insert_links(cur, batch, 'shared_person')
        conn.commit()
        print(f"  Inserted {total} / {len(final_links)}")

    conn.commit()
    print(f"  Done: {total} shared_person links")


# ---------------------------------------------------------------------------
# Strategy: shared_entity
# ---------------------------------------------------------------------------

def build_shared_entity(conn):
    """Link docs sharing entities (phones, emails, etc.)."""
    print("Building shared_entity links...")
    cur = conn.cursor()

    STRENGTH_MAP = {
        'phone': 0.9,
        'email': 0.9,
        'crypto_wallet': 0.8,
        'organization': 0.5,
        'url': 0.3,
    }

    cur.execute("""
        SELECT de1.document_id, de2.document_id, e.entity_type, e.value
        FROM document_entities de1
        JOIN document_entities de2
            ON de1.entity_id = de2.entity_id
            AND de1.document_id < de2.document_id
        JOIN entities e ON e.id = de1.entity_id
    """)

    links = []
    seen = set()
    for d1, d2, etype, val in cur.fetchall():
        key = (str(d1), str(d2))
        if key in seen:
            continue
        seen.add(key)
        strength = STRENGTH_MAP.get(etype, 0.5)
        meta = json.dumps({"entity_type": etype, "value": val[:100]})
        links.append((str(d1), str(d2), strength, meta))

    print(f"  {len(links)} entity pairs found")

    batch_size = 1000
    total = 0
    for i in range(0, len(links), batch_size):
        total += insert_links(cur, links[i:i + batch_size], 'shared_entity')
        conn.commit()

    print(f"  Done: {total} shared_entity links")


# ---------------------------------------------------------------------------
# Strategy: file_proximity
# ---------------------------------------------------------------------------

def build_file_proximity(conn):
    """Link docs in same directory structure (person/platform level)."""
    print("Building file_proximity links...")
    cur = conn.cursor()

    cur.execute("SELECT id, file_path FROM documents WHERE file_path IS NOT NULL")
    docs = [(str(r[0]), r[1]) for r in cur.fetchall()]
    print(f"  {len(docs)} docs with file_path")

    # Group by significant directory (3-4 levels deep)
    from collections import defaultdict
    dir_groups = defaultdict(list)

    for doc_id, fpath in docs:
        parts = Path(fpath).parts
        # Use first 4 significant parts (skip generic roots)
        if len(parts) >= 4:
            key = '/'.join(parts[:4])
            dir_groups[key].append(doc_id)

    # Filter: only dirs with 2-200 docs
    eligible = {k: v for k, v in dir_groups.items() if 2 <= len(v) <= 200}
    print(f"  {len(eligible)} eligible directories (2-200 docs each)")

    links = []
    for dir_key, doc_ids in eligible.items():
        # Determine strength from directory depth specificity
        depth = len(dir_key.split('/'))
        strength = 0.4 if depth <= 3 else 0.8

        for i in range(len(doc_ids)):
            for j in range(i + 1, min(len(doc_ids), i + 21)):  # Max 20 links per doc
                a, b = doc_ids[i], doc_ids[j]
                if a > b:
                    a, b = b, a
                meta = json.dumps({"directory": dir_key[:200]})
                links.append((a, b, strength, meta))

    # Deduplicate
    seen = set()
    unique_links = []
    for l in links:
        key = (l[0], l[1])
        if key not in seen:
            seen.add(key)
            unique_links.append(l)

    print(f"  {len(unique_links)} unique proximity links")

    batch_size = 1000
    total = 0
    for i in range(0, len(unique_links), batch_size):
        total += insert_links(cur, unique_links[i:i + batch_size], 'file_proximity')
        conn.commit()

    print(f"  Done: {total} file_proximity links")


# ---------------------------------------------------------------------------
# Strategy: threads (WhatsApp conversations)
# ---------------------------------------------------------------------------

def build_threads(conn):
    """Link WhatsApp messages in the same conversation thread."""
    print("Building thread links...")
    cur = conn.cursor()

    # Find WhatsApp docs by path
    cur.execute("""
        SELECT id, file_path FROM documents
        WHERE lower(file_path) LIKE '%%whatsapp%%'
        AND file_path IS NOT NULL
    """)
    docs = [(str(r[0]), r[1]) for r in cur.fetchall()]
    print(f"  {len(docs)} WhatsApp docs")

    from collections import defaultdict
    threads = defaultdict(list)

    for doc_id, fpath in docs:
        # Extract thread key: person + contact from path
        # e.g. .../Manu Terrones Godoy/WhatsApp/+5491123456789/...
        parts = Path(fpath).parts
        path_lower = fpath.lower()

        # Find WhatsApp index
        wa_idx = None
        for i, p in enumerate(parts):
            if 'whatsapp' in p.lower():
                wa_idx = i
                break

        if wa_idx is None:
            continue

        # Thread key: everything up to and including the contact/group dir after WhatsApp
        # person/WhatsApp/contact forms the thread
        key_parts = parts[:min(wa_idx + 2, len(parts))]
        thread_key = '/'.join(key_parts)
        threads[thread_key].append(doc_id)

    # Filter threads with 2+ docs and <= 500 docs
    eligible = {k: v for k, v in threads.items() if 2 <= len(v) <= 500}
    print(f"  {len(eligible)} conversation threads")

    links = []
    for thread_key, doc_ids in eligible.items():
        for i in range(len(doc_ids)):
            for j in range(i + 1, min(len(doc_ids), i + 11)):  # Max 10 links per doc in thread
                a, b = doc_ids[i], doc_ids[j]
                if a > b:
                    a, b = b, a
                meta = json.dumps({"thread": thread_key[:200]})
                links.append((a, b, 1.0, meta))

    seen = set()
    unique = []
    for l in links:
        key = (l[0], l[1])
        if key not in seen:
            seen.add(key)
            unique.append(l)

    print(f"  {len(unique)} thread links")

    batch_size = 1000
    total = 0
    for i in range(0, len(unique), batch_size):
        total += insert_links(cur, unique[i:i + batch_size], 'same_thread')
        conn.commit()

    print(f"  Done: {total} same_thread links")


# ---------------------------------------------------------------------------
# Strategy: semantic similarity
# ---------------------------------------------------------------------------

def build_semantic(conn):
    """Link docs by embedding similarity (chunk 0 cosine > 0.88)."""
    print("Building semantic links...")
    cur = conn.cursor()

    # Count docs with chunk 0
    cur.execute("SELECT COUNT(*) FROM document_chunks WHERE chunk_index = 0 AND embedding IS NOT NULL")
    total_docs = cur.fetchone()[0]
    print(f"  {total_docs} docs with chunk 0 embeddings")

    # Process in batches
    batch_size = 200
    offset = 0
    total_links = 0

    while offset < total_docs:
        # Get batch of doc embeddings
        cur.execute("""
            SELECT document_id, embedding
            FROM document_chunks
            WHERE chunk_index = 0 AND embedding IS NOT NULL
            ORDER BY document_id
            LIMIT %s OFFSET %s
        """, (batch_size, offset))

        batch_docs = [(str(r[0]), r[1]) for r in cur.fetchall()]
        if not batch_docs:
            break

        links = []
        for doc_id, embedding in batch_docs:
            # Find top 5 similar docs using IVFFlat index
            cur.execute("""
                SELECT dc.document_id, 1 - (dc.embedding <=> %s::vector) AS similarity
                FROM document_chunks dc
                WHERE dc.chunk_index = 0
                    AND dc.embedding IS NOT NULL
                    AND dc.document_id != %s
                ORDER BY dc.embedding <=> %s::vector
                LIMIT 5
            """, (embedding, doc_id, embedding))

            for other_id, sim in cur.fetchall():
                if sim >= 0.88:
                    meta = json.dumps({"cosine_similarity": round(sim, 4)})
                    links.append((doc_id, str(other_id), round(sim, 4), meta))

        total_links += insert_links(cur, links, 'semantic_similarity')
        conn.commit()

        offset += batch_size
        print(f"  Processed {min(offset, total_docs)} / {total_docs}, {total_links} links so far")

    print(f"  Done: {total_links} semantic_similarity links")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

STRATEGIES = {
    'shared_person': build_shared_person,
    'shared_entity': build_shared_entity,
    'file_proximity': build_file_proximity,
    'threads': build_threads,
    'semantic': build_semantic,
}


def main():
    parser = argparse.ArgumentParser(description='Build document links')
    parser.add_argument('--db-password', required=True)
    parser.add_argument('--strategy', required=True, choices=list(STRATEGIES.keys()) + ['all'])
    args = parser.parse_args()

    conn = get_db_connection(args.db_password)
    conn.autocommit = False

    if args.strategy == 'all':
        for name in ['shared_person', 'shared_entity', 'file_proximity', 'threads', 'semantic']:
            print(f"\n{'='*60}")
            STRATEGIES[name](conn)
    else:
        STRATEGIES[args.strategy](conn)

    conn.close()
    print("\nAll done.")


if __name__ == '__main__':
    main()
