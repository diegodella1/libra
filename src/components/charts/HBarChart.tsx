'use client'

import { useState } from 'react'

interface HBarData {
  label: string
  value: number
  color?: string
}

export function HBarChart({ data, title }: { data: HBarData[]; title: string }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const maxVal = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="bg-white rounded-xl border border-ink-200 p-5">
      <h3 className="text-sm font-semibold text-ink-800 mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 group cursor-default"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="text-xs text-ink-600 w-28 truncate text-right shrink-0" title={item.label}>
              {item.label}
            </span>
            <div className="flex-1 bg-ink-50 rounded-full h-5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(item.value / maxVal) * 100}%`,
                  backgroundColor: item.color || (hovered === i ? '#d4a017' : '#facc15'),
                }}
              />
            </div>
            <span className="text-xs font-mono text-ink-500 w-10 text-right shrink-0">
              {item.value.toLocaleString('es-AR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
