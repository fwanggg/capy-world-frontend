interface AgeGroup {
  readonly label: string
  readonly count: number
}

interface AgeGroupsCardProps {
  readonly groups: readonly AgeGroup[]
}

export function AgeGroupsCard({ groups }: Readonly<AgeGroupsCardProps>) {
  return (
    <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/5">
      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">calendar_month</span>
        Age Groups
      </h3>
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.label} className="flex items-center justify-between gap-4">
            <span className="text-on-surface font-body text-sm">{group.label}</span>
            <span className="text-primary-container font-bold font-headline tabular-nums text-sm">
              {group.count.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
