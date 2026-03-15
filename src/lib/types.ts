export interface Document {
  id: string
  title: string | null
  doc_type: 'conversacion' | 'documento' | 'texto' | 'pdf' | 'presentacion' | 'planilla' | 'forense' | 'rrss' | 'llamadas' | 'audio' | 'imagen' | 'transcripcion' | 'otro'
  date: string | null
  participants: string[]
  tags: string[]
  content: string | null
  file_path: string
  file_size: number | null
  page_count: number | null
  ocr_status: string
  duration_seconds: number | null
  audio_format: string | null
  created_at: string
}

export interface SearchResult extends Document {
  snippet: string
  rank: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatEntry {
  role: 'user' | 'assistant'
  content: string
  sources?: { id: string; title: string; date: string }[]
}

export interface ChatResponse {
  reply: string
  sources: { id: string; title: string; date: string }[]
}
