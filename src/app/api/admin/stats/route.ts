import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { verifySession } from '@/lib/admin-auth'

export async function GET() {
  if (!(await verifySession())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createClient()

  const [docs, chunks, ingestion, persons, docPersons] = await Promise.all([
    supabase.from('documents').select('id, doc_type, file_size', { count: 'exact' }),
    supabase.from('document_chunks').select('id', { count: 'exact', head: true }),
    supabase.from('ingestion_log').select('status'),
    supabase.from('persons').select('id, name, role'),
    supabase.from('document_persons').select('person_id'),
  ])

  const docCount = docs.count || 0
  const chunkCount = chunks.count || 0
  const totalSize = (docs.data || []).reduce((sum, d) => sum + (d.file_size || 0), 0)

  const typeBreakdown: Record<string, number> = {}
  for (const d of docs.data || []) {
    typeBreakdown[d.doc_type] = (typeBreakdown[d.doc_type] || 0) + 1
  }

  const ingestionByStatus: Record<string, number> = {}
  for (const i of ingestion.data || []) {
    ingestionByStatus[i.status] = (ingestionByStatus[i.status] || 0) + 1
  }

  // Personas con conteo de documentos vinculados
  const personDocCounts: Record<string, number> = {}
  for (const dp of docPersons.data || []) {
    personDocCounts[dp.person_id] = (personDocCounts[dp.person_id] || 0) + 1
  }

  const personStats = (persons.data || []).map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    docCount: personDocCounts[p.id] || 0,
  })).sort((a, b) => b.docCount - a.docCount)

  return NextResponse.json({
    documents: docCount,
    chunks: chunkCount,
    totalSizeBytes: totalSize,
    typeBreakdown,
    ingestionByStatus,
    persons: personStats,
  })
}
