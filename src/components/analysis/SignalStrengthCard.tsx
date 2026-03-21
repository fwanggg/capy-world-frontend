'use client'

import { AnalysisCard } from './AnalysisCard'

interface SignalStrengthCardProps {
  /** Status from heatmap: "High Resistance" | "Mixed Signals" | "Strong Fit" */
  readonly status?: string
  readonly className?: string
}

/** Map status to 0–100 score. High = deliver product, low = pivot for value prop */
function statusToScore(status: string | undefined): number {
  if (!status) return 50
  const s = status.toLowerCase()
  if (s.includes('strong fit')) return 85
  if (s.includes('mixed') || s.includes('neutral')) return 50
  if (s.includes('resistance')) return 15
  return 50
}

/** Human-readable interpretation */
function getScoreLabel(score: number): string {
  if (score >= 70) return 'Product problem — deliver the promised product'
  if (score >= 40) return 'Mixed signals — validate further'
  return 'Value prop problem — pivot to find proper fit'
}

export function SignalStrengthCard({ status, className }: Readonly<SignalStrengthCardProps>) {
  const score = statusToScore(status)
  const label = getScoreLabel(score)

  return (
    <AnalysisCard title="Signal Strength" subtitle="Where to focus: build vs pivot" className={className}>
      {/* Score display */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold tabular-nums text-on-surface">{score}</span>
        <span className="text-sm text-on-surface-variant">/ 100</span>
      </div>

      {/* Interpretation */}
      <p className="text-sm font-medium text-on-surface mb-6">{label}</p>

      {/* Horizontal line: left = pivot, right = deliver */}
      <div className="space-y-2">
        <div className="relative h-2 rounded-full bg-surface-variant/30 overflow-visible">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary-container border-2 border-surface-container-low shadow-md -ml-2 transition-all"
            style={{ left: `${score}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-medium text-on-surface-variant">
          <span className="text-left max-w-[45%]">Pivot to find<br />value prop</span>
          <span className="text-right max-w-[45%] text-end">Deliver the<br />promised product</span>
        </div>
      </div>
    </AnalysisCard>
  )
}
