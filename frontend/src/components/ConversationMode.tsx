import { useState } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { getAuthHeaders } from '../services/auth'

interface ConversationModeProps {
  sessionId: string
  activeClones: any[]
}

export function ConversationMode({ sessionId, activeClones }: ConversationModeProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendMessage = async (content: string, targetClones?: string[], target?: 'capybara' | 'clones') => {
    setError(null)
    setLoading(true)

    try {
      if (!content.trim()) {
        throw new Error('Message cannot be empty')
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const authHeaders = await getAuthHeaders()
      if ('Authorization' in authHeaders) {
        headers['Authorization'] = authHeaders['Authorization']
      }

      const requestBody: any = {
        session_id: sessionId,
        content,
      }

      if (target === 'capybara') {
        requestBody.target = 'capybara'
      } else if (targetClones) {
        requestBody.target_clones = targetClones
      }

      const response = await fetch('http://localhost:3001/chat/message', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      // Add messages
      if (data.user_message) {
        setMessages((prev) => [...prev, data.user_message])
      }

      if (data.ai_responses && data.ai_responses.length > 0) {
        setMessages((prev) => [...prev, ...data.ai_responses])
      } else {
        setError('No responses received from clones')
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred'
      setError(errorMsg)
      console.error('ConversationMode error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--color-white)',
    }}>
      {/* Conversation Header */}
      <div style={{
        padding: 'var(--space-lg) var(--space-xl)',
        backgroundColor: 'var(--color-gray-50)',
        borderBottom: '1px solid var(--color-gray-200)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{
            fontSize: 'var(--text-sm)',
            fontWeight: '600',
            color: 'var(--color-gray-600)',
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Conversation Mode
          </h3>
          <p style={{
            fontSize: 'var(--text-base)',
            color: 'var(--color-navy)',
            margin: 'var(--space-xs) 0 0 0',
            fontWeight: '500',
          }}>
            {activeClones.length} {activeClones.length === 1 ? 'clone' : 'clones'} in session
          </p>
        </div>
        <div style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
        }}>
          {activeClones.slice(0, 3).map((clone, idx) => (
            <div
              key={idx}
              style={{
                padding: 'var(--space-xs) var(--space-sm)',
                backgroundColor: 'var(--color-teal)',
                color: 'var(--color-white)',
                borderRadius: '0.25rem',
                fontSize: 'var(--text-xs)',
                fontWeight: '500',
              }}
            >
              {clone}
            </div>
          ))}
          {activeClones.length > 3 && (
            <div
              style={{
                padding: 'var(--space-xs) var(--space-sm)',
                backgroundColor: 'var(--color-gray-300)',
                color: 'var(--color-white)',
                borderRadius: '0.25rem',
                fontSize: 'var(--text-xs)',
                fontWeight: '500',
              }}
            >
              +{activeClones.length - 3} more
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--space-2xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
      }}>
        {messages.length === 0 && !error && (
          <div style={{
            padding: 'var(--space-2xl)',
            backgroundColor: 'var(--color-gray-50)',
            borderRadius: '0.5rem',
            borderLeft: '4px solid var(--color-teal)',
            textAlign: 'center',
          }}>
            <h3 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: '600',
              color: 'var(--color-navy)',
              margin: 0,
              marginBottom: 'var(--space-base)',
            }}>
              Ready to hear from your clones
            </h3>
            <p style={{
              color: 'var(--color-gray-600)',
              fontSize: 'var(--text-base)',
              margin: 0,
            }}>
              Ask your clones a question to get their perspective on your product, pitch, or marketing message.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} sender_id={msg.sender_id} content={msg.content} />
        ))}
        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: 'var(--space-lg)',
            borderRadius: '0.5rem',
            border: '1px solid #fecaca',
          }}>
            <strong style={{ fontSize: 'var(--text-sm)' }}>Error:</strong>
            <p style={{ margin: 'var(--space-xs) 0 0 0', fontSize: 'var(--text-sm)' }}>{error}</p>
          </div>
        )}
        {loading && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-lg)',
            color: 'var(--color-gray-400)',
          }}>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>Waiting for responses...</p>
          </div>
        )}
      </div>

      <ChatInput onSend={handleSendMessage} disabled={loading} placeholder="Ask your clones a question..." />
    </div>
  )
}
