"""
Libra — Ingesta de imagenes desde ZIP con OCR local (Tesseract).

Procesa imagenes (jpg, jpeg, png, webp, heic) desde un ZIP,
extrae texto via Tesseract OCR y las indexa en la base de datos.

Uso:
  source venv/bin/activate
  python scripts/ingest_images.py --zip /path/to/DATIP.zip --db-password <pwd>
  python scripts/ingest_images.py --zip /path/to/DATIP.zip --db-password <pwd> --dry-run
  python scripts/ingest_images.py --zip /path/to/DATIP.zip --db-password <pwd> --no-copy
"""

import os
import sys
import zipfile
import argparse
import shutil
from pathlib import Path

from PIL import Image
import pytesseract

from lib.common import (
    should_exclude as _should_exclude_base,
    infer_doc_type_from_path, match_person_in_path,
    parse_metadata_from_path,
    get_db_connection, get_person_id_cache, link_persons,
    log_error, get_processed_files,
)

# ---- Config ----

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.heic'}

# Minimum file size to process (skip thumbnails)
MIN_FILE_SIZE = 10 * 1024  # 10KB

# Output directory
IMAGE_OUTPUT_DIR = '/home/diego/Documents/libra/documents'

# Extra exclude patterns for images
EXTRA_EXCLUDE = ['/thumbnails/', '/thumbnail/']


def should_exclude(file_path: str) -> bool:
    if _should_exclude_base(file_path):
        return True
    for pattern in EXTRA_EXCLUDE:
        if pattern in file_path:
            return True
    basename = os.path.basename(file_path)
    if 'thumb' in basename.lower():
        return True
    return False


# ---- OCR ----

def ocr_image(file_path: str) -> str:
    """Run Tesseract OCR on an image file. Returns extracted text."""
    try:
        img = Image.open(file_path)
        # Convert HEIC/palette/RGBA to RGB for Tesseract compatibility
        if img.mode not in ('L', 'RGB'):
            img = img.convert('RGB')
        text = pytesseract.image_to_string(img, lang='spa')
        return text.strip()
    except Exception as e:
        print(f"    OCR warning: {e}", file=sys.stderr)
        return ''


def copy_image_to_output(zip_file, zip_info, output_dir: str) -> str:
    """Copia imagen del ZIP al directorio de nginx, manteniendo estructura."""
    rel_path = zip_info.filename
    for prefix in ['ANEXOS/', 'anexos/']:
        if rel_path.startswith(prefix):
            rel_path = rel_path[len(prefix):]
            break

    dest_path = os.path.join(output_dir, rel_path)
    dest_dir = os.path.dirname(dest_path)
    os.makedirs(dest_dir, exist_ok=True)

    with zip_file.open(zip_info.filename) as src, open(dest_path, 'wb') as dst:
        shutil.copyfileobj(src, dst)

    return rel_path


def upsert_image_document(conn, file_path: str, metadata: dict, content: str,
                          file_size: int, ocr_status: str, doc_type: str) -> str | None:
    """Inserta o actualiza un documento de imagen."""
    doc_id = None
    with conn.cursor() as cur:
        tags = []
        if metadata.get('efecto'):
            tags.append(metadata['efecto'])
        if metadata.get('punto'):
            tags.append(metadata['punto'])
        if metadata.get('platform'):
            tags.append(metadata['platform'])

        cur.execute("""
            INSERT INTO documents (title, doc_type, date, participants, tags, content,
                                   file_path, file_size, page_count, ocr_status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NULL, %s)
            ON CONFLICT (file_path) DO UPDATE SET
                title = EXCLUDED.title,
                content = EXCLUDED.content,
                file_size = EXCLUDED.file_size,
                ocr_status = EXCLUDED.ocr_status,
                doc_type = EXCLUDED.doc_type,
                updated_at = now()
            RETURNING id
        """, (
            metadata['title'],
            doc_type,
            metadata.get('date'),
            metadata.get('participants', []),
            tags,
            content if content else None,
            file_path,
            file_size,
            ocr_status,
        ))
        row = cur.fetchone()
        if row:
            doc_id = row[0]

        cur.execute("""
            INSERT INTO ingestion_log (file_path, status, completed_at)
            VALUES (%s, 'indexed', now())
            ON CONFLICT (file_path) DO UPDATE SET
                status = 'indexed',
                completed_at = now()
        """, (file_path,))

    conn.commit()
    return doc_id


# ---- Main processing ----

