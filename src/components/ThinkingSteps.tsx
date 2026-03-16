import { useState } from 'react'
import type { ReasoningStep } from '@/types/chat'

interface ThinkingStepsProps {
  steps: ReasoningStep[]
  isLoading?: boolean
  defaultCollapsed?: boolean
}

export function ThinkingSteps({
  steps,
  isLoading = false,
  defaultCollapsed = false,
}: ThinkingStepsProps) {
  const [isExpanded, setIsExpanded] = useState(!defaultCollapsed)

  if (!steps || steps.length === 0) {
    return null
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--color-gray-50)',
        border: '1px solid var(--color-gray-200)',
        borderLeft: '4px solid var(--color-teal)',
        borderRadius: '0.5rem',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)',
      }}
    >
      {/* Header with toggle */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-sm)',
          cursor: 'pointer',
          fontSize: 'var(--text-sm)',
          fontWeight: '600',
          color: isLoading ? 'var(--color-teal)' : 'var(--color-gray-600)',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: '1.2em' }}>
          {isExpanded ? '▼' : '▶'}
        </span>
        <span>
          {isLoading
            ? `Capysan is thinking... (${steps.length} steps)`
            : `Show Capysan's thinking (${steps.length} steps)`}
        </span>
      </div>

      {/* Steps list */}
      {isExpanded && (
        <div
          style={{
            marginTop: 'var(--space-base)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
          }}
        >
          {steps.map((step) => (
            <div
              key={step.iteration}
              style={{
                paddingLeft: 'var(--space-lg)',
                fontSize: 'var(--text-sm)',
                color: 'var(--color-gray-600)',
                lineHeight: '1.5',
              }}
            >
              {step.iteration}. {step.action} → {step.summary}
            </div>
          ))}
        </div>
      )}

      {/* Loading spinner */}
      {isLoading && !isExpanded && (
        <div style={{ marginTop: 'var(--space-base)' }}>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-gray-500)' }}>
            Processing...
          </span>
        </div>
      )}
    </div>
  )
}
