"""
Libra — Generacion de embeddings para chunks.

Usa OpenAI text-embedding-3-small (1536 dims) para generar embeddings
de los chunks sin embedding.

Costo estimado: ~6500 docs x 3 chunks x 500 tokens = ~$0.20

Uso:
  source venv/bin/activate
  python scripts/embed_chunks.py --db-password <pwd> --openai-key <key>
  python scripts/embed_chunks.py --db-password <pwd> --openai-key <key> --dry-run
"""

import sys
import time
import argparse

from lib.common import get_db_connection

EMBEDDING_MODEL = 'text-embedding-3-small'
BATCH_SIZE = 100
MAX_RETRIES = 3
RETRY_BACKOFF = 5


def get_pending_chunks(conn, limit=None):
    """Get chunks without embeddings."""
    with conn.cursor() as cur:
        query = """
            SELECT id, content FROM document_chunks
            WHERE embedding IS NULL
            ORDER BY created_at
        """
        if limit:
            query += f" LIMIT {int(limit)}"
        cur.execute(query)
        return cur.fetchall()


def generate_embeddings(texts, api_key):
    """Call OpenAI API to generate embeddings for a batch of texts."""
    import urllib.request
    import json

    payload = json.dumps({
        "model": EMBEDDING_MODEL,
        "input": texts,
    }).encode()

    req = urllib.request.Request(
        "https://api.openai.com/v1/embeddings",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )

    for attempt in range(MAX_RETRIES):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode())
            return [item["embedding"] for item in data["data"]]
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                wait = RETRY_BACKOFF * (attempt + 1)
                print(f"  Retry {attempt + 1}/{MAX_RETRIES} en {wait}s: {e}", file=sys.stderr)
                time.sleep(wait)
            else:
                raise


def update_embeddings(conn, chunk_ids, embeddings):
    """Update chunks with their embeddings."""
    with conn.cursor() as cur:
        for chunk_id, embedding in zip(chunk_ids, embeddings):
            cur.execute(
                "UPDATE document_chunks SET embedding = %s WHERE id = %s",
                (str(embedding), str(chunk_id))
            )
    conn.commit()


def main():
    parser = argparse.ArgumentParser(description='Libra — Embeddings para chunks')
    parser.add_argument('--db-password', required=True)
    parser.add_argument('--openai-key', required=True, help='OpenAI API key')
    parser.add_argument('--db-host', default='192.168.1.14')
    parser.add_argument('--db-port', type=int, default=54329)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--limit', type=int, help='Limitar cantidad de chunks')
    parser.add_argument('--batch-size', type=int, default=BATCH_SIZE)
    args = parser.parse_args()

    conn = get_db_connection(args.db_password, args.db_host, args.db_port)
    print(f"Conectado a PostgreSQL en {args.db_host}:{args.db_port}")

    chunks = get_pending_chunks(conn, args.limit)
    print(f"\nChunks sin embedding: {len(chunks)}")

    if not chunks:
        print("Nada que procesar.")
        conn.close()
        return

    # Estimate cost
    total_chars = sum(len(c[1]) for c in chunks)
    est_tokens = total_chars / 4  # rough estimate
    est_cost = est_tokens * 0.02 / 1_000_000
    print(f"Chars totales: {total_chars:,}")
    print(f"Tokens estimados: {int(est_tokens):,}")
    print(f"Costo estimado: ${est_cost:.4f}")

    if args.dry_run:
        conn.close()
        return

    success = 0
    errors = 0
    batch_size = args.batch_size

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        chunk_ids = [c[0] for c in batch]
        texts = [c[1] for c in batch]

        try:
            embeddings = generate_embeddings(texts, args.openai_key)
            update_embeddings(conn, chunk_ids, embeddings)
            success += len(batch)
        except Exception as e:
            errors += len(batch)
            print(f"  ERROR batch {i//batch_size}: {e}", file=sys.stderr)

        processed = min(i + batch_size, len(chunks))
        if processed % 500 == 0 or processed == len(chunks):
            print(f"  [{processed}/{len(chunks)}] OK: {success} | Err: {errors}")

    print(f"\n=== RESUMEN ===")
    print(f"Embeddings generados: {success}")
    print(f"Errores: {errors}")

    conn.close()


if __name__ == '__main__':
    main()
