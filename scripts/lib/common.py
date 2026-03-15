"""
Libra — Shared constants, helpers and DB functions for all scripts.
"""

import os
import re
from pathlib import Path

import psycopg2

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

KNOWN_PERSONS = {
    'Javier Milei': ['Milei', 'Javier Milei'],
    'Karina Milei': ['KARINA MILEI RRPP', 'Karina Milei', 'KARINA MILEI'],
    'Manuel Terrones Godoy': ['Manu Terrones Godoy', 'Manu Terrones', 'Manuel Terrones'],
    'Sergio Daniel Morales': ['Sergio Crypto City', 'Sergio Morales'],
    'Hayden Mark Davis': ['Hayden Davis', 'Hayden'],
    'Mauricio Novelli': ['Novelli'],
    'Julian Peh': ['Julian Peh kIP', 'Julian Peh KIP', 'Julian Peh'],
    'Charles Hoskinson': ['Hoskinson'],
}

EXCLUDE_PATTERNS = [
    '/icons/', '/__MACOSX/', '/._', '.DS_Store',
    '/party_photos/', '/resources/', '.thumb', '/instant_messages/',
]

MONTHS_ES = {
    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
    'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
}

ROMAN_MAP = {
    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5, 'vi': 6, 'vii': 7,
    'viii': 8, 'ix': 9, 'x': 10, 'xi': 11, 'xii': 12, 'xiii': 13, 'xiv': 14,
}

# ---------------------------------------------------------------------------
# Pure helpers
# ---------------------------------------------------------------------------


def should_exclude(file_path: str) -> bool:
    """Determina si un archivo debe ser excluido."""
    for pattern in EXCLUDE_PATTERNS:
        if pattern in file_path:
            return True
    basename = os.path.basename(file_path)
    if basename.startswith('.'):
        return True
    return False


def parse_roman(s: str) -> int | None:
    """Convierte numeral romano a entero."""
    return ROMAN_MAP.get(s.lower().strip())


def infer_doc_type_from_path(file_path: str) -> str | None:
    """Infiere doc_type semantico de la ruta."""
    path_lower = file_path.lower()
    if '/llamadas/' in path_lower:
        return 'llamadas'
    if any(p in path_lower for p in ['/conversaciones/', '/whatsapp/', '/instagram/', '/telegram/']):
        return 'conversacion'
    # Punto I = RRSS
    punto_match = re.search(r'punto[_\s-]*(i)(?:/|\\)', path_lower)
    if punto_match and parse_roman(punto_match.group(1)) == 1:
        return 'rrss'
    if '/imagen forense' in path_lower or '/imagen_forense' in path_lower:
        return 'forense'
    return None


def extract_platform_from_path(file_path: str) -> str | None:
    """Extrae plataforma de comunicacion del path."""
    path_lower = file_path.lower()
    for platform in ['whatsapp', 'telegram', 'instagram']:
        if platform in path_lower:
            return platform
    return None


def extract_person_from_path(file_path: str) -> str | None:
    """
    Extrae nombre de persona del path.
    Busca patrones como 'Punto X/<Nombre>/...' donde Nombre parece un nombre propio.
    """
    parts = Path(file_path).parts
    for i, part in enumerate(parts):
        if re.match(r'(?i)punto[_\s-]', part) and i + 1 < len(parts):
            candidate = parts[i + 1]
            if re.match(r'(?i)(punto|efecto|\d{2,4}|conversaciones|llamadas|cuentas)', candidate):
                continue
            if len(candidate.split()) >= 2 or any(
                alias.lower() in candidate.lower()
                for person_aliases in KNOWN_PERSONS.values()
                for alias in person_aliases
            ):
                return candidate
    return None


def match_person_in_path(file_path: str) -> list[str]:
    """Devuelve nombres normalizados de personas encontradas en el path."""
    path_lower = file_path.lower()
    matched = []
    for canonical, aliases in KNOWN_PERSONS.items():
        for alias in aliases:
            if alias.lower() in path_lower:
                if canonical not in matched:
                    matched.append(canonical)
                break
    return matched


