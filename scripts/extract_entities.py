#!/usr/bin/env python3
"""
Libra — Extract entities (phones, emails, wallets, URLs, orgs) from document content.
Stores in entities + document_entities tables.
"""

import argparse
import re
import sys

from lib.common import get_db_connection, KNOWN_ORGS

# ---------------------------------------------------------------------------
# Regex patterns
# ---------------------------------------------------------------------------

PATTERNS = {
    'phone': [
        re.compile(r'(\d{10,13})@s\.whatsapp\.net'),
        re.compile(r'\+(\d{10,15})'),
    ],
    'email': [
        re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'),
    ],
    'crypto_wallet': [
        # Solana: base58, 32-44 chars, no common false positives
        re.compile(r'\b[1-9A-HJ-NP-Za-km-z]{32,44}\b'),
    ],
    'url': [
        re.compile(r'https?://[^\s)<>\]]+'),
    ],
}

# Wallet false positive filters
WALLET_EXCLUDE = re.compile(
    r'^(https?://|.*@|.*\.(com|net|org|txt|pdf|docx|xlsx|py|js|ts|html|css)$)',
    re.IGNORECASE,
)


def normalize_phone(raw: str) -> str:
    return re.sub(r'\D', '', raw)


def normalize_email(raw: str) -> str:
    return raw.lower().strip()


def normalize_url(raw: str) -> str:
    # Strip trailing punctuation
    return raw.rstrip('.,;:!?')


def extract_from_content(content: str) -> dict[str, set[str]]:
    """Extract all entity types from text content."""
    found: dict[str, set[str]] = {k: set() for k in PATTERNS}

    for etype, patterns in PATTERNS.items():
        for pat in patterns:
            for m in pat.finditer(content):
                val = m.group(1) if m.lastindex else m.group(0)

                if etype == 'phone':
                    val = normalize_phone(val)
                    if len(val) < 10 or len(val) > 15:
                        continue
                elif etype == 'email':
                    val = normalize_email(val)
                    # Skip obviously bad emails
                    if val.endswith('.whatsapp.net'):
                        continue
                elif etype == 'crypto_wallet':
                    if WALLET_EXCLUDE.match(val):
                        continue
                    # Must have mix of upper/lower (real base58)
                    if val.isdigit() or val.isalpha():
                        continue
                elif etype == 'url':
                    val = normalize_url(val)
                    if len(val) > 500:
                        continue  # Skip extremely long URLs

                found[etype].add(val)

    # Organizations: match against KNOWN_ORGS
    found['organization'] = set()
    content_lower = content.lower()
    for canonical, aliases in KNOWN_ORGS.items():
        for alias in aliases:
            if alias.lower() in content_lower:
                found['organization'].add(canonical)
                break

    return found


def upsert_entity(cur, entity_type: str, value: str, display_name: str | None = None) -> str:
    """Insert or get existing entity, return its UUID."""
    cur.execute("""
        INSERT INTO entities (entity_type, value, display_name)
        VALUES (%s, %s, %s)
        ON CONFLICT (entity_type, lower(value)) DO UPDATE SET entity_type = entities.entity_type
        RETURNING id
    """, (entity_type, value, display_name or value))
    return str(cur.fetchone()[0])


def link_entity(cur, document_id: str, entity_id: str, context: str | None, method: str = 'regex'):
    """Link document to entity."""
    cur.execute("""
        INSERT INTO document_entities (document_id, entity_id, context, extraction_method)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT DO NOTHING
    """, (document_id, entity_id, context[:200] if context else None, method))


def main():
    parser = argparse.ArgumentParser(description='Extract entities from documents')
    parser.add_argument('--db-password', required=True)
    parser.add_argument('--batch-size', type=int, default=500)
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    conn_read = get_db_connection(args.db_password)
    conn_write = get_db_connection(args.db_password)
    conn_write.autocommit = False

    # Server-side cursor on separate connection (survives commits on write conn)
    cur_read = conn_read.cursor(name='entity_reader')
    cur_read.itersize = args.batch_size
    cur_read.execute("SELECT id, content FROM documents WHERE content IS NOT NULL AND length(content) > 10")

    cur_write = conn_write.cursor()
    total_docs = 0
    total_entities = 0
    total_links = 0
    batch_count = 0

    print("Extracting entities from documents...")

    for row in cur_read:
        doc_id, content = str(row[0]), row[1]
        entities = extract_from_content(content)

        for etype, values in entities.items():
            for val in values:
                if args.dry_run:
                    total_entities += 1
                    continue

                # Context: first occurrence snippet
                idx = content.lower().find(val.lower())
                ctx = content[max(0, idx - 50):idx + len(val) + 50] if idx >= 0 else None

                display = val
                if etype == 'phone' and len(val) >= 10:
                    display = f"+{val}" if not val.startswith('+') else val

                ent_id = upsert_entity(cur_write, etype, val, display)
                link_entity(cur_write, doc_id, ent_id, ctx)
                total_entities += 1
                total_links += 1

        total_docs += 1
        batch_count += 1

        if batch_count >= args.batch_size:
            if not args.dry_run:
                conn_write.commit()
            print(f"  {total_docs} docs processed, {total_entities} entities, {total_links} links")
            batch_count = 0

    # Final commit
    if not args.dry_run:
        conn_write.commit()

    cur_read.close()
    cur_write.close()
    conn_read.close()
    conn_write.close()

    print(f"\nDone: {total_docs} docs, {total_entities} entities, {total_links} links")
    if args.dry_run:
        print("(dry run — nothing written)")


if __name__ == '__main__':
    main()
