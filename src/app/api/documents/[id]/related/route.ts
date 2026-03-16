import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { validateRequest } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = validateRequest(request)
  if (authError) return authError

  const supabase = createClient()

  const { data, error } = await supabase.rpc('get_related_documents', {
    doc_uuid: params.id,
    max_results: 10,
  })

  if (error) {
    // Fallback: if RPC not available yet, return empty
    console.error('get_related_documents error:', error.message)
    return NextResponse.json({ documents: [] })
  }

  // Map RPC columns to frontend shape
  const documents = (data || []).map((row: Record<string, unknown>) => ({
    id: row.id,
    title: row.title,
    doc_type: row.doc_type,
    date: row.date,
    file_path: row.file_path,
    file_size: row.file_size,
    link_type: row.link_type,
    strength: row.strength,
    link_metadata: row.link_metadata,
  }))

  return NextResponse.json({ documents })
}
