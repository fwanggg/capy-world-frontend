import React from 'react'

interface ChatMessageProps {
  role: 'user' | 'capybara' | 'clone'
  sender_id: string
  content: string
}

export function ChatMessage({ role, sender_id, content }: ChatMessageProps) {
  const isUser = role === 'user'

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
          color: 'var(--color-gray-500)',
          textAlign: isUser ? 'right' : 'left',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          {role === 'user' && 'You'}
          {role === 'capybara' && 'Capybara AI'}
          {role === 'clone' && sender_id}
        </div>
        <div style={{
          padding: 'var(--space-lg)',
          borderRadius: '0.5rem',
          backgroundColor: isUser ? 'var(--color-teal)' : 'var(--color-gray-50)',
          color: isUser ? 'var(--color-white)' : 'var(--color-navy)',
          fontSize: 'var(--text-base)',
          lineHeight: 'var(--line-relaxed)',
          wordWrap: 'break-word' as const,
          border: isUser ? 'none' : '1px solid var(--color-gray-200)',
          boxShadow: isUser ? 'var(--shadow-sm)' : 'none',
        }}>
          {content}
        </div>
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
