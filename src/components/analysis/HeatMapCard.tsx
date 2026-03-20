import type { HeatMap } from '@/types/analysis'

interface HeatMapCardProps {
  readonly heatMap: HeatMap
}

/** Mauve-to-teal gradient — Stitch Friction Density design */
const ROW_PALETTES = [
  { low: 'bg-[#2d2430]', mid: 'bg-[#6b5a6a]', high: 'bg-[#00f5d4]/30' } as const,
  { low: 'bg-[#2d2520]', mid: 'bg-[#6b5a4a]', high: 'bg-[#00f5d4]/30' } as const,
  { low: 'bg-[#1e2d22]', mid: 'bg-[#4a6b5a]', high: 'bg-[#00f5d4]/30' } as const,
  { low: 'bg-[#1e252d]', mid: 'bg-[#4a5a6b]', high: 'bg-[#00f5d4]/30' } as const,
  { low: 'bg-[#252d2d]', mid: 'bg-[#5a6b6b]', high: 'bg-[#00f5d4]/30' } as const,
  { low: 'bg-[#2d2528]', mid: 'bg-[#6b5a5d]', high: 'bg-[#00f5d4]/30' } as const,
]

function getHeatClass(count: number, maxInRow: number, palette: (typeof ROW_PALETTES)[0]): string {
  if (maxInRow <= 0) return palette.low
  const ratio = count / maxInRow
  if (ratio >= 0.7) return palette.high
  if (ratio >= 0.3) return palette.mid
  return palette.low
}

function getStatusBadgeClass(status: string): string {
  if (status === 'High Resistance') return 'bg-[#e8a0a8]/20 text-[#e8a0a8] border-[#e8a0a8]/40'
  if (status === 'Strong Fit') return 'bg-primary-container/20 text-primary-container border-primary-container/40'
  if (status === 'Neutral Flow') return 'bg-[#e89a5a]/20 text-[#e89a5a] border-[#e89a5a]/40'
  return 'bg-surface-variant/50 text-on-surface-variant border-outline-variant/30'
}

/** Friction Density — Stitch design: conversion funnel resistance, Strategic Synthesis, status badges */
export function HeatMapCard({ heatMap }: Readonly<HeatMapCardProps>) {
  const COLUMNS = 12
  const { conclusion, status, rows } = heatMap
  const safeRows = Array.isArray(rows) ? rows : []

  if (safeRows.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-outline-variant/10 bg-surface-container-low">
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2">
          Friction Density
        </h3>
        <p className="text-xs text-on-surface-variant font-body mb-2">
          Conversion funnel resistance analysis
        </p>
        <p className="text-sm text-on-surface-variant font-body">{conclusion ?? 'No heat map data yet.'}</p>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-xl border border-outline-variant/10 bg-surface-container-low">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">
            Friction Density
          </h3>
          <p className="text-xs text-on-surface-variant font-body mt-0.5">
            Conversion funnel resistance analysis
          </p>
        </div>
        {status && (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border shrink-0 ${getStatusBadgeClass(status)}`}
          >
            {status}
          </span>
        )}
      </div>

      {/* Strategic Synthesis — Stitch block quote style */}
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

      <div className="space-y-4">
        {safeRows.map((row, rowIdx) => {
          const themes = Array.isArray(row.themes) ? row.themes : []
          const maxInRow = Math.max(...themes.map((t) => t.count), 1)
          const palette = ROW_PALETTES[rowIdx % ROW_PALETTES.length]
          const cells = [...themes.slice(0, COLUMNS)]
          while (cells.length < COLUMNS) {
            cells.push({ label: '', count: 0 })
          }

          return (
            <div key={row.questionKey} className="space-y-2">
              <div className="text-[10px] font-medium text-on-surface-variant truncate">
                {row.question}
              </div>
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}>
                {cells.map((cell, idx) => (
                  <div
                    key={idx}
                    title={cell.label ? `${cell.label}: ${cell.count}` : undefined}
                    className={`h-6 rounded-md min-w-0 transition-colors ${getHeatClass(cell.count, maxInRow, palette)}`}
                  />
                ))}
              </div>
              {themes.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-on-surface-variant">
                  {themes.slice(0, 6).map((t, i) => (
                    <span key={i}>
                      <span className="font-medium text-on-surface">{t.label}</span>
                      <span className="ml-1 tabular-nums">({t.count})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
