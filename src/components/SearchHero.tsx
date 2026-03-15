'use client'

import { useRouter } from 'next/navigation'
import { SearchBar } from '@/components/SearchBar'

const SUGGESTED_CHIPS = [
  'Hayden Davis',
  'noche del 14 de febrero',
  'acuerdo confidencial',
  'llamadas Novelli',
  'Karina Milei',
]

export function SearchHero() {
  const router = useRouter()

  function handleSearch(query: string) {
    router.push(`/explorador?q=${encodeURIComponent(query)}`)
  }

  return (
    <div className="max-w-2xl mx-auto w-full">
      <SearchBar onSearch={handleSearch} />
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {SUGGESTED_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleSearch(chip)}
            className="text-xs border border-ink-200 rounded-full px-3 py-1.5 text-ink-500 hover:border-gold-400 hover:text-gold-800 hover:bg-gold-50 transition-colors"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  )
}
