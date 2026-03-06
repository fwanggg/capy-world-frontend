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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
          💡 God Mode: Talk to Capybara AI to plan your research
        </div>
        {messages.length === 0 && !error && (
          <div style={{ color: '#999', fontStyle: 'italic', padding: '1rem' }}>
            Start by describing what you'd like to research. For example: "I want to test my sales pitch on game developers."
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} sender_id={msg.sender_id} content={msg.content} />
        ))}
        {error && (
          <div
            style={{
              backgroundColor: '#fee',
              color: '#c33',
              padding: '0.75rem 1rem',
              borderRadius: '0.25rem',
              marginBottom: '1rem',
              border: '1px solid #fcc',
            }}
          >
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
      <ChatInput onSend={handleSendMessage} disabled={loading} placeholder="Describe your research goal..." />
    </div>
  )
}
