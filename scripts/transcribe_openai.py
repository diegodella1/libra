"""
Transcribe pending audio documents using OpenAI Whisper API.
No daily rate limit — only cost (~$0.006/min).

Usage:
  source venv/bin/activate
  python scripts/transcribe_openai.py
  python scripts/transcribe_openai.py --limit 2000
"""
import os
import sys
import time
import argparse
import psycopg2
import requests

OPENAI_API_KEY = ''
for line in open('/home/diego/Documents/libra/.env'):
    if line.startswith('OPENAI_API_KEY='):
        OPENAI_API_KEY = line.split('=', 1)[1].strip()

WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions'
DOC_ROOT = '/home/diego/Documents/libra/documents/'
DB_PASSWORD = 'c54b971e11cfaa8ee03bfe9cd3b1e88cc24bc23c2063528a1b7362f55416b41f'
DELAY = 0.3  # seconds between requests
MAX_FILE_SIZE = 25 * 1024 * 1024

def transcribe(filepath):
    fname = os.path.basename(filepath).replace('.opus', '.ogg')
    with open(filepath, 'rb') as f:
        resp = requests.post(
            WHISPER_URL,
            headers={'Authorization': f'Bearer {OPENAI_API_KEY}'},
            files={'file': (fname, f, 'audio/ogg')},
            data={'model': 'whisper-1', 'language': 'es'},
            timeout=60
        )
    if resp.ok:
        return resp.json().get('text', '').strip()
    if resp.status_code == 429:
        raise Exception('rate_limited')
    return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=8000)
    args = parser.parse_args()

    conn = psycopg2.connect(host='localhost', port=54329, dbname='postgres',
                            user='supabase_admin', password=DB_PASSWORD)
    conn.autocommit = True
    cur = conn.cursor()

    cur.execute("""
        SELECT id, file_path FROM documents
        WHERE doc_type = 'audio' AND ocr_status = 'pending'
        ORDER BY file_path
        LIMIT %s
    """, (args.limit,))
    pending = cur.fetchall()
    print(f'Pending: {len(pending)} audios')

    done = 0
    errors = 0
    for doc_id, file_path in pending:
        full_path = os.path.join(DOC_ROOT, file_path)
        if not os.path.exists(full_path):
            cur.execute("UPDATE documents SET ocr_status = 'file_missing' WHERE id = %s", (doc_id,))
            continue

        if os.path.getsize(full_path) > MAX_FILE_SIZE:
            cur.execute("UPDATE documents SET ocr_status = 'too_large' WHERE id = %s", (doc_id,))
            continue

        if os.path.getsize(full_path) < 100:
            cur.execute("UPDATE documents SET ocr_status = 'too_small' WHERE id = %s", (doc_id,))
            continue

        try:
            text = transcribe(full_path)
            if text and len(text.strip()) > 3:
                title = text[:57] + '...' if len(text) > 60 else text
                cur.execute(
                    "UPDATE documents SET content = %s, title = %s, ocr_status = 'done' WHERE id = %s",
                    (text, title, doc_id)
                )
                done += 1
            else:
                cur.execute("UPDATE documents SET ocr_status = 'empty' WHERE id = %s", (doc_id,))
        except Exception as e:
            if 'rate_limited' in str(e):
                print(f'\nRate limited after {done}. Wait and retry.')
                time.sleep(30)
                continue
            errors += 1
            if errors > 50:
                print(f'Too many errors ({errors}), stopping.')
                break

        if done % 100 == 0 and done > 0:
            print(f'  {done} transcribed...')

        time.sleep(DELAY)

    print(f'\nDone: {done} transcribed, {errors} errors')
    cur.execute("SELECT count(*) FROM documents WHERE doc_type='audio' AND ocr_status='pending'")
    print(f'Remaining: {cur.fetchone()[0]}')
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
