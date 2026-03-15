"""
Libra — OCR para PDFs pendientes usando Tesseract.

Procesa documentos con ocr_status='pending' que ya estan copiados
en el directorio documents/.

Uso:
  sudo apt install tesseract-ocr tesseract-ocr-spa poppler-utils
  source venv/bin/activate
  pip install pytesseract pdf2image
  python scripts/ocr_pending.py --db-password <password>
  python scripts/ocr_pending.py --db-password <password> --dry-run
"""

import os
import sys
import argparse

import PIL.Image
PIL.Image.MAX_IMAGE_PIXELS = 500_000_000  # Allow large scanned docs

import pytesseract
from pdf2image import convert_from_path

from lib.common import get_db_connection

# Base directory where PDFs are stored (nginx volume)
DOCUMENTS_DIR = '/home/diego/Documents/libra/documents'

# Tesseract config
TESSERACT_LANG = 'spa'

# DPI for PDF to image conversion (lower = faster, 200 is good enough for OCR)
OCR_DPI = 200


def get_pending_documents(conn) -> list[dict]:
    """Obtiene documentos con ocr_status='pending'."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, title, file_path, file_size, page_count
            FROM documents
            WHERE ocr_status = 'pending'
            ORDER BY file_size ASC NULLS LAST
        """)
        return [
            {'id': str(row[0]), 'title': row[1], 'file_path': row[2],
             'file_size': row[3], 'page_count': row[4]}
            for row in cur.fetchall()
        ]


def ocr_pdf(pdf_path: str) -> str:
    """Convierte PDF a imagenes y extrae texto con Tesseract."""
    images = convert_from_path(pdf_path, dpi=OCR_DPI)
    pages_text = []
    for i, img in enumerate(images, 1):
        text = pytesseract.image_to_string(img, lang=TESSERACT_LANG)
        if text.strip():
            pages_text.append(text.strip())
    return '\n\n'.join(pages_text)


def update_document_content(conn, doc_id: str, content: str):
    """Actualiza content y ocr_status de un documento."""
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE documents
            SET content = %s,
                ocr_status = 'done',
                updated_at = now()
            WHERE id = %s
        """, (content, doc_id))

        # Also update ingestion_log
        cur.execute("""
            UPDATE ingestion_log
            SET status = 'indexed',
                completed_at = now()
            WHERE file_path = (SELECT file_path FROM documents WHERE id = %s)
        """, (doc_id,))
    conn.commit()


def mark_ocr_error(conn, doc_id: str, error_msg: str):
    """Marca un documento como error de OCR."""
    with conn.cursor() as cur:
        cur.execute("""
            UPDATE documents
            SET ocr_status = 'error',
                updated_at = now()
            WHERE id = %s
        """, (doc_id,))
    conn.commit()


def main():
    parser = argparse.ArgumentParser(description='Libra — OCR para PDFs pendientes')
    parser.add_argument('--db-password', required=True, help='Password de supabase_admin')
    parser.add_argument('--db-host', default='192.168.1.14', help='Host de PostgreSQL')
    parser.add_argument('--db-port', type=int, default=54329, help='Puerto de PostgreSQL')
    parser.add_argument('--dry-run', action='store_true', help='Solo listar archivos pendientes')
    parser.add_argument('--docs-dir', default=DOCUMENTS_DIR, help='Directorio base de documentos')
    args = parser.parse_args()

    conn = get_db_connection(args.db_password, args.db_host, args.db_port)
    print(f"Conectado a PostgreSQL en {args.db_host}:{args.db_port}")

    pending = get_pending_documents(conn)
    print(f"\nDocumentos con OCR pendiente: {len(pending)}")

    if not pending:
        print("Nada que procesar.")
        conn.close()
        return

    if args.dry_run:
        print("\n--- DRY RUN ---")
        for doc in pending:
            size_kb = (doc['file_size'] or 0) / 1024
            pages = doc['page_count'] or '?'
            pdf_path = os.path.join(args.docs_dir, doc['file_path'])
            exists = os.path.exists(pdf_path)
            status = "OK" if exists else "NOT FOUND"
            print(f"  [{status}] {size_kb:7.1f} KB  {pages}p  {doc['file_path']}")
        conn.close()
        return

    success = 0
    errors = 0
    not_found = 0

    for i, doc in enumerate(pending, 1):
        pdf_path = os.path.join(args.docs_dir, doc['file_path'])

        if not os.path.exists(pdf_path):
            not_found += 1
            if not_found <= 5:
                print(f"  NOT FOUND [{i}/{len(pending)}]: {doc['file_path']}")
            mark_ocr_error(conn, doc['id'], 'PDF file not found on disk')
            continue

        try:
            text = ocr_pdf(pdf_path)

            if text.strip():
                update_document_content(conn, doc['id'], text)
                success += 1
            else:
                # No text extracted even with OCR
                mark_ocr_error(conn, doc['id'], 'OCR produced no text')
                errors += 1

            if i % 10 == 0 or i == len(pending):
                print(f"  [{i}/{len(pending)}] OK: {success} | Err: {errors} | Not found: {not_found}")

        except Exception as e:
            errors += 1
            error_msg = f"{type(e).__name__}: {str(e)}"
            mark_ocr_error(conn, doc['id'], error_msg)
            if errors <= 10:
                print(f"  ERROR [{i}/{len(pending)}] {doc['file_path']}: {error_msg}", file=sys.stderr)

    print(f"\n=== RESUMEN OCR ===")
    print(f"Procesados OK: {success}")
    print(f"Errores: {errors}")
    print(f"No encontrados: {not_found}")

    conn.close()


if __name__ == '__main__':
    main()
