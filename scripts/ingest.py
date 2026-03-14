"""
Libra — Pipeline de ingesta de documentos.

Uso:
  python scripts/ingest.py --dir ./documents --batch-size 50

Requiere:
  pip install pytesseract Pillow psycopg2-binary PyPDF2

Proceso:
  1. Escanea directorio de documentos
  2. Registra archivos nuevos en ingestion_log
  3. Extrae texto (PDF nativo o OCR para scans/imágenes)
  4. Carga documento a tabla documents
  5. Genera chunks para embeddings (fase posterior)
"""

import os
import sys
import argparse
import hashlib
from pathlib import Path
from datetime import datetime

# TODO: implementar cuando tengamos samples
# - Detectar si PDF tiene texto extraíble o es scan
# - OCR con Tesseract para scans/JPGs
# - Extracción de metadata (fecha, participantes) del nombre de archivo o contenido
# - Carga a Supabase
# - Tracking de progreso en ingestion_log


def scan_directory(base_dir: str) -> list[Path]:
    """Encuentra todos los PDFs y JPGs en el directorio."""
    extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.tiff'}
    files = []
    for root, _, filenames in os.walk(base_dir):
        for fname in filenames:
            if Path(fname).suffix.lower() in extensions:
                files.append(Path(root) / fname)
    return sorted(files)


def detect_text_type(pdf_path: Path) -> str:
    """Determina si un PDF tiene texto extraíble o es un scan."""
    try:
        from PyPDF2 import PdfReader
        reader = PdfReader(str(pdf_path))
        # Revisar primeras 3 páginas
        for page in reader.pages[:3]:
            text = page.extract_text() or ''
            if len(text.strip()) > 50:
                return 'text'  # Tiene texto nativo
        return 'scan'  # Probablemente un scan
    except Exception:
        return 'unknown'


def extract_text_pdf(pdf_path: Path) -> str:
    """Extrae texto de un PDF con texto nativo."""
    from PyPDF2 import PdfReader
    reader = PdfReader(str(pdf_path))
    pages = []
    for page in reader.pages:
        text = page.extract_text() or ''
        pages.append(text)
    return '\n\n'.join(pages)


def ocr_file(file_path: Path) -> str:
    """OCR de un archivo (imagen o PDF scan)."""
    import pytesseract
    from PIL import Image

    suffix = file_path.suffix.lower()
    if suffix in {'.jpg', '.jpeg', '.png', '.tiff'}:
        img = Image.open(file_path)
        return pytesseract.image_to_string(img, lang='spa')
    elif suffix == '.pdf':
        # TODO: convertir páginas de PDF a imágenes y OCR cada una
        # Requiere pdf2image (poppler)
        raise NotImplementedError('OCR de PDF scans pendiente — requiere pdf2image')
    return ''


def main():
    parser = argparse.ArgumentParser(description='Libra — Ingesta de documentos')
    parser.add_argument('--dir', required=True, help='Directorio con documentos')
    parser.add_argument('--batch-size', type=int, default=50, help='Archivos por batch')
    parser.add_argument('--dry-run', action='store_true', help='Solo listar archivos, no procesar')
    args = parser.parse_args()

    base_dir = Path(args.dir)
    if not base_dir.exists():
        print(f'Error: directorio {base_dir} no existe')
        sys.exit(1)

    files = scan_directory(str(base_dir))
    print(f'Encontrados {len(files)} archivos')

    if args.dry_run:
        for f in files:
            print(f'  {f.suffix.upper():6s} {f.relative_to(base_dir)}')
        return

    # TODO: conectar a Supabase y procesar
    print('Ingesta no implementada aún — esperando samples para definir pipeline')


if __name__ == '__main__':
    main()
