'use client'

interface AnalysisCardProps {
  readonly title: string
  readonly subtitle?: string
  readonly children: React.ReactNode
  readonly className?: string
  /** If true, content area is scrollable (max-h) */
  readonly scrollable?: boolean
}

/** Unified card structure: title + content. All analysis cards use this for alignment. */
export function AnalysisCard({
  title,
  subtitle,
  children,
  className = '',
  scrollable = false,
}: Readonly<AnalysisCardProps>) {
  return (
    <div
      className={`flex flex-col min-h-0 rounded-xl border border-outline-variant/10 bg-surface-container-low ${className}`}
    >
      <div className="p-6 pb-2 shrink-0">
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-on-surface-variant font-body mt-0.5">{subtitle}</p>
        )}
      </div>
      <div
        className={`px-6 pb-6 pt-4 flex-1 min-h-0 ${scrollable ? 'overflow-y-auto max-h-[320px]' : ''}`}
      >
        {children}
      </div>
    </div>
  )
}
