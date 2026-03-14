export interface Document {
  id: string
  title: string | null
  doc_type: 'transcripcion' | 'imagen' | 'otro'
  date: string | null
  participants: string[]
  tags: string[]
  content: string | null
  file_path: string
  file_size: number | null
  page_count: number | null
  ocr_status: string
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

export interface ChatResponse {
  reply: string
  sources: { id: string; title: string; date: string }[]
}
