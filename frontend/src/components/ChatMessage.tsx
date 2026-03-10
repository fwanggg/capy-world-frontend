import React from 'react'
import { anonymizeUsername } from '../utils/anonymize'
import { ThinkingSteps } from './ThinkingSteps'

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

        {/* Thinking display for Capybara messages */}
        {role === 'capybara' && reasoning && reasoning.length > 0 && (
          <div style={{ marginTop: 'var(--space-lg)' }}>
            <ThinkingSteps
              steps={reasoning}
              isLoading={false}
              defaultCollapsed={true}
            />
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
