"""
Libra — Ingesta de audios desde ZIP con transcripcion via Groq Whisper API.

Procesa archivos de audio (opus, wav, m4a, aac, ogg) desde un ZIP,
los transcribe usando Groq Whisper API y los indexa en la base de datos.

Uso:
  source venv/bin/activate
  python scripts/ingest_audio.py --zip /path/to/DATIP.zip --db-password <pwd> --groq-key <key>
  python scripts/ingest_audio.py --zip /path/to/DATIP.zip --db-password <pwd> --groq-key <key> --dry-run
  python scripts/ingest_audio.py --zip /path/to/DATIP.zip --db-password <pwd> --groq-key <key> --no-copy-audio
"""

import os
import sys
import time
import zipfile
import argparse
import shutil
from pathlib import Path

import requests

from lib.common import (
    should_exclude, match_person_in_path,
    parse_metadata_from_path,
    get_db_connection, get_person_id_cache, link_persons,
    log_error, get_processed_files,
)

# ---- Config ----

AUDIO_EXTENSIONS = {'.opus', '.wav', '.m4a', '.aac', '.ogg'}

# Groq Whisper API
GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
WHISPER_MODEL = 'whisper-large-v3'

# Rate limiting
REQUEST_DELAY = 3  # seconds between requests
MAX_RETRIES = 3
RETRY_BACKOFF = 10  # seconds base for retry

# Max file size for Whisper API (25MB)
MAX_AUDIO_SIZE = 25 * 1024 * 1024

# Output directory
AUDIO_OUTPUT_DIR = '/home/diego/Documents/libra/documents'


# ---- Transcription ----

