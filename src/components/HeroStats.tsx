'use client'

import { AnimatedNumber } from '@/components/AnimatedNumber'

const STATS = [
  { value: 4500, prefix: '$', suffix: 'M', label: 'Capitalización pico' },
  { value: 251, prefix: '$', suffix: 'M', label: 'Pérdidas estimadas' },
  { value: 75000, prefix: '', suffix: '', label: 'Afectados' },
  { value: 206, prefix: '', suffix: '', label: 'Llamadas la noche del 14/02' },
]

export function HeroStats() {
  return (
    <div className="flex justify-center gap-8 sm:gap-12 text-center mt-8 pt-4 animate-fade-up delay-400">
      {STATS.map(({ value, prefix, suffix, label }) => (
        <div key={label} className="group cursor-default">
          <p className="text-xl sm:text-2xl font-bold text-gold-400 font-mono transition-transform group-hover:scale-110">
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
          </p>
          <p className="text-[10px] text-ink-500 uppercase tracking-wide font-mono mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}
