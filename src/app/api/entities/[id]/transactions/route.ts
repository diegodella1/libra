import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { validateRequest } from '@/lib/auth'

// Detect blockchain from address format
function detectChain(address: string): 'solana' | 'bitcoin' | 'unknown' {
  // Solana: base58, 32-44 chars, starts with uppercase or number
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address) && address.length >= 32) {
    // Bitcoin addresses start with 1, 3, or bc1
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return 'bitcoin'
    if (/^bc1[a-z0-9]{25,90}$/.test(address)) return 'bitcoin'
    return 'solana'
  }
  if (/^0x[0-9a-fA-F]{40}$/.test(address)) return 'unknown' // ETH not supported yet
  return 'unknown'
}

interface NormalizedTx {
  hash: string
  timestamp: number | null
  date: string | null
  success: boolean
  chain: string
  explorerUrl: string
}

const SOLANA_RPC = 'https://api.mainnet-beta.solana.com'

async function fetchSolanaTransactions(
  address: string,
  fromDate: string | null,
  toDate: string | null,
  limit: number,
): Promise<{ transactions: NormalizedTx[]; total: number; chain: 'solana' }> {
  // getSignaturesForAddress returns recent signatures with blockTime
  const resp = await fetch(SOLANA_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getSignaturesForAddress',
      params: [address, { limit: 1000 }],
    }),
  })

  if (!resp.ok) {
    throw new Error(`Solana RPC error: ${resp.status}`)
  }

  const data = await resp.json()
  if (data.error) {
    throw new Error(data.error.message || 'Solana RPC error')
  }

  const sigs: { signature: string; blockTime: number | null; err: unknown; memo: string | null }[] = data.result || []

  // Filter by date range
  const fromTs = fromDate ? new Date(fromDate + 'T00:00:00Z').getTime() / 1000 : null
  const toTs = toDate ? new Date(toDate + 'T23:59:59Z').getTime() / 1000 : null

  const filtered = sigs.filter(s => {
    if (!s.blockTime) return false
    if (fromTs && s.blockTime < fromTs) return false
    if (toTs && s.blockTime > toTs) return false
    return true
  })

  const transactions: NormalizedTx[] = filtered.slice(0, limit).map(s => ({
    hash: s.signature,
    timestamp: s.blockTime,
    date: s.blockTime ? new Date(s.blockTime * 1000).toISOString().slice(0, 10) : null,
    success: s.err === null,
    chain: 'solana',
    explorerUrl: `https://solscan.io/tx/${s.signature}`,
  }))

  return { transactions, total: filtered.length, chain: 'solana' }
}

async function fetchBitcoinTransactions(
  address: string,
  fromDate: string | null,
  toDate: string | null,
  limit: number,
): Promise<{ transactions: NormalizedTx[]; total: number; chain: 'bitcoin' }> {
  const resp = await fetch(`https://blockstream.info/api/address/${address}/txs`)

  if (!resp.ok) {
    throw new Error(`Blockstream API error: ${resp.status}`)
  }

  const txs: { txid: string; status: { confirmed: boolean; block_time?: number } }[] = await resp.json()

  const fromTs = fromDate ? new Date(fromDate + 'T00:00:00Z').getTime() / 1000 : null
  const toTs = toDate ? new Date(toDate + 'T23:59:59Z').getTime() / 1000 : null

  const filtered = txs.filter(tx => {
    const bt = tx.status.block_time
    if (!bt) return !fromTs && !toTs // unconfirmed: show only if no date filter
    if (fromTs && bt < fromTs) return false
    if (toTs && bt > toTs) return false
    return true
  })

  const transactions: NormalizedTx[] = filtered.slice(0, limit).map(tx => ({
    hash: tx.txid,
    timestamp: tx.status.block_time || null,
    date: tx.status.block_time ? new Date(tx.status.block_time * 1000).toISOString().slice(0, 10) : null,
    success: tx.status.confirmed,
    chain: 'bitcoin',
    explorerUrl: `https://blockstream.info/tx/${tx.txid}`,
  }))

  return { transactions, total: filtered.length, chain: 'bitcoin' }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const authError = validateRequest(request)
  if (authError) return authError

  const supabase = createClient()
  const { data: entity, error } = await supabase
    .from('entities')
    .select('id, entity_type, value')
    .eq('id', params.id)
    .single()

  if (error || !entity || entity.entity_type !== 'crypto_wallet') {
    return NextResponse.json({ error: 'Wallet no encontrada' }, { status: 404 })
  }

  const { searchParams } = request.nextUrl
  const fromDate = searchParams.get('from') || null
  const toDate = searchParams.get('to') || null
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))

  const chain = detectChain(entity.value)

  try {
    if (chain === 'solana') {
      const result = await fetchSolanaTransactions(entity.value, fromDate, toDate, limit)
      return NextResponse.json({
        ...result,
        address: entity.value,
        explorerUrl: `https://solscan.io/account/${entity.value}`,
      })
    }

    if (chain === 'bitcoin') {
      const result = await fetchBitcoinTransactions(entity.value, fromDate, toDate, limit)
      return NextResponse.json({
        ...result,
        address: entity.value,
        explorerUrl: `https://blockstream.info/address/${entity.value}`,
      })
    }

    return NextResponse.json({
      error: 'Blockchain no soportada para esta direccion',
      address: entity.value,
      chain: 'unknown',
    }, { status: 400 })
  } catch (err) {
    console.error('Transaction fetch error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Error consultando blockchain',
      address: entity.value,
      chain,
    }, { status: 502 })
  }
}
