'use client'

import { useState } from 'react'
import Link from 'next/link'

interface EntityInfo {
  id: string
  entity_type: string
  value: string
  display_name: string | null
}

const TYPE_LABELS: Record<string, { singular: string; plural: string; color: string }> = {
  phone: { singular: 'telefono', plural: 'telefonos', color: 'text-blue-600' },
  email: { singular: 'email', plural: 'emails', color: 'text-green-600' },
  crypto_wallet: { singular: 'wallet', plural: 'wallets', color: 'text-amber-600' },
  url: { singular: 'URL', plural: 'URLs', color: 'text-purple-600' },
  organization: { singular: 'organizacion', plural: 'organizaciones', color: 'text-red-600' },
}

export function EntitySummary({ entities }: { entities: EntityInfo[] }) {
  const [expanded, setExpanded] = useState(false)

  if (!entities.length) return null

  // Group by type
  const byType = new Map<string, EntityInfo[]>()
  for (const e of entities) {
    const list = byType.get(e.entity_type) || []
    list.push(e)
    byType.set(e.entity_type, list)
  }

  const summary = Array.from(byType.entries()).map(([type, items]) => {
    const cfg = TYPE_LABELS[type] || { singular: type, plural: type, color: 'text-ink-600' }
    return { type, items, label: items.length === 1 ? cfg.singular : cfg.plural, color: cfg.color, count: items.length }
  })

  return (
    <div className="bg-white rounded-xl border border-ink-200 overflow-hidden mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-ink-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gold-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="text-sm text-ink-700 font-medium">
            {summary.map(s => `${s.count} ${s.label}`).join(', ')}
          </span>
        </div>
        <svg className={`w-4 h-4 text-ink-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-ink-100">
          {summary.map(({ type, items, label, color }) => (
            <div key={type} className="mt-3">
              <h4 className={`text-xs font-semibold uppercase tracking-widest mb-1.5 ${color}`}>{label}</h4>
              <div className="flex flex-wrap gap-1.5">
                {items.map(e => (
                  <Link
                    key={e.id}
                    href={`/entidades?entity=${e.id}`}
                    className="text-xs font-mono px-2 py-1 rounded-full border border-ink-200 bg-ink-50 text-ink-700 hover:border-gold-300 hover:bg-gold-50 transition-colors"
                  >
                    {e.display_name || e.value}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