def process_zip(zip_path: str, conn, dry_run: bool = False, copy_images: bool = True):
    """Procesa imagenes de un ZIP con OCR local."""
    tmp_dir = '/tmp/libra_images'
    os.makedirs(tmp_dir, exist_ok=True)

    with zipfile.ZipFile(zip_path, 'r') as zf:
        # Filtrar imagenes
        entries = []
        for info in zf.infolist():
            if info.is_dir() or info.file_size == 0:
                continue
            if should_exclude(info.filename):
                continue
            if info.file_size < MIN_FILE_SIZE:
                continue
            ext = Path(info.filename).suffix.lower()
            if ext not in IMAGE_EXTENSIONS:
                continue
            entries.append(info)

        # Ordenar por tamano (chicos primero)
        entries.sort(key=lambda e: e.file_size)

        total = len(entries)
        print(f"\nImagenes encontradas: {total}")

        # Stats por formato
        by_format = {}
        total_size = 0
        for e in entries:
            ext = Path(e.filename).suffix.lower()
            by_format[ext] = by_format.get(ext, 0) + 1
            total_size += e.file_size
        for ext, count in sorted(by_format.items()):
            print(f"  {ext}: {count}")
        print(f"  Total: {total_size / (1024*1024):.1f} MB")

        if dry_run:
            print("\n--- DRY RUN: listando archivos ---")
            for e in entries:
                size_kb = e.file_size / 1024
                doc_type = infer_doc_type_from_path(e.filename) or 'imagen'
                persons = match_person_in_path(e.filename)
                person_str = f" -> {', '.join(persons)}" if persons else ""
                print(f"  [{doc_type:13s}] {size_kb:8.1f} KB  {e.filename}{person_str}")
            return

        # Load caches
        person_cache = get_person_id_cache(conn)
        processed = get_processed_files(conn)
        pending = [e for e in entries if e.filename not in processed]
        print(f"Ya procesados: {total - len(pending)}, pendientes: {len(pending)}")

        if not pending:
            print("Nada que procesar.")
            return

        if copy_images:
            os.makedirs(IMAGE_OUTPUT_DIR, exist_ok=True)

        success = 0
        errors = 0
        ocr_done = 0
        ocr_empty = 0

        for i, info in enumerate(pending, 1):
            ext = Path(info.filename).suffix.lower()
            tmp_path = None

            try:
                # Extract to temp
                tmp_path = os.path.join(tmp_dir, f"img_{i}{ext}")
                with zf.open(info.filename) as src, open(tmp_path, 'wb') as dst:
                    shutil.copyfileobj(src, dst)

                # HEIC conversion: pillow-heif registers automatically if installed
                if ext == '.heic':
                    try:
                        import pillow_heif
                        pillow_heif.register_heif_opener()
                    except ImportError:
                        # Try ImageMagick fallback
                        import subprocess
                        jpg_path = tmp_path.rsplit('.', 1)[0] + '.jpg'
                        result = subprocess.run(
                            ['convert', tmp_path, jpg_path],
                            capture_output=True, timeout=30
                        )
                        if result.returncode == 0:
                            os.remove(tmp_path)
                            tmp_path = jpg_path
                        else:
                            raise RuntimeError(f"ImageMagick failed: {result.stderr.decode()[:200]}")

                # OCR
                ocr_text = ocr_image(tmp_path)
                if ocr_text:
                    ocr_done += 1
                    ocr_status = 'done'
                else:
                    ocr_empty += 1
                    ocr_status = 'done'  # OCR ran but no text found

                # Parse metadata
                metadata = parse_metadata_from_path(info.filename)

                # Doc type: infer from path, fallback to 'imagen'
                doc_type = infer_doc_type_from_path(info.filename) or 'imagen'

                # Copy to nginx dir
                if copy_images:
                    try:
                        copy_image_to_output(zf, info, IMAGE_OUTPUT_DIR)
                    except Exception as e_copy:
                        print(f"  WARN: no se pudo copiar {info.filename}: {e_copy}", file=sys.stderr)

                # Upsert
                doc_id = upsert_image_document(
                    conn=conn,
                    file_path=info.filename,
                    metadata=metadata,
                    content=ocr_text if ocr_text else None,
                    file_size=info.file_size,
                    ocr_status=ocr_status,
                    doc_type=doc_type,
                )

                # Link persons
                matched_persons = match_person_in_path(info.filename)
                if matched_persons and doc_id:
                    link_persons(conn, doc_id, matched_persons, person_cache)

                success += 1

                # Progress cada 100 archivos
                if i % 100 == 0 or i == len(pending):
                    print(f"  [{i}/{len(pending)}] OK: {success} | Err: {errors} | OCR con texto: {ocr_done} | OCR vacio: {ocr_empty}")

            except Exception as e:
                errors += 1
                error_msg = f"{type(e).__name__}: {str(e)}"
                try:
                    log_error(conn, info.filename, error_msg)
                except Exception:
                    pass
                if errors <= 10:
                    print(f"  ERROR [{i}/{len(pending)}] {info.filename}: {error_msg}", file=sys.stderr)
                elif errors == 11:
                    print("  ... suprimiendo errores siguientes", file=sys.stderr)

            finally:
                if tmp_path and os.path.exists(tmp_path):
                    try:
                        os.remove(tmp_path)
                    except Exception:
                        pass

        print(f"\n=== RESUMEN ===")
        print(f"Procesados: {success}")
        print(f"Errores: {errors}")
        print(f"OCR con texto: {ocr_done}")
        print(f"OCR sin texto: {ocr_empty}")

    try:
        shutil.rmtree(tmp_dir, ignore_errors=True)
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(description='Libra — Ingesta de imagenes con OCR Tesseract')
    parser.add_argument('--zip', required=True, help='Path al archivo ZIP')
    parser.add_argument('--db-password', required=True, help='Password de supabase_admin')
    parser.add_argument('--db-host', default='192.168.1.14', help='Host de PostgreSQL')
    parser.add_argument('--db-port', type=int, default=54329, help='Puerto de PostgreSQL')
    parser.add_argument('--dry-run', action='store_true', help='Solo listar archivos, no procesar')
    parser.add_argument('--no-copy', action='store_true', help='No copiar imagenes al directorio de nginx')
    args = parser.parse_args()

    if not os.path.exists(args.zip):
        print(f"Error: archivo ZIP no encontrado: {args.zip}")
        sys.exit(1)

    if not zipfile.is_zipfile(args.zip):
        print(f"Error: no es un archivo ZIP valido: {args.zip}")
        sys.exit(1)

    conn = None
    if not args.dry_run:
        try:
            conn = get_db_connection(args.db_password, args.db_host, args.db_port)
            print(f"Conectado a PostgreSQL en {args.db_host}:{args.db_port}")
        except Exception as e:
            print(f"Error conectando a DB: {e}")
            sys.exit(1)

    try:
        process_zip(args.zip, conn, args.dry_run, not args.no_copy)
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    main()
