import { useState, useEffect, useRef } from 'react'
import type { ReasoningStep } from '@/types/chat'

interface RespondingBubbleProps {
  entityType: 'capybara' | 'clone'
  displayName: string
  reasoning?: ReasoningStep[]
  isStreaming?: boolean
}

export function RespondingBubble({
  entityType,
  displayName,
  reasoning = [],
  isStreaming = false,
}: RespondingBubbleProps) {
  // Auto-expand reasoning during streaming
  const [reasoningExpanded, setReasoningExpanded] = useState(isStreaming)
  const isCapybara = entityType === 'capybara'
  const hasReasoning = reasoning.length > 0
  const stepsEndRef = useRef<HTMLDivElement>(null)

  // Keep expanded during streaming, auto-scroll to latest step
  useEffect(() => {
    if (isStreaming && hasReasoning) {
      setReasoningExpanded(true)
      // Auto-scroll to latest step
      setTimeout(() => {
        stepsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 0)
    }
  }, [reasoning.length, isStreaming, hasReasoning])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      gap: 'var(--space-base)',
      animation: 'respondingPulse 2s ease-in-out infinite',
    }}>
      <div style={{
        maxWidth: '75%',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)',
      }}>
        {/* Entity label */}
        <div style={{
          fontSize: 'var(--text-xs)',
          fontWeight: '500',
          color: isCapybara ? 'var(--color-teal)' : 'var(--color-gray-500)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {displayName}
        </div>

        {/* Bubble */}
        <div style={{
          padding: 'var(--space-base) var(--space-lg)',
          borderRadius: '0.5rem',
          backgroundColor: 'var(--color-gray-50)',
          border: isCapybara ? '2px solid var(--color-teal)' : '1px solid var(--color-gray-200)',
          borderLeft: isCapybara ? '4px solid var(--color-teal)' : undefined,
          boxShadow: isCapybara ? '0 0 0 3px rgba(13, 148, 136, 0.1)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-sm)',
        }}>
          {/* Status line with current action */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-sm)',
            fontSize: 'var(--text-sm)',
            color: isCapybara ? 'var(--color-teal)' : 'var(--color-gray-500)',
            fontWeight: '500',
          }}>
            <span style={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isCapybara ? 'var(--color-teal)' : 'var(--color-gray-400)',
              animation: 'respondingDot 1.4s ease-in-out infinite',
              flexShrink: 0,
              marginTop: '3px',
            }} />
            <div style={{ flex: 1 }}>
              {isCapybara && isStreaming && hasReasoning && reasoning.length > 0 ? (
                <div>
                  <div>Iteration {reasoning[reasoning.length - 1].iteration || reasoning.length}/30</div>
                  <div style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-gray-600)',
                    marginTop: '2px',
                    fontWeight: '400',
                  }}>
                    {reasoning[reasoning.length - 1].action}
                  </div>
                </div>
              ) : isCapybara ? (
                'Thinking...'
              ) : (
                'Responding...'
              )}
            </div>
          </div>

          {/* Reasoning steps (Capybara only) */}
          {isCapybara && hasReasoning && (
            <div>
              <div
                onClick={() => setReasoningExpanded(!reasoningExpanded)}
                style={{
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-gray-500)',
                  userSelect: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>{reasoningExpanded ? '▼' : '▶'}</span>
                <span>{reasoning.length} step{reasoning.length !== 1 ? 's' : ''}</span>
              </div>

              {reasoningExpanded && (
                <div style={{
                  marginTop: 'var(--space-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}>
                  {reasoning.map((step, idx) => (
                    <div
                      key={idx}
                      ref={idx === reasoning.length - 1 ? stepsEndRef : null}
                      style={{
                        paddingLeft: 'var(--space-base)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-gray-600)',
                        lineHeight: '1.4',
                        opacity: isStreaming && idx === reasoning.length - 1 ? 1 : 0.8,
                        backgroundColor: isStreaming && idx === reasoning.length - 1 ? 'rgba(13, 148, 136, 0.05)' : 'transparent',
                        paddingRight: '4px',
                        borderRadius: '2px',
                        transition: 'opacity 0.2s ease',
                      }}
                    >
                      {step.iteration}. {step.action} → {step.summary}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes respondingDot {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes respondingPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  )
}
