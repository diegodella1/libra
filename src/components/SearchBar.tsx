'use client'

import { useState } from 'react'

interface SearchBarProps {
  onSearch: (query: string) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim()) onSearch(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar en documentos..."
        className="flex-1 border border-libra-300 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-libra-400 bg-white"
      />
      <button
        type="submit"
        className="bg-libra-950 text-libra-50 px-6 py-3 rounded-lg hover:bg-libra-800 transition-colors"
      >
        Buscar
      </button>
    </form>
  )
}
