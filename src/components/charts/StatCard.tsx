export function StatCard({ value, label, context }: { value: string; label: string; context?: string }) {
  return (
    <div className="bg-white rounded-xl border border-ink-200 p-5 text-center">
      <p className="text-2xl sm:text-3xl font-bold text-ink-950 font-mono">{value}</p>
      <p className="text-xs text-ink-500 uppercase tracking-wide font-mono mt-1">{label}</p>
      {context && <p className="text-[11px] text-ink-400 mt-1">{context}</p>}
    </div>
  )
}
