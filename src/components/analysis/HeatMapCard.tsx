'use client'

import { useMemo, useState } from 'react'
import type { HeatMap } from '@/types/analysis'
import { AnalysisCard } from './AnalysisCard'

interface HeatMapCardProps {
  readonly heatMap: HeatMap
}

const PIE_COLORS = ['#00f5d4', '#00c4a7', '#00a890', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#5a6b6b'] as const

/** Show top 10 themes by count. Only use "Other" for overflow (themes 11+) so the pie reveals actual insights. */
function aggregateForPie(themes: Array<{ label: string; count: number }>): Array<{ label: string; count: number }> {
  const sorted = [...themes].sort((a, b) => b.count - a.count)
  if (sorted.length <= 10) return sorted
  const top9 = sorted.slice(0, 9)
  const otherCount = sorted.slice(9).reduce((s, t) => s + t.count, 0)
  return [...top9, { label: 'Other', count: otherCount }]
}

function PieChart({
  data,
  size = 120,
}: {
  data: Array<{ label: string; count: number }>
  size?: number
}) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const [hovered, setHovered] = useState<number | null>(null)

  const slices = useMemo(() => {
    if (total === 0) return []
    let acc = 0
    return data.map((d, i) => {
      const pct = (d.count / total) * 100
      const start = acc
      acc += pct
      return { ...d, start, end: acc, pct, color: PIE_COLORS[i % PIE_COLORS.length], index: i }
    })
  }, [data, total])

  if (total === 0) {
    return (
      <div className="rounded-full bg-surface-variant/20 flex items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-xs text-on-surface-variant">No data</span>
      </div>
    )
  }

  const r = size / 2
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-full">
        {slices.map((s) => {
          const startAngle = (s.start / 100) * 360 - 90 // -90 so 0° is top
          const endAngle = (s.end / 100) * 360 - 90
          const rad = (deg: number) => (deg * Math.PI) / 180
          const x1 = r + r * Math.cos(rad(startAngle))
          const y1 = r + r * Math.sin(rad(startAngle))
          const x2 = r + r * Math.cos(rad(endAngle))
          const y2 = r + r * Math.sin(rad(endAngle))
          const large = s.pct > 50 ? 1 : 0
          const d = `M ${r} ${r} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
          const isHover = hovered === s.index
          return (
            <path
              key={s.index}
              d={d}
              fill={s.color}
              opacity={isHover ? 1 : hovered === null ? 0.9 : 0.4}
              className="transition-opacity cursor-pointer"
              onMouseEnter={() => setHovered(s.index)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>{s.label}: {s.count} ({s.pct.toFixed(1)}%)</title>
            </path>
          )
        })}
      </svg>
      {hovered !== null && slices[hovered] && (
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs bg-surface-container-high text-on-surface border border-outline-variant/30 whitespace-nowrap z-10 pointer-events-none"
          style={{ minWidth: 120 }}
        >
          {slices[hovered].label}: {slices[hovered].count} ({slices[hovered].pct.toFixed(1)}%)
        </div>
      )}
    </div>
  )
}

/** Friction Density — pie charts per question, max 5 slices, hover shows count + % */
export function HeatMapCard({ heatMap }: Readonly<HeatMapCardProps>) {
  const { conclusion, rows } = heatMap
  const safeRows = Array.isArray(rows) ? rows : []

  if (safeRows.length === 0) {
    return (
      <AnalysisCard title="Friction Density" subtitle="Conversion funnel resistance analysis">
        <p className="text-sm text-on-surface-variant font-body">{conclusion ?? 'No data yet.'}</p>
      </AnalysisCard>
    )
  }

  return (
    <AnalysisCard title="Friction Density" subtitle="Conversion funnel resistance analysis">
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

      <div className="space-y-6">
        {safeRows.map((row) => {
          const themes = Array.isArray(row.themes) ? row.themes : []
          const pieData = aggregateForPie(themes)

          return (
            <div key={row.questionKey} className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide shrink-0">
                    {row.question}
                  </span>
                  {row.questionText && (
                    <>
                      <span className="text-on-surface-variant/50">—</span>
                      <span className="text-xs text-on-surface-variant/90 font-body">
                        {row.questionText}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                <PieChart data={pieData} size={120} />
              </div>
            </div>
          )
        })}
      </div>
    </AnalysisCard>
  )
}
