"""
Transcribe pending audio documents using Groq Whisper API.
Run daily until all audios are transcribed (2000/day limit).

Usage:
  source venv/bin/activate
  python scripts/transcribe_pending.py
"""
import os
import sys
import time
import psycopg2
import requests

GROQ_API_KEY = os.environ.get('GROQ_API_KEY') or open('/home/diego/Documents/libra/.env').read().split('GROQ_API_KEY=')[1].split('\n')[0]
GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
DOC_ROOT = '/home/diego/Documents/libra/documents/'
DB_PASSWORD = 'c54b971e11cfaa8ee03bfe9cd3b1e88cc24bc23c2063528a1b7362f55416b41f'
MAX_PER_RUN = 1900  # Leave margin for daily limit
DELAY = 1.5  # seconds between requests

def main():
    conn = psycopg2.connect(host='localhost', port=54329, dbname='postgres',
                            user='supabase_admin', password=DB_PASSWORD)
    conn.autocommit = True
    cur = conn.cursor()

    # Get pending audios
    cur.execute("""
        SELECT id, file_path FROM documents
        WHERE doc_type = 'audio' AND ocr_status = 'pending'
        ORDER BY random()
        LIMIT %s
    """, (MAX_PER_RUN,))
    pending = cur.fetchall()
    print(f'Pending audios: {len(pending)}')

    done = 0
    errors = 0
    for doc_id, file_path in pending:
        full_path = os.path.join(DOC_ROOT, file_path)
        if not os.path.exists(full_path):
            cur.execute("UPDATE documents SET ocr_status = 'file_missing' WHERE id = %s", (doc_id,))
            continue

        # Skip files > 25MB
        if os.path.getsize(full_path) > 25 * 1024 * 1024:
            cur.execute("UPDATE documents SET ocr_status = 'too_large' WHERE id = %s", (doc_id,))
            continue

        try:
            with open(full_path, 'rb') as f:
                resp = requests.post(
                    GROQ_URL,
                    headers={'Authorization': f'Bearer {GROQ_API_KEY}'},
                    files={'file': (os.path.basename(full_path), f, 'audio/ogg')},
                    data={'model': 'whisper-large-v3', 'language': 'es'},
                    timeout=60
                )

            if resp.status_code == 429:
                print(f'\nRate limited after {done} transcriptions. Resume tomorrow.')
                break

            if resp.ok:
                text = resp.json().get('text', '').strip()
                if text:
                    # Update content and title
                    title = text[:57] + '...' if len(text) > 60 else text
                    cur.execute(
                        "UPDATE documents SET content = %s, title = %s, ocr_status = 'done' WHERE id = %s",
                        (text, title, doc_id)
                    )
                    done += 1
                else:
                    cur.execute("UPDATE documents SET ocr_status = 'empty' WHERE id = %s", (doc_id,))
            else:
                errors += 1
                if errors > 10:
                    print(f'Too many errors, stopping. Last: {resp.text[:100]}')
                    break

        except Exception as e:
            errors += 1
            print(f'  Error: {e}')

        if done % 100 == 0 and done > 0:
            print(f'  Transcribed {done}...')

        time.sleep(DELAY)

    print(f'\nDone: {done} transcribed, {errors} errors')

    # Show remaining
    cur.execute("SELECT count(*) FROM documents WHERE doc_type = 'audio' AND ocr_status = 'pending'")
    remaining = cur.fetchone()[0]
    print(f'Remaining: {remaining} pending')

    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
