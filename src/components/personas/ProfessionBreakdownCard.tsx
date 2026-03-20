interface ProfessionItem {
  readonly label: string
  readonly count: string
}

interface ProfessionBreakdownCardProps {
  readonly items: readonly ProfessionItem[]
}

export function ProfessionBreakdownCard({ items }: Readonly<ProfessionBreakdownCardProps>) {
  return (
    <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/5">
      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">work</span>
        Profession
      </h3>
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
