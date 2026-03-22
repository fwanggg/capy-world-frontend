'use client'

import type { HeatMap } from '@/types/analysis'
import { AnalysisCard } from './AnalysisCard'

interface SignalStrengthCardProps {
  /** Heat map with Mom Test overallScore (0–10) and overallRationale. Replaces deprecated status-based logic. */
  readonly heatMap?: HeatMap | null
  readonly className?: string
}

/** Mom Test score badge 0–10 */
function ScoreBadge({ score }: { score: number }) {
  const hue = score >= 7 ? 160 : score >= 4 ? 45 : 0
  const sat = score >= 7 ? 70 : score >= 4 ? 80 : 75
  return (
    <span
      className="inline-flex items-center justify-center w-12 h-12 rounded-full text-lg font-bold tabular-nums shrink-0"
      style={{ backgroundColor: `hsl(${hue}, ${sat}%, 25%)`, color: 'white' }}
      title={`Mom Test overall: ${score}/10`}
    >
      {score}
    </span>
  )
}

export function SignalStrengthCard({ heatMap, className }: Readonly<SignalStrengthCardProps>) {
  const overallScore = heatMap?.overallScore
  const overallRationale = heatMap?.overallRationale
  const conclusion = heatMap?.conclusion
  const hasScore = overallScore !== undefined
  const percent = hasScore ? (overallScore / 10) * 100 : 50

  return (
    <AnalysisCard title="Signal Strength" subtitle="Conversion funnel resistance analysis" className={className}>
      {/* Overall score + rationale (from HeatMap Mom Test) */}
      <div className="flex gap-4 items-start mb-4">
        {hasScore && (
          <div className="flex flex-col items-center shrink-0">
            <ScoreBadge score={overallScore} />
            <span className="text-[9px] font-medium text-on-surface-variant mt-1 uppercase tracking-wider">
              Overall
            </span>
          </div>
        )}
        {overallRationale ? (
          <p className="text-sm text-on-surface-variant font-body leading-relaxed flex-1 min-w-0">
            {overallRationale}
          </p>
        ) : !hasScore ? (
          <p className="text-sm text-on-surface-variant font-body">No Mom Test overall score yet.</p>
        ) : null}
      </div>

      {/* Strategic Synthesis */}
      {conclusion && (
        <div className="mb-6 pl-4 border-l-2 border-primary-container/30">
          <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2">
            Strategic Synthesis
          </h4>
          <p className="text-sm text-on-surface font-body leading-relaxed italic">
            &ldquo;{conclusion}&rdquo;
          </p>
        </div>
      )}

      {/* Horizontal line: red (left) → green (right) */}
      <div className="space-y-2">
        <div
          className="relative h-2 rounded-full overflow-visible"
          style={{
            background: 'linear-gradient(to right, hsl(0, 65%, 45%), hsl(45, 80%, 45%), hsl(160, 70%, 35%))',
          }}
        >
          {hasScore && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-outline shadow-md -ml-2 transition-all pointer-events-none"
              style={{ left: `${percent}%` }}
            />
          )}
        </div>
        <div className="flex justify-between text-[10px] font-medium text-on-surface-variant">
          <span className="text-left max-w-[45%]">Weak validation<br />(0–3)</span>
          <span className="text-right max-w-[45%] text-end">Strong fit<br />(7–10)</span>
        </div>
      </div>
    </AnalysisCard>
  )
}
