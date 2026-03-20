interface MetricsCardProps {
  readonly label: string
  readonly value: string
}

export function MetricsCard({ label, value }: Readonly<MetricsCardProps>) {
  return (
    <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/5 shadow-[0_4px_24px_rgba(0,0,0,0.1)]">
      <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1">
        {label}
      </div>
      <div className="text-4xl font-black text-primary-container font-headline">
        {value}
      </div>
    </div>
  )
}
