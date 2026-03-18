'use client'

import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { VisualizationPayload, ChartSpec, ChartDataPoint } from '@/types/chat'

interface VisualizationCardProps {
  payload: VisualizationPayload
}

function PieRenderer({ spec }: { spec: ChartSpec }) {
  const innerRadius = spec.innerRadius ?? 0
  const data = (spec.data as ChartDataPoint[]).filter(item => item && item.value)
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0)

  // Custom label renderer to show percentages outside the pie
  const renderLabel = (entry: any) => {
    const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0
    return `${percent}%`
  }

  return (
    <div style={{ width: '100%', height: 320, display: 'flex', flexDirection: 'column' }}>
      <h4 style={{ margin: '0 0 var(--space-sm) 0', fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-navy)' }}>
        {spec.title}
      </h4>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <Pie
            data={data}
            cx="40%"
            cy="50%"
            innerRadius={innerRadius > 0 ? innerRadius * 60 : 0}
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
            label={renderLabel}
            labelLine={true}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any) => {
              const numValue = typeof value === 'number' ? value : 0
              const percent = total > 0 ? ((numValue / total) * 100).toFixed(1) : 0
              return `${numValue} (${percent}%)`
            }}
            labelFormatter={(label: any) => label || 'Vote'}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: any) => value || 'Unknown'}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function HorizontalBarRenderer({ spec }: { spec: ChartSpec }) {
  const data = (spec.data as ChartDataPoint[]).filter(item => item && item.label)

  return (
    <div style={{
      width: '100%',
      maxHeight: 500,
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <h4 style={{ margin: '0 0 var(--space-base) 0', fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-navy)' }}>
        {spec.title}
      </h4>
      {data.length === 0 ? (
        <div style={{ color: 'var(--color-gray-500)', fontSize: 'var(--text-xs)' }}>
          No data available
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
          {data.map((item, idx) => (
            <div
              key={idx}
              style={{
                paddingBottom: 'var(--space-base)',
                borderBottom: idx < data.length - 1 ? '1px solid var(--color-gray-200)' : 'none',
              }}
            >
              {/* Vote badge + persona name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)',
                marginBottom: 'var(--space-xs)',
              }}>
                <div
                  style={{
                    minWidth: '52px',
                    height: '28px',
                    borderRadius: '4px',
                    backgroundColor: item.color || '#8884d8',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.label}
                </div>
                <div style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: '500',
                  color: 'var(--color-navy)',
                  flex: 1,
                  minWidth: 0,
                  wordBreak: 'break-word',
                }}>
                  {item.name ? String(item.name) : '(no name)'}
                </div>
              </div>

              {/* Reasoning */}
              {item.note && (
                <div
                  style={{
                    marginLeft: '60px',
                    padding: 'var(--space-sm)',
                    backgroundColor: 'var(--color-gray-50)',
                    borderRadius: '4px',
                    borderLeft: '3px solid ' + (item.color || '#8884d8'),
                    color: 'var(--color-gray-700)',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 'var(--line-relaxed)',
                    wordBreak: 'break-word',
                    fontStyle: 'italic',
                  }}
                >
                  {item.note}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TopConcernsRenderer({ spec }: { spec: ChartSpec }) {
  // Filter valid data, sort by value descending, show top 5
  const data = (spec.data as ChartDataPoint[]).filter(item => item && item.name && item.value)
  const sorted = [...data].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5)
  const maxValue = Math.max(...sorted.map(item => item.value || 0), 1)

  if (sorted.length === 0) {
    return <div style={{ color: 'var(--color-gray-500)', fontSize: 'var(--text-xs)' }}>No concerns data</div>
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <h4 style={{ margin: '0 0 var(--space-base) 0', fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-navy)' }}>
        {spec.title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
        {sorted.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {/* Bar with count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  marginBottom: 'var(--space-xs)',
                }}>
                  <div style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: '600',
                    color: 'var(--color-navy)',
                    flex: 1,
                    minWidth: 0,
                    wordBreak: 'break-word',
                  }}>
                    {String(item.name)}
                  </div>
                  <div style={{
                    minWidth: '32px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: item.color || '#f87171',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {item.value}
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'var(--color-gray-200)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${((item.value || 0) / maxValue) * 100}%`,
                    height: '100%',
                    backgroundColor: item.color || '#f87171',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            </div>

            {/* Reasoning */}
            {item.note && (
              <div style={{
                paddingLeft: 'var(--space-sm)',
                paddingRight: 'var(--space-sm)',
                paddingTop: 'var(--space-xs)',
                paddingBottom: 'var(--space-xs)',
                backgroundColor: 'var(--color-red-50)',
                borderLeft: '3px solid ' + (item.color || '#f87171'),
                borderRadius: '2px',
                color: 'var(--color-gray-700)',
                fontSize: 'var(--text-xs)',
                lineHeight: 'var(--line-relaxed)',
                wordBreak: 'break-word',
                fontStyle: 'italic',
              }}>
                {item.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TopBenefitsRenderer({ spec }: { spec: ChartSpec }) {
  // Filter valid data, sort by value descending, show top 5
  const data = (spec.data as ChartDataPoint[]).filter(item => item && item.name && item.value)
  const sorted = [...data].sort((a, b) => (b.value || 0) - (a.value || 0)).slice(0, 5)
  const maxValue = Math.max(...sorted.map(item => item.value || 0), 1)

  if (sorted.length === 0) {
    return <div style={{ color: 'var(--color-gray-500)', fontSize: 'var(--text-xs)' }}>No benefits data</div>
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <h4 style={{ margin: '0 0 var(--space-base) 0', fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--color-navy)' }}>
        {spec.title}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-base)' }}>
        {sorted.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            {/* Bar with count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-xs)',
                  marginBottom: 'var(--space-xs)',
                }}>
                  <div style={{
                    fontSize: 'var(--text-xs)',
                    fontWeight: '600',
                    color: 'var(--color-navy)',
                    flex: 1,
                    minWidth: 0,
                    wordBreak: 'break-word',
                  }}>
                    {String(item.name)}
                  </div>
                  <div style={{
                    minWidth: '32px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: item.color || '#10b981',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {item.value}
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: 'var(--color-gray-200)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${((item.value || 0) / maxValue) * 100}%`,
                    height: '100%',
                    backgroundColor: item.color || '#10b981',
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            </div>

            {/* Reasoning */}
            {item.note && (
              <div style={{
                paddingLeft: 'var(--space-sm)',
                paddingRight: 'var(--space-sm)',
                paddingTop: 'var(--space-xs)',
                paddingBottom: 'var(--space-xs)',
                backgroundColor: 'var(--color-green-50)',
                borderLeft: '3px solid ' + (item.color || '#10b981'),
                borderRadius: '2px',
                color: 'var(--color-gray-700)',
                fontSize: 'var(--text-xs)',
                lineHeight: 'var(--line-relaxed)',
                wordBreak: 'break-word',
                fontStyle: 'italic',
              }}>
                {item.note}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function renderChart(spec: ChartSpec) {
  switch (spec.type) {
    case 'pie':
      return <PieRenderer spec={spec} />
    case 'horizontal_bar':
      return <HorizontalBarRenderer spec={spec} />
    case 'top_concerns':
      return <TopConcernsRenderer spec={spec} />
    case 'top_benefits':
      return <TopBenefitsRenderer spec={spec} />
    default:
      return <div>Unsupported chart type</div>
  }
}

export function VisualizationCard({ payload }: VisualizationCardProps) {
  return (
    <div
      style={{
        backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-gray-200)',
        borderRadius: '0.5rem',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xs)',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--color-teal)',
          color: 'var(--color-white)',
          padding: 'var(--space-lg)',
          fontWeight: '600',
          fontSize: 'var(--text-sm)',
        }}
      >
        {payload.title}
      </div>

      {/* Charts */}
      <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        {payload.charts.map((chart, idx) => (
          <div key={idx} style={{ minWidth: 0 }}>
            {renderChart(chart)}
          </div>
        ))}
      </div>
    </div>
  )
}
