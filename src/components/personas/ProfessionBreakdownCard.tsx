interface ProfessionItem {
  readonly label: string
  readonly count: string
}

interface ProfessionBreakdownCardProps {
  readonly items: readonly ProfessionItem[]
  readonly totalUnique?: number
}

export function ProfessionBreakdownCard({ items, totalUnique }: Readonly<ProfessionBreakdownCardProps>) {
  return (
    <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/5">
      <div className="flex items-baseline justify-between gap-2 mb-4">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="material-symbols-outlined text-base">work</span>
          Profession
        </h3>
        {totalUnique !== undefined && (
          <span className="text-xs text-on-surface-variant font-body">Top 50 of {totalUnique}</span>
        )}
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <span className="text-on-surface font-body">{item.label}</span>
            <span className="text-primary-container font-bold font-headline tabular-nums">
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
