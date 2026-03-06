import { useState, useEffect } from 'react'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { getAuthHeaders } from '../services/auth'

interface GodModeProps {
  sessionId: string
  onEnterConversation: (clones: string[]) => void
}

export function GodMode({ sessionId, onEnterConversation }: GodModeProps) {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendMessage = async (content: string) => {
    setError(null)
    setLoading(true)

    try {
      if (!content.trim()) {
        throw new Error('Message cannot be empty')
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const authHeaders = getAuthHeaders()
      if (authHeaders['x-user-id']) {
        headers['x-user-id'] = authHeaders['x-user-id']
      }

      const response = await fetch('http://localhost:3001/chat/message', {
        method: 'POST',
        headers,
        body: JSON.stringify({ session_id: sessionId, content }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      // Add messages to history
      if (data.user_message) {
        setMessages((prev) => [...prev, data.user_message])
      }

      if (data.ai_responses) {
        setMessages((prev) => [...prev, ...data.ai_responses])
      }

      // TODO: Parse Capybara response to detect clone selection and auto-transition
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred'
      setError(errorMsg)
      console.error('GodMode error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-white)' }}>
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
          }}>
            <h3 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: '600',
              color: 'var(--color-navy)',
              marginBottom: 'var(--space-base)',
              margin: 0,
            }}>
              God Mode
            </h3>
            <p style={{
              color: 'var(--color-gray-600)',
              fontSize: 'var(--text-base)',
              margin: '0.5rem 0 0 0',
            }}>
              Talk to Capybara AI to plan your research. Start by describing what you'd like to research. For example: "I want to test my sales pitch on game developers."
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
            marginBottom: 'var(--space-lg)',
            border: '1px solid #fecaca',
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      <ChatInput onSend={handleSendMessage} disabled={loading} placeholder="Describe your research goal..." />
    </div>
  )
}