def transcribe_audio(file_path: str, groq_key: str) -> tuple[str, int | None]:
    """
    Transcribe audio using Groq Whisper API.
    Returns (transcription_text, duration_seconds).
    """
    for attempt in range(MAX_RETRIES):
        try:
            with open(file_path, 'rb') as f:
                resp = requests.post(
                    GROQ_API_URL,
                    headers={'Authorization': f'Bearer {groq_key}'},
                    files={'file': (os.path.basename(file_path), f)},
                    data={
                        'model': WHISPER_MODEL,
                        'language': 'es',
                        'response_format': 'verbose_json',
                    },
                    timeout=120,
                )

            if resp.status_code == 429:
                # Rate limited — wait and retry
                wait = RETRY_BACKOFF * (attempt + 1)
                print(f"    Rate limited, esperando {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue

            if resp.status_code != 200:
                error_detail = resp.text[:200]
                raise Exception(f"Groq API error {resp.status_code}: {error_detail}")

            data = resp.json()
            text = data.get('text', '').strip()
            duration = None
            if 'duration' in data:
                duration = int(float(data['duration']))

            return text, duration

        except requests.exceptions.Timeout:
            if attempt < MAX_RETRIES - 1:
                wait = RETRY_BACKOFF * (attempt + 1)
                print(f"    Timeout, reintentando en {wait}s...", file=sys.stderr)
                time.sleep(wait)
                continue
            raise

    raise Exception(f"Failed after {MAX_RETRIES} retries")


def upsert_audio_document(conn, file_path: str, metadata: dict, content: str,
                          file_size: int, duration_seconds: int | None,
                          audio_format: str) -> str | None:
    """Inserta o actualiza un documento de audio."""
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
                                   file_path, file_size, page_count, ocr_status,
                                   duration_seconds, audio_format)
            VALUES (%s, 'audio', %s, %s, %s, %s, %s, %s, NULL, 'skipped', %s, %s)
            ON CONFLICT (file_path) DO UPDATE SET
                title = EXCLUDED.title,
                content = EXCLUDED.content,
                file_size = EXCLUDED.file_size,
                duration_seconds = EXCLUDED.duration_seconds,
                audio_format = EXCLUDED.audio_format,
                ocr_status = 'skipped',
                updated_at = now()
            RETURNING id
        """, (
            metadata['title'],
            metadata.get('date'),
            metadata.get('participants', []),
            tags,
            content if content else None,
            file_path,
            file_size,
            duration_seconds,
            audio_format,
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


def copy_audio_to_output(zip_file, zip_info, output_dir: str) -> str:
    """Copia audio del ZIP al directorio de nginx, manteniendo estructura."""
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


# ---- Main processing ----

def process_zip(zip_path: str, conn, groq_key: str, dry_run: bool = False,
                copy_audio: bool = True):
    """Procesa archivos de audio de un ZIP."""
    tmp_dir = '/tmp/libra_audio'
    os.makedirs(tmp_dir, exist_ok=True)

    with zipfile.ZipFile(zip_path, 'r') as zf:
        # Filtrar archivos de audio
        entries = []
        for info in zf.infolist():
            if info.is_dir() or info.file_size == 0:
                continue
            if should_exclude(info.filename):
                continue
            ext = Path(info.filename).suffix.lower()
            if ext not in AUDIO_EXTENSIONS:
                continue
            entries.append(info)

        # Ordenar por tamano (chicos primero)
        entries.sort(key=lambda e: e.file_size)

        total = len(entries)
        print(f"\nArchivos de audio encontrados: {total}")

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
            skipped_big = 0
            for e in entries:
                size_kb = e.file_size / 1024
                persons = match_person_in_path(e.filename)
                person_str = f" -> {', '.join(persons)}" if persons else ""
                too_big = " [SKIP: >25MB]" if e.file_size > MAX_AUDIO_SIZE else ""
                if too_big:
                    skipped_big += 1
                print(f"  {size_kb:8.1f} KB  {e.filename}{person_str}{too_big}")
            if skipped_big:
                print(f"\n  {skipped_big} archivos exceden 25MB (limite Whisper API)")
            return

        # Load caches
        person_cache = get_person_id_cache(conn)
        processed = get_processed_files(conn)
        pending = [e for e in entries if e.filename not in processed]
        print(f"Ya procesados: {total - len(pending)}, pendientes: {len(pending)}")

        if not pending:
            print("Nada que procesar.")
            return

        if copy_audio:
            os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)

        success = 0
        errors = 0
        skipped = 0
        total_duration = 0

        for i, info in enumerate(pending, 1):
            ext = Path(info.filename).suffix.lower()
            audio_format = ext.lstrip('.')

            # Skip files too large for Whisper API
            if info.file_size > MAX_AUDIO_SIZE:
                skipped += 1
                if skipped <= 5:
                    print(f"  SKIP [{i}/{len(pending)}] >25MB: {info.filename}")
                continue

            try:
                # Extract to temp
                tmp_path = os.path.join(tmp_dir, os.path.basename(info.filename))
                with zf.open(info.filename) as src, open(tmp_path, 'wb') as dst:
                    shutil.copyfileobj(src, dst)

                # Transcribe
                transcription, duration = transcribe_audio(tmp_path, groq_key)
                if duration:
                    total_duration += duration

                # Parse metadata
                metadata = parse_metadata_from_path(info.filename)

                # Copy audio to nginx dir
                if copy_audio:
                    try:
                        copy_audio_to_output(zf, info, AUDIO_OUTPUT_DIR)
                    except Exception as e_copy:
                        print(f"  WARN: no se pudo copiar {info.filename}: {e_copy}", file=sys.stderr)

                # Upsert
                doc_id = upsert_audio_document(
                    conn=conn,
                    file_path=info.filename,
                    metadata=metadata,
                    content=transcription,
                    file_size=info.file_size,
                    duration_seconds=duration,
                    audio_format=audio_format,
                )

                # Link persons
                matched_persons = match_person_in_path(info.filename)
                if matched_persons and doc_id:
                    link_persons(conn, doc_id, matched_persons, person_cache)

                success += 1

                # Progress
                if i % 50 == 0 or i == len(pending):
                    dur_h = total_duration / 3600
                    print(f"  [{i}/{len(pending)}] OK: {success} | Err: {errors} | Skip: {skipped} | Duracion total: {dur_h:.1f}h")

                # Rate limit
                time.sleep(REQUEST_DELAY)

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

                # Still rate limit on errors
                time.sleep(REQUEST_DELAY)

            finally:
                try:
                    if os.path.exists(tmp_path):
                        os.remove(tmp_path)
                except Exception:
                    pass

        dur_h = total_duration / 3600
        print(f"\n=== RESUMEN ===")
        print(f"Procesados: {success}")
        print(f"Errores: {errors}")
        print(f"Saltados (>25MB): {skipped}")
        print(f"Duracion total transcripta: {dur_h:.1f} horas")

    try:
        shutil.rmtree(tmp_dir, ignore_errors=True)
    except Exception:
        pass


def main():
    parser = argparse.ArgumentParser(description='Libra — Ingesta de audio con transcripcion Groq Whisper')
    parser.add_argument('--zip', required=True, help='Path al archivo ZIP')
    parser.add_argument('--db-password', required=True, help='Password de supabase_admin')
    parser.add_argument('--groq-key', required=True, help='Groq API key')
    parser.add_argument('--db-host', default='192.168.1.14', help='Host de PostgreSQL')
    parser.add_argument('--db-port', type=int, default=54329, help='Puerto de PostgreSQL')
    parser.add_argument('--dry-run', action='store_true', help='Solo listar archivos, no procesar')
    parser.add_argument('--no-copy-audio', action='store_true', help='No copiar audios al directorio de nginx')
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
        process_zip(args.zip, conn, args.groq_key, args.dry_run, not args.no_copy_audio)
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    main()
