interface InterestItem {
  readonly label: string
  readonly percent: number
}

interface InterestDistributionCardProps {
  readonly items: readonly InterestItem[]
  readonly totalUnique?: number
}

export function InterestDistributionCard({ items, totalUnique }: Readonly<InterestDistributionCardProps>) {
  return (
    <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/5">
      <div className="flex items-baseline justify-between gap-2 mb-4">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="material-symbols-outlined text-base">insights</span>
          Interests
        </h3>
        {totalUnique !== undefined && (
          <span className="text-xs text-on-surface-variant font-body">Top 50 of {totalUnique}</span>
        )}
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-on-surface font-body text-sm">{item.label}</span>
              <span className="text-primary-container font-bold font-headline tabular-nums text-sm">
                {item.percent}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-container rounded-full"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
