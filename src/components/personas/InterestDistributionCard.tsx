interface InterestItem {
  readonly label: string
  readonly percent: number
}

interface InterestDistributionCardProps {
  readonly items: readonly InterestItem[]
}

export function InterestDistributionCard({ items }: Readonly<InterestDistributionCardProps>) {
  return (
    <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/5">
      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">insights</span>
        Interests
      </h3>
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
