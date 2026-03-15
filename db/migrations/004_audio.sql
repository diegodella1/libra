-- 004_audio.sql — Soporte para documentos de audio (transcripciones de mensajes de voz, llamadas, Zoom)

ALTER TABLE documents ADD COLUMN IF NOT EXISTS duration_seconds INT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS audio_format TEXT;
