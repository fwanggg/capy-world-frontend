interface DemographicsItem {
  readonly label: string
  readonly percent: number
}

interface DemographicsCardProps {
  readonly items: readonly DemographicsItem[]
  readonly footnote?: string
}

export function DemographicsCard({ items, footnote }: Readonly<DemographicsCardProps>) {
  return (
    <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/5">
      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">diversity_3</span>
        Demographics
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4">
            <span className="text-on-surface font-body">{item.label}</span>
            <span className="text-primary-container font-bold font-headline tabular-nums">
              {item.percent}%
            </span>
          </div>
        ))}
      </div>
      {footnote && (
        <p className="mt-4 text-xs text-on-surface-variant font-body">{footnote}</p>
      )}
    </div>
  )
}
