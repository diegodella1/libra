'use client'

import { useRef, useEffect, useState } from 'react'

export function PriceChart() {
  const ref = useRef<SVGSVGElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            setVisible(true)
            obs.unobserve(el)
          }
        }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return function () { obs.disconnect() }
  }, [])

  const points = [
    { min: 0, price: 0 },
    { min: 5, price: 0.50 },
    { min: 15, price: 1.80 },
    { min: 25, price: 3.40 },
    { min: 35, price: 4.80 },
    { min: 40, price: 5.20 },
    { min: 50, price: 3.10 },
    { min: 70, price: 1.50 },
    { min: 100, price: 0.80 },
    { min: 140, price: 0.30 },
    { min: 180, price: 0.15 },
  ]

  const x = (min: number) => (min / 180) * 540 + 40
  const y = (price: number) => 250 - (price / 5.5) * 220

  const linePoints = points.map(p => `${x(p.min)},${y(p.price)}`).join(' ')
  const areaPoints = linePoints + ` ${x(180)},${y(0)} ${x(0)},${y(0)}`
  const peakX = x(40)
  const peakY = y(5.20)

  // Approximate total line length for stroke-dasharray
  const totalLength = 900

  return (
    <svg
      ref={ref}
      viewBox="0 0 600 280"
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#facc15" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#facc15" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <style>{`
        @keyframes drawLine {
          from { stroke-dashoffset: ${totalLength}; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeInArea {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInLabel {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chart-line {
          stroke-dasharray: ${totalLength};
          stroke-dashoffset: ${totalLength};
        }
        .chart-line.visible {
          animation: drawLine 2s ease-out forwards;
        }
        .chart-area {
          opacity: 0;
        }
        .chart-area.visible {
          animation: fadeInArea 0.8s ease-out 1.8s forwards;
        }
        .chart-label {
          opacity: 0;
        }
        .chart-label.visible {
          animation: fadeInLabel 0.5s ease-out 2.2s forwards;
        }
      `}</style>

      {/* Grid lines */}
      {[1, 2, 3, 4, 5].map(v => (
        <g key={v}>
          <line x1="40" y1={y(v)} x2="580" y2={y(v)} stroke="#e5e5e5" strokeWidth="0.5" />
          <text x="32" y={y(v) + 4} textAnchor="end" fontSize="10" fill="#999" fontFamily="ui-monospace, monospace">${v}</text>
        </g>
      ))}

      {/* Area fill */}
      <polygon
        points={areaPoints}
        fill="url(#priceGrad)"
        className={`chart-area${visible ? ' visible' : ''}`}
      />

      {/* Price line */}
      <polyline
        points={linePoints}
        fill="none"
        stroke="#d4a017"
        strokeWidth="2.5"
        strokeLinejoin="round"
        className={`chart-line${visible ? ' visible' : ''}`}
      />

      {/* Vertical dashed line at peak */}
      <line
        x1={peakX} y1={peakY} x2={peakX} y2={y(0)}
        stroke="#d4a017" strokeWidth="1" strokeDasharray="4,4" opacity="0.5"
        className={`chart-label${visible ? ' visible' : ''}`}
      />

      {/* Peak dot and label */}
      <circle
        cx={peakX} cy={peakY} r="4" fill="#d4a017"
        className={`chart-label${visible ? ' visible' : ''}`}
      />
      <text
        x={peakX} y={peakY - 14} textAnchor="middle" fontSize="13" fontWeight="bold" fill="#422006"
        fontFamily="ui-monospace, monospace"
        className={`chart-label${visible ? ' visible' : ''}`}
      >$5.20</text>
      <text
        x={peakX} y={peakY - 28} textAnchor="middle" fontSize="9" fill="#8b7355"
        className={`chart-label${visible ? ' visible' : ''}`}
      >Pico</text>

      {/* Crash label */}
      <text
        x={x(150)} y={y(0.15) - 10} textAnchor="middle" fontSize="11" fontWeight="bold" fill="#991b1b"
        fontFamily="ui-monospace, monospace"
        className={`chart-label${visible ? ' visible' : ''}`}
      >$0.15</text>

      {/* "Insiders venden" label */}
      <text
        x={peakX + 8} y={y(2.5)} fontSize="9" fill="#8b7355"
        transform={`rotate(90, ${peakX + 8}, ${y(2.5)})`}
        className={`chart-label${visible ? ' visible' : ''}`}
      >Insiders venden</text>

      {/* X axis labels */}
      <text x={x(0)} y="275" textAnchor="middle" fontSize="10" fill="#999" fontFamily="ui-monospace, monospace">0 min</text>
      <text x={x(40)} y="275" textAnchor="middle" fontSize="10" fill="#999" fontFamily="ui-monospace, monospace">40 min</text>
      <text x={x(60)} y="275" textAnchor="middle" fontSize="10" fill="#999" fontFamily="ui-monospace, monospace">1 hora</text>
      <text x={x(180)} y="275" textAnchor="middle" fontSize="10" fill="#999" fontFamily="ui-monospace, monospace">3 horas</text>
    </svg>
  )
}
