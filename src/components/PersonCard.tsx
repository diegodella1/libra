import Link from 'next/link'

export interface PersonData {
  name: string
  role: string
  searchTerm: string
  docCount: number
}

export function PersonCard({ name, role, searchTerm, docCount }: PersonData) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Link
      href={`/explorador?q=${encodeURIComponent(searchTerm)}`}
      className="flex items-center gap-3 p-3 rounded-lg border border-ink-200 bg-white hover:border-gold-400 hover:bg-gold-50/50 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-sm group"
    >
      <div className="w-10 h-10 rounded-full bg-gold-100 text-gold-800 flex items-center justify-center font-bold text-sm shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-900 group-hover:text-ink-950 truncate">
          {name}
        </p>
        <p className="text-xs text-ink-400 truncate">{role}</p>
      </div>
      {docCount > 0 && (
        <span className="ml-auto text-xs text-ink-400 font-mono shrink-0">
          {docCount}
        </span>
      )}
    </Link>
  )
}
