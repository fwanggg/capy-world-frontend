interface SegmentGrowthCardProps {
  readonly text: string
}

const BAR_COUNT = 10

export function SegmentGrowthCard({ text }: Readonly<SegmentGrowthCardProps>) {
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => 30 + (i * 7) % 70)
  return (
    <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em]">
          Segment Growth Rate
        </h3>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary-container/10 text-primary-container text-[10px] font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-xs">monitoring</span>
          Live Stream Detection
        </span>
      </div>
      <p className="text-on-surface font-body leading-relaxed text-sm mb-4">{text}</p>
      <div className="flex items-end gap-1 h-16">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-primary-container/40 rounded-t min-w-[4px]"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  )
}
