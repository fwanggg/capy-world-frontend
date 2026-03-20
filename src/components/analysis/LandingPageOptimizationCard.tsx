import type { ActionItem } from '@/types/analysis'

const ACTION_ICONS = ['ads_click', 'verified', 'chat_bubble', 'terminal'] as const

function getPredictedConv(item: ActionItem): string {
  if (item.predictedConvPercent != null) {
    return `+${item.predictedConvPercent}%`
  }
  const fallback: Record<string, string> = { High: '+15%', Medium: '+8%', Low: '+5%' }
  return fallback[item.impact] ?? '+5%'
}

interface LandingPageOptimizationCardProps {
  readonly actionItems: readonly ActionItem[]
}

export function LandingPageOptimizationCard({
  actionItems,
}: Readonly<LandingPageOptimizationCardProps>) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <h3 className="text-xl font-headline font-black text-on-surface">
          Landing Page Optimization
        </h3>
        <span className="text-xs font-bold text-primary-container uppercase tracking-widest">
          {actionItems.length} New High-Impact Recs
        </span>
      </div>
      <div className="space-y-4">
        {actionItems.map((item, i) => (
          <div
            key={i}
            className="group bg-surface-container p-6 rounded-xl border border-transparent hover:border-primary-container/20 transition-all flex justify-between items-center shadow-sm"
          >
            <div className="flex gap-6 items-center">
              <div className="w-12 h-12 bg-surface-variant rounded-full flex items-center justify-center group-hover:bg-primary-container/10 transition-colors">
                <span className="material-symbols-outlined text-primary-container">
                  {ACTION_ICONS[i % ACTION_ICONS.length]}
                </span>
              </div>
              <div>
                <h4 className="font-headline font-bold text-on-surface">{item.action}</h4>
                <p className="text-xs text-on-surface-variant mt-1 max-w-sm">{item.rationale}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-primary-container font-black text-lg">{getPredictedConv(item)}</div>
              <div className="text-[10px] text-on-surface-variant uppercase font-bold">
                Predicted Conv.
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
