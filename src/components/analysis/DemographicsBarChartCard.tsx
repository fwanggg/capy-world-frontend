'use client'

interface ChartItem {
  readonly label: string
  readonly count: number
}

interface DemographicsBarChartCardProps {
  readonly title: string
  readonly icon: string
  readonly items: readonly ChartItem[]
  readonly total?: number
  readonly footnote?: string
}

/** Teal accent gradient — Stitch design system */
const BAR_COLORS = [
  'hsl(168, 100%, 48%)', // primary-container
  'hsl(168, 85%, 45%)',
  'hsl(168, 70%, 42%)',
  'hsl(168, 55%, 40%)',
  'hsl(168, 45%, 38%)',
]

export function DemographicsBarChartCard({
  title,
  icon,
  items,
  total,
  footnote,
}: Readonly<DemographicsBarChartCardProps>) {
  const sum = total ?? items.reduce((a, i) => a + i.count, 0)
  const maxPct = sum > 0 ? Math.max(...items.map((i) => (i.count / sum) * 100), 1) : 1

  if (items.length === 0) {
    return (
      <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/10">
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary-container">{icon}</span>
          {title}
        </h3>
        <p className="text-sm text-on-surface-variant font-body">No data</p>
      </div>
    )
  }

  return (
    <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/10 hover:border-primary-container/20 transition-colors">
      <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm text-primary-container">{icon}</span>
        {title}
      </h3>
      <div className="space-y-3">
        {items.map((item, i) => {
          const pct = sum > 0 ? (item.count / sum) * 100 : 0
          const barWidth = maxPct > 0 ? (pct / maxPct) * 100 : 0
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex justify-between items-baseline text-sm">
                <span className="font-medium text-on-surface truncate max-w-[70%]">{item.label}</span>
                <span className="text-on-surface-variant tabular-nums shrink-0 ml-2">
                  {pct.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-surface-variant/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(barWidth, 2)}%`,
                    backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
      {footnote && (
        <p className="mt-4 text-xs text-on-surface-variant font-body">{footnote}</p>
      )}
    </div>
  )
}
