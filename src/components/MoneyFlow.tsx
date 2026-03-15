'use client'
import { useRef, useEffect, useState } from 'react'

export function MoneyFlow() {
  const ref = useRef<SVGSVGElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      function(entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) { setVisible(true); obs.unobserve(el) }
        }
      },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return function() { obs.disconnect() }
  }, [])

  return (
    <svg ref={ref} viewBox="0 0 400 120" className="w-full max-w-md mx-auto my-6" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
        {visible && (
          <style>{`
            @keyframes flowDot {
              0% { transform: translateX(0); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateX(240px); opacity: 0; }
            }
            .flow-dot { animation: flowDot 2s ease-in-out infinite; }
            .flow-dot:nth-child(2) { animation-delay: 0.4s; }
            .flow-dot:nth-child(3) { animation-delay: 0.8s; }
            .flow-dot:nth-child(4) { animation-delay: 1.2s; }
          `}</style>
        )}
      </defs>

      {/* Left node: 75K Victims */}
      <circle cx="60" cy="60" r="35" fill="none" stroke="#facc15" strokeWidth="2" opacity="0.6" />
      <text x="60" y="55" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#facc15" fontFamily="ui-monospace">75K</text>
      <text x="60" y="70" textAnchor="middle" fontSize="8" fill="#999" fontFamily="ui-sans-serif">victimas</text>

      {/* Right node: Insiders */}
      <circle cx="340" cy="60" r="35" fill="none" stroke="#ef4444" strokeWidth="2" opacity="0.6" />
      <text x="340" y="55" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ef4444" fontFamily="ui-monospace">$100M+</text>
      <text x="340" y="70" textAnchor="middle" fontSize="8" fill="#999" fontFamily="ui-sans-serif">insiders</text>

      {/* Flow line */}
      <line x1="100" y1="60" x2="300" y2="60" stroke="url(#flowGrad)" strokeWidth="1" opacity="0.3" />

      {/* Animated dots flowing from left to right */}
      {visible && (
        <g>
          <circle className="flow-dot" cx="100" cy="60" r="3" fill="#facc15" />
          <circle className="flow-dot" cx="100" cy="60" r="3" fill="#facc15" />
          <circle className="flow-dot" cx="100" cy="60" r="3" fill="#facc15" />
          <circle className="flow-dot" cx="100" cy="60" r="3" fill="#facc15" />
        </g>
      )}

      {/* Arrow */}
      <polygon points="295,55 305,60 295,65" fill="#ef4444" opacity="0.6" />
    </svg>
  )
}
