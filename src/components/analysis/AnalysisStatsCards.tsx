interface AnalysisStatsCardsProps {
  readonly avgAge: number
  readonly genderSplit: string
  readonly topHub: string
  readonly yesPct: number
}

/** Format avg age like Stitch: 32.4 */
function formatAvgAge(n: number): string {
  return n.toFixed(1)
}

export function AnalysisStatsCards({
  avgAge,
  genderSplit,
  topHub,
  yesPct,
}: Readonly<AnalysisStatsCardsProps>) {
  return (
    <>
      <div className="p-6 bg-surface-container rounded-xl flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-outline-variant/5">
        <div>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1 block">
            Avg Age
          </span>
          <div className="text-3xl font-headline font-black text-primary-container">{formatAvgAge(avgAge)}</div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
            <div className="h-full bg-primary-container" style={{ width: `${yesPct}%` }} />
          </div>
          <span className="text-[10px] text-on-surface-variant whitespace-nowrap">Gen Z/Mil</span>
        </div>
      </div>
      <div className="p-6 bg-surface-container rounded-xl flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-outline-variant/5">
        <div>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1 block">
            Gender Split
          </span>
          <div className="text-3xl font-headline font-black text-secondary">{genderSplit}</div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[10px] text-on-surface-variant">F / M Segment</span>
        </div>
      </div>
      <div className="p-6 bg-surface-container rounded-xl flex flex-col justify-between shadow-[0_4px_24px_rgba(0,0,0,0.1)] border border-outline-variant/5">
        <div>
          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-1 block">
            Top Hub
          </span>
          <div className="text-2xl font-headline font-black text-on-surface">{topHub}</div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-xs text-primary-container">trending_up</span>
          <span className="text-[10px] text-on-surface-variant">+12% Growth</span>
        </div>
      </div>
    </>
  )
}
