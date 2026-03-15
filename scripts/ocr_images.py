"""
OCR images using OpenAI Vision API.
Processes pending images and extracts text descriptions.

Usage:
  source venv/bin/activate
  python scripts/ocr_images.py
"""
import os
import sys
import time
import base64
import psycopg2
import requests

OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
if not OPENAI_API_KEY:
    for line in open('/home/diego/Documents/libra/.env'):
        if line.startswith('OPENAI_API_KEY='):
            OPENAI_API_KEY = line.split('=', 1)[1].strip()

DOC_ROOT = '/home/diego/Documents/libra/documents/'
DB_PASSWORD = 'c54b971e11cfaa8ee03bfe9cd3b1e88cc24bc23c2063528a1b7362f55416b41f'
MAX_PER_RUN = 500  # Cost control
DELAY = 0.5
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB max for Vision API

SUPPORTED_EXTS = {'.jpg', '.jpeg', '.png', '.webp'}

def describe_image(filepath):
    """Use OpenAI Vision to extract text and describe image."""
    ext = os.path.splitext(filepath)[1].lower()
    mime = {'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'webp': 'image/webp'}
    media_type = mime.get(ext.lstrip('.'), 'image/jpeg')

    with open(filepath, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode()

    resp = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers={'Authorization': f'Bearer {OPENAI_API_KEY}', 'Content-Type': 'application/json'},
        json={
            'model': 'gpt-4o-mini',
            'messages': [{
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': 'Describe esta imagen en español. Si tiene texto, transcribilo textualmente. Si es un screenshot de un chat, indicá quién dice qué. Si es una planilla, describí los datos. Si es una foto, describí qué se ve. Sé conciso pero completo.'},
                    {'type': 'image_url', 'image_url': {'url': f'data:{media_type};base64,{b64}', 'detail': 'auto'}}
                ]
            }],
            'max_tokens': 1500,
        },
        timeout=30
    )
    if resp.ok:
        return resp.json()['choices'][0]['message']['content']
    return None

def main():
    conn = psycopg2.connect(host='localhost', port=54329, dbname='postgres',
                            user='supabase_admin', password=DB_PASSWORD)
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute("""
        SELECT id, file_path FROM documents
        WHERE doc_type = 'imagen' AND ocr_status = 'skipped'
        AND content IS NULL
        ORDER BY random()
        LIMIT %s
    """, (MAX_PER_RUN,))
    pending = cur.fetchall()
    print(f'Images to process: {len(pending)}')

    done = 0
    errors = 0
    skipped = 0
    for doc_id, file_path in pending:
        full_path = os.path.join(DOC_ROOT, file_path)
        ext = os.path.splitext(file_path)[1].lower()

        if not os.path.exists(full_path):
            cur.execute("UPDATE documents SET ocr_status = 'file_missing' WHERE id = %s", (doc_id,))
            continue

        if ext not in SUPPORTED_EXTS:
            cur.execute("UPDATE documents SET ocr_status = 'unsupported' WHERE id = %s", (doc_id,))
            skipped += 1
            continue

        if os.path.getsize(full_path) > MAX_FILE_SIZE:
            cur.execute("UPDATE documents SET ocr_status = 'too_large' WHERE id = %s", (doc_id,))
            skipped += 1
            continue

        if os.path.getsize(full_path) < 1000:  # < 1KB probably broken
            cur.execute("UPDATE documents SET ocr_status = 'too_small' WHERE id = %s", (doc_id,))
            skipped += 1
            continue

        try:
            text = describe_image(full_path)
            if text and len(text.strip()) > 5:
                title = text[:57].replace('\n', ' ') + '...' if len(text) > 60 else text.replace('\n', ' ')
                cur.execute(
                    "UPDATE documents SET content = %s, title = %s, ocr_status = 'done' WHERE id = %s",
                    (text, title, doc_id)
                )
                done += 1
            else:
                cur.execute("UPDATE documents SET ocr_status = 'empty' WHERE id = %s", (doc_id,))
        except Exception as e:
            errors += 1
            if 'rate' in str(e).lower() or '429' in str(e):
                print(f'Rate limited after {done}. Resume later.')
                break
            if errors > 20:
                print(f'Too many errors: {e}')
                break

        if done % 50 == 0 and done > 0:
            print(f'  {done} images processed...')

        time.sleep(DELAY)

    print(f'\nDone: {done} described, {skipped} skipped, {errors} errors')

    cur.execute("SELECT count(*) FROM documents WHERE doc_type = 'imagen' AND ocr_status = 'skipped'")
    remaining = cur.fetchone()[0]
    print(f'Remaining: {remaining}')

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
