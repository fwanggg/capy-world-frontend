interface BlockerHitterCardsProps {
  readonly mainBlocker: string
  readonly mainBlockerDetail: string
  readonly mainHitter: string
  readonly mainHitterDetail: string
}

export function BlockerHitterCards({
  mainBlocker,
  mainBlockerDetail,
  mainHitter,
  mainHitterDetail,
}: Readonly<BlockerHitterCardsProps>) {
  return (
    <>
      <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/10">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-error">block</span>
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Main Blocker
          </h3>
        </div>
        <div className="text-xl font-headline font-bold text-on-surface mb-2">{mainBlocker}</div>
        <p className="text-sm text-on-surface-variant font-body">{mainBlockerDetail}</p>
      </div>
      <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/10">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-primary-container">bolt</span>
          <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Main Hitter
          </h3>
        </div>
        <div className="text-xl font-headline font-bold text-on-surface mb-2">{mainHitter}</div>
        <p className="text-sm text-on-surface-variant font-body">{mainHitterDetail}</p>
      </div>
    </>
  )
}
