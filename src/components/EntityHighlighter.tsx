'use client'

import { useMemo } from 'react'
import Link from 'next/link'

interface EntityMatch {
  id: string
  entity_type: string
  value: string
}

interface Props {
  text: string
  entities: EntityMatch[]
}

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  phone: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  email: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  crypto_wallet: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  url: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  organization: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function EntityHighlighter({ text, entities }: Props) {
  const highlighted = useMemo(() => {
    if (!entities.length) return [{ type: 'text' as const, content: text }]

    // Sort by value length desc (longest match first)
    const sorted = [...entities].sort((a, b) => b.value.length - a.value.length)

    // Build combined regex
    const pattern = sorted.map(e => escapeRegex(e.value)).join('|')
    if (!pattern) return [{ type: 'text' as const, content: text }]

    const regex = new RegExp(`(${pattern})`, 'gi')
    const parts: { type: 'text' | 'entity'; content: string; entity?: EntityMatch }[] = []
    let lastIndex = 0

    // Build a lookup for matched values (case-insensitive)
    const valueLookup = new Map<string, EntityMatch>()
    for (const e of sorted) {
      valueLookup.set(e.value.toLowerCase(), e)
    }

    let match: RegExpExecArray | null
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
      }
      const entity = valueLookup.get(match[0].toLowerCase())
      parts.push({ type: 'entity', content: match[0], entity })
      lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.slice(lastIndex) })
    }

    return parts
  }, [text, entities])

  return (
    <>
      {highlighted.map((part, i) => {
        if (part.type === 'text') {
          return <span key={i}>{part.content}</span>
        }
        const colors = TYPE_COLORS[part.entity?.entity_type || ''] || TYPE_COLORS.phone
        return (
          <Link
            key={i}
            href={`/entidades?entity=${part.entity?.id || ''}`}
            className={`inline-block px-1 py-0.5 rounded border text-xs font-mono ${colors.bg} ${colors.text} ${colors.border} hover:opacity-80 transition-opacity no-underline`}
            title={`${part.entity?.entity_type}: ${part.content}`}
          >
            {part.content}
          </Link>
        )
      })}
    </>
  )
}
