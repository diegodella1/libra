'use client'

import { useState } from 'react'

interface DateData {
  date: string
  count: number
}

export function DateChart({ data, title }: { data: DateData[]; title: string }) {
  const [hovered, setHovered] = useState<number | null>(null)

  if (data.length === 0) return null

  const maxCount = Math.max(...data.map(d => d.count))
  // Show max 60 most recent dates to avoid overcrowding
  const visible = data.slice(-60)
  const barWidth = Math.max(2, Math.min(12, 540 / visible.length - 1))
  const chartWidth = visible.length * (barWidth + 1) + 60

  return (
    <div className="bg-white rounded-xl border border-ink-200 p-5">
      <h3 className="text-sm font-semibold text-ink-800 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} 200`} className="w-full min-w-[400px]" preserveAspectRatio="xMidYMid meet">
          {/* Y axis grid */}
          {[0.25, 0.5, 0.75, 1].map(frac => (
            <g key={frac}>
              <line x1="50" y1={170 - frac * 150} x2={chartWidth - 10} y2={170 - frac * 150} stroke="#e5e5e5" strokeWidth="0.5" />
              <text x="45" y={170 - frac * 150 + 4} textAnchor="end" fontSize="8" fill="#999" fontFamily="ui-monospace, monospace">
                {Math.round(maxCount * frac)}
              </text>
            </g>
          ))}

          {/* Bars */}
          {visible.map((d, i) => {
            const barH = (d.count / maxCount) * 150
            const bx = 55 + i * (barWidth + 1)
            const isFeb14 = d.date === '2025-02-14' || d.date === '2025-02-13'
            const isHovered = hovered === i
            return (
              <g key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <rect
                  x={bx}
                  y={170 - barH}
                  width={barWidth}
                  height={barH}
                  rx={1}
                  fill={isFeb14 ? '#d4a017' : (isHovered ? '#c4b5a0' : '#d7d7e0')}
                  className="transition-colors duration-150"
                />
                {isHovered && (
                  <>
                    <rect x={bx - 25} y={170 - barH - 22} width={50 + barWidth} height={18} rx={3} fill="#1a1a22" />
                    <text x={bx + barWidth / 2} y={170 - barH - 9} textAnchor="middle" fontSize="9" fill="white" fontFamily="ui-monospace, monospace">
                      {d.date.slice(5)} ({d.count})
                    </text>
                  </>
                )}
              </g>
            )
          })}

          {/* X axis: show a few date labels */}
          {visible.filter((_, i) => i === 0 || i === Math.floor(visible.length / 2) || i === visible.length - 1).map((d, idx) => {
            const i = idx === 0 ? 0 : idx === 1 ? Math.floor(visible.length / 2) : visible.length - 1
            return (
              <text key={d.date} x={55 + i * (barWidth + 1) + barWidth / 2} y="185" textAnchor="middle" fontSize="8" fill="#999" fontFamily="ui-monospace, monospace">
                {d.date.slice(5)}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
