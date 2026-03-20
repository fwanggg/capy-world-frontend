interface AgeGroupsCardProps {
  readonly groups: readonly string[]
}

export function AgeGroupsCard({ groups }: Readonly<AgeGroupsCardProps>) {
  return (
    <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/5">
      <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">calendar_month</span>
        Age Groups
      </h3>
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => (
          <span
            key={group}
            className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface font-body text-sm"
          >
            {group}
          </span>
        ))}
      </div>
    </div>
  )
}
