import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { validateRequest } from '@/lib/auth'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = validateRequest(request)
  if (authError) return authError

  const supabase = createClient()

  // Get entity info
  const { data: entity, error: entityError } = await supabase
    .from('entities')
    .select('id, entity_type, value, display_name')
    .eq('id', params.id)
    .single()

  if (entityError || !entity) {
    return NextResponse.json({ error: 'Entidad no encontrada' }, { status: 404 })
  }

  // Get documents via existing RPC
  const { data: docs, error: docsError } = await supabase.rpc('get_entity_documents', {
    ent_uuid: params.id,
  })

  if (docsError) {
    console.error('get_entity_documents error:', docsError)
    return NextResponse.json({ error: 'Error obteniendo documentos' }, { status: 500 })
  }

  return NextResponse.json({ entity, documents: docs || [] })
}
