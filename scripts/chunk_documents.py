"""
Libra — Chunking de documentos para RAG.

Divide documentos con contenido en chunks de ~500 tokens (~2000 chars)
con 200 chars de overlap para embeddings.

Uso:
  source venv/bin/activate
  python scripts/chunk_documents.py --db-password <pwd>
  python scripts/chunk_documents.py --db-password <pwd> --dry-run
  python scripts/chunk_documents.py --db-password <pwd> --force
"""

import sys
import argparse
from lib.common import get_db_connection

CHUNK_SIZE = 2000  # chars (~500 tokens)
CHUNK_OVERLAP = 200
MIN_CONTENT_LENGTH = 100


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """Split text into overlapping chunks, preferring paragraph boundaries."""
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        if end >= len(text):
            chunks.append(text[start:])
            break

        # Try to break at paragraph boundary
        break_at = text.rfind('\n\n', start + chunk_size // 2, end)
        if break_at == -1:
            # Try newline
            break_at = text.rfind('\n', start + chunk_size // 2, end)
        if break_at == -1:
            # Try space
            break_at = text.rfind(' ', start + chunk_size // 2, end)
        if break_at > start:
            end = break_at

        chunks.append(text[start:end])
        start = end - overlap

    return chunks


def get_documents_to_chunk(conn, force=False):
    """Get documents with content that need chunking."""
    with conn.cursor() as cur:
        if force:
            cur.execute("""
                SELECT id, title, content FROM documents
                WHERE content IS NOT NULL AND length(content) > %s
                ORDER BY created_at
            """, (MIN_CONTENT_LENGTH,))
        else:
            cur.execute("""
                SELECT d.id, d.title, d.content FROM documents d
                LEFT JOIN document_chunks dc ON dc.document_id = d.id
                WHERE d.content IS NOT NULL AND length(d.content) > %s
                  AND dc.id IS NULL
                GROUP BY d.id, d.title, d.content
                ORDER BY d.created_at
            """, (MIN_CONTENT_LENGTH,))
        return cur.fetchall()


def insert_chunks(conn, doc_id, chunks):
    """Insert chunks for a document, replacing existing ones."""
    with conn.cursor() as cur:
        # Delete existing chunks for this document
        cur.execute("DELETE FROM document_chunks WHERE document_id = %s", (doc_id,))

        for i, chunk in enumerate(chunks):
            cur.execute("""
                INSERT INTO document_chunks (document_id, chunk_index, content)
                VALUES (%s, %s, %s)
            """, (doc_id, i, chunk))
    conn.commit()


def main():
    parser = argparse.ArgumentParser(description='Libra — Chunking de documentos')
    parser.add_argument('--db-password', required=True)
    parser.add_argument('--db-host', default='192.168.1.14')
    parser.add_argument('--db-port', type=int, default=54329)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--force', action='store_true', help='Regenerar chunks existentes')
    args = parser.parse_args()

    conn = get_db_connection(args.db_password, args.db_host, args.db_port)
    print(f"Conectado a PostgreSQL en {args.db_host}:{args.db_port}")

    docs = get_documents_to_chunk(conn, args.force)
    print(f"\nDocumentos a procesar: {len(docs)}")

    if args.dry_run:
        total_chunks = 0
        for doc_id, title, content in docs:
            chunks = chunk_text(content)
            total_chunks += len(chunks)
            if len(docs) <= 20:
                print(f"  {str(doc_id)[:8]}... {title or 'Sin titulo'}: {len(content)} chars -> {len(chunks)} chunks")
        print(f"\nTotal estimado: {total_chunks} chunks")
        conn.close()
        return

    success = 0
    errors = 0
    total_chunks = 0

    for i, (doc_id, title, content) in enumerate(docs, 1):
        try:
            chunks = chunk_text(content)
            insert_chunks(conn, str(doc_id), chunks)
            success += 1
            total_chunks += len(chunks)

            if i % 100 == 0 or i == len(docs):
                print(f"  [{i}/{len(docs)}] OK: {success} | Err: {errors} | Chunks: {total_chunks}")

        except Exception as e:
            errors += 1
            if errors <= 10:
                print(f"  ERROR: {doc_id}: {e}", file=sys.stderr)

    print(f"\n=== RESUMEN ===")
    print(f"Docs procesados: {success}")
    print(f"Errores: {errors}")
    print(f"Chunks creados: {total_chunks}")
    print(f"Promedio chunks/doc: {total_chunks / max(success, 1):.1f}")

    conn.close()


if __name__ == '__main__':
    main()
