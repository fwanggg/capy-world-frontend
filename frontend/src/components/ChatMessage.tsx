import React from 'react'

interface ChatMessageProps {
  role: 'user' | 'capybara' | 'clone'
  sender_id: string
  content: string
}

export function ChatMessage({ role, sender_id, content }: ChatMessageProps) {
  const isUser = role === 'user'

  const styles = {
    container: {
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '1rem',
    },
    bubble: {
      maxWidth: '70%',
      padding: '0.75rem 1rem',
      borderRadius: '0.5rem',
      backgroundColor: isUser ? '#007bff' : '#f0f0f0',
      color: isUser ? '#fff' : '#000',
      wordWrap: 'break-word' as const,
    },
    header: {
      fontSize: '0.85rem',
      color: '#666',
      marginBottom: '0.25rem',
    },
  }

  return (
    <div style={styles.container}>
      <div>
        <div style={styles.header}>
          {role === 'user' && 'You'}
          {role === 'capybara' && 'Capybara AI'}
          {role === 'clone' && sender_id}
        </div>
        <div style={styles.bubble}>{content}</div>
      </div>
    </div>
  )
}
