'use client'

import { useRef, useEffect, useState } from 'react'

interface Props {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export function AnimatedNumber({ value, prefix = '', suffix = '', duration = 1500, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      function(entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting && !started) {
            setStarted(true)
            obs.unobserve(el)
          }
        }
      },
      { threshold: 0.5 }
    )
    obs.observe(el)
    return function() { obs.disconnect() }
  }, [started])

  useEffect(() => {
    if (!started) return
    const start = Date.now()
    function tick() {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [started, value, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}{display.toLocaleString('es-AR')}{suffix}
    </span>
  )
}
