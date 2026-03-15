export function PulseIndicator({ color = 'gold' }: { color?: 'gold' | 'red' | 'green' }) {
  const colors = {
    gold: 'bg-gold-400',
    red: 'bg-red-500',
    green: 'bg-green-500',
  }
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[color]}`} />
    </span>
  )
}
