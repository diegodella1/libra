'use client'
import { useRef, useEffect, useState } from 'react'

export function TimelineDot() {
  const ref = useRef<HTMLSpanElement>(null)
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
      { threshold: 0.5 }
    )
    obs.observe(el)
    return function() { obs.disconnect() }
  }, [])

  return (
    <span ref={ref} className="relative flex shrink-0">
      {visible && (
        <span className="absolute inline-flex h-3 w-3 rounded-full bg-gold-400 opacity-50 animate-ping" />
      )}
      <span className={`relative inline-flex h-3 w-3 rounded-full transition-all duration-500 ${visible ? 'bg-gold-400 scale-100' : 'bg-ink-300 scale-75'}`} />
    </span>
  )
}