def parse_metadata_from_path(file_path: str) -> dict:
    """
    Extrae metadata del path del archivo.
    Ejemplo: ANEXOS/Efecto 1/Punto I/Javier Milei/WhatsApp/chat.txt
    """
    parts = Path(file_path).parts
    metadata = {
        'efecto': None,
        'punto': None,
        'date': None,
        'participants': [],
        'title': Path(file_path).stem,
        'platform': extract_platform_from_path(file_path),
        'person_in_path': extract_person_from_path(file_path),
    }

    for part in parts:
        part_lower = part.lower()
        # Buscar efecto
        match = re.match(r'efecto[_\s-]*(\d+)', part_lower)
        if match:
            metadata['efecto'] = f"Efecto {match.group(1)}"
        # Buscar punto (numeral romano O arabigo)
        match = re.match(r'punto[_\s-]*([ivxlcdm]+|\d+)', part_lower)
        if match:
            val = match.group(1)
            num = parse_roman(val) if val.isalpha() else int(val)
            if num:
                metadata['punto'] = f"Punto {num}"

    # Buscar fecha en path completo
    # Formato DD-MM-YYYY al DD-MM-YYYY
    date_match = re.search(r'(\d{1,2})-(\d{1,2})-(\d{4})\s+al\s+(\d{1,2})-(\d{1,2})-(\d{4})', file_path)
    if date_match:
        try:
            d, m, y = int(date_match.group(1)), int(date_match.group(2)), int(date_match.group(3))
            metadata['date'] = f"{y:04d}-{m:02d}-{d:02d}"
        except (ValueError, IndexError):
            pass
    else:
        # Formato "N al N de mes YYYY"
        date_match = re.search(r'(\d{1,2})\s+al\s+\d{1,2}\s+de\s+(\w+)\s+(\d{4})', file_path, re.IGNORECASE)
        if date_match:
            month_name = date_match.group(2).lower()
            if month_name in MONTHS_ES:
                d = int(date_match.group(1))
                m = MONTHS_ES[month_name]
                y = int(date_match.group(3))
                metadata['date'] = f"{y:04d}-{m:02d}-{d:02d}"

    # Fallback: fecha en nombre de archivo
    if not metadata['date']:
        basename = Path(file_path).stem
        date_match = re.search(r'(\d{4})-(\d{2})-(\d{2})', basename)
        if date_match:
            metadata['date'] = f"{date_match.group(1)}-{date_match.group(2)}-{date_match.group(3)}"
        else:
            date_match = re.search(r'(\d{2})-(\d{2})-(\d{4})', basename)
            if date_match:
                metadata['date'] = f"{date_match.group(3)}-{date_match.group(2)}-{date_match.group(1)}"

    return metadata


# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------


def get_db_connection(password: str, host: str = '192.168.1.14', port: int = 54329):
    """Conecta a Postgres."""
    return psycopg2.connect(
        host=host,
        port=port,
        dbname='postgres',
        user='supabase_admin',
        password=password,
    )


def get_processed_files(conn) -> set:
    """Obtiene los file_paths ya procesados de ingestion_log."""
    with conn.cursor() as cur:
        cur.execute("SELECT file_path FROM ingestion_log WHERE status IN ('indexed', 'ocr')")
        return {row[0] for row in cur.fetchall()}


def get_person_id_cache(conn) -> dict[str, str]:
    """Carga cache nombre_lower -> person_id para vincular documentos."""
    cache = {}
    with conn.cursor() as cur:
        cur.execute("SELECT id, name, aliases FROM persons")
        for row in cur.fetchall():
            pid, name, aliases = row
            cache[name.lower()] = str(pid)
            if aliases:
                for alias in aliases:
                    cache[alias.lower()] = str(pid)
    return cache


def link_persons(conn, doc_id: str, person_names: list[str], person_cache: dict[str, str]):
    """Vincula un documento con personas en document_persons. Devuelve cantidad de links creados."""
    if not doc_id or not person_names:
        return 0
    linked = 0
    with conn.cursor() as cur:
        for name in person_names:
            pid = person_cache.get(name.lower())
            if pid:
                cur.execute("""
                    INSERT INTO document_persons (document_id, person_id)
                    VALUES (%s, %s)
                    ON CONFLICT DO NOTHING
                """, (doc_id, pid))
                linked += cur.rowcount
    conn.commit()
    return linked


def log_error(conn, file_path: str, error_msg: str):
    """Registra un error en ingestion_log."""
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO ingestion_log (file_path, status, error_message, completed_at)
            VALUES (%s, 'error', %s, now())
            ON CONFLICT (file_path) DO UPDATE SET
                status = 'error',
                error_message = EXCLUDED.error_message,
                completed_at = now()
        """, (file_path, error_msg[:500]))
    conn.commit()
