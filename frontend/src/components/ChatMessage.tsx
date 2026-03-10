import React, { useState } from 'react'
import { anonymizeUsername } from '../utils/anonymize'

interface ReasoningStep {
  iteration: number
  action: string
  toolName: string
  input?: any
  output?: any
  summary: string
}

interface ChatMessageProps {
  role: 'user' | 'capybara' | 'clone'
  sender_id: string
  content: string
  reasoning?: ReasoningStep[]
}

export function ChatMessage({ role, sender_id, content, reasoning }: ChatMessageProps) {
  const isUser = role === 'user'
  const isCapybara = role === 'capybara'
  const [showReasoning, setShowReasoning] = useState(false)

  const getDisplayName = () => {
    if (role === 'user') return 'You'
    if (role === 'capybara') return 'Capybara AI'
    if (role === 'clone') return anonymizeUsername(sender_id)
    return sender_id
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      gap: 'var(--space-base)',
      animation: 'slideIn 0.3s ease-out',
    }}>
      <div style={{
        maxWidth: '75%',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)',
      }}>
        <div style={{
          fontSize: 'var(--text-xs)',
          fontWeight: '500',
          color: isCapybara ? 'var(--color-teal)' : 'var(--color-gray-500)',
          textAlign: isUser ? 'right' : 'left',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {getDisplayName()}
        </div>
        <div style={{
          padding: 'var(--space-lg)',
          borderRadius: '0.5rem',
          backgroundColor: isUser ? 'var(--color-teal)' : 'var(--color-gray-50)',
          color: isUser ? 'var(--color-white)' : 'var(--color-navy)',
          fontSize: 'var(--text-base)',
          lineHeight: 'var(--line-relaxed)',
          wordWrap: 'break-word' as const,
          border: isUser ? 'none' : isCapybara ? '2px solid var(--color-teal)' : '1px solid var(--color-gray-200)',
          borderLeft: isCapybara ? '4px solid var(--color-teal)' : undefined,
          boxShadow: isUser ? 'var(--shadow-sm)' : isCapybara ? '0 0 0 3px rgba(13, 148, 136, 0.1)' : 'none',
        }}>
          {content}
        </div>

        {/* Show reasoning chain for Capybara messages */}
        {isCapybara && reasoning && reasoning.length > 0 && (
          <div style={{
            marginTop: 'var(--space-sm)',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-gray-600)',
          }}>
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-teal)',
                cursor: 'pointer',
                padding: '0',
                fontSize: 'var(--text-sm)',
                fontWeight: '500',
                textDecoration: 'underline',
                marginBottom: 'var(--space-xs)',
              }}
            >
              {showReasoning ? '▼ Hide' : '▶ Show'} Capybara's Thinking ({reasoning.length} steps)
            </button>

            {showReasoning && (
              <div style={{
                marginTop: 'var(--space-sm)',
                padding: 'var(--space-md)',
                backgroundColor: 'rgba(13, 148, 136, 0.05)',
                borderRadius: '0.375rem',
                border: '1px solid rgba(13, 148, 136, 0.2)',
              }}>
                {reasoning.map((step, idx) => (
                  <div key={idx} style={{
                    marginBottom: 'var(--space-md)',
                    paddingBottom: 'var(--space-md)',
                    borderBottom: idx < reasoning.length - 1 ? '1px solid rgba(13, 148, 136, 0.1)' : 'none',
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 'var(--space-xs)',
                      marginBottom: 'var(--space-xs)',
                    }}>
                      <span style={{
                        display: 'inline-block',
                        width: '1.5rem',
                        height: '1.5rem',
                        borderRadius: '50%',
                        backgroundColor: 'var(--color-teal)',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        lineHeight: '1.5rem',
                        flexShrink: 0,
                      }}>
                        {step.iteration}
                      </span>
                      <span style={{
                        fontWeight: '600',
                        color: 'var(--color-navy)',
                      }}>
                        {step.action}
                      </span>
                    </div>

                    <div style={{
                      marginLeft: '2rem',
                      marginBottom: 'var(--space-xs)',
                      color: 'var(--color-gray-700)',
                    }}>
                      <strong>Tool:</strong> <code style={{ background: 'rgba(0, 0, 0, 0.05)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>{step.toolName}</code>
                    </div>

                    <div style={{
                      marginLeft: '2rem',
                      marginBottom: 'var(--space-xs)',
                      color: 'var(--color-gray-700)',
                    }}>
                      <strong>Result:</strong> {step.summary}
                    </div>

                    {step.input && (
                      <details style={{
                        marginLeft: '2rem',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-gray-600)',
                      }}>
                        <summary style={{ cursor: 'pointer', marginBottom: '0.25rem' }}>
                          Show input
                        </summary>
                        <pre style={{
                          background: 'rgba(0, 0, 0, 0.03)',
                          padding: 'var(--space-xs)',
                          borderRadius: '0.25rem',
                          overflow: 'auto',
                          maxHeight: '150px',
                          fontSize: '0.7rem',
                          lineHeight: '1.3',
                        }}>
                          {JSON.stringify(step.input, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
