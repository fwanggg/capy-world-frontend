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

  const handleSendMessage = async (content: string, targetClones?: string[]) => {
    setError(null)
    setLoading(true)

    try {
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
        body: JSON.stringify({
          session_id: sessionId,
          content,
          target_clones: targetClones,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      // Add messages
      if (data.user_message) {
        setMessages((prev) => [...prev, data.user_message])
      }

      if (data.ai_responses) {
        setMessages((prev) => [...prev, ...data.ai_responses])
      }
    } catch (err: any) {
      setError(err.message || 'Message error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '0.5rem 1rem', backgroundColor: '#f9f9f9', borderBottom: '1px solid #ddd' }}>
        <small>Chatting with {activeClones.length} clones</small>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} sender_id={msg.sender_id} content={msg.content} />
        ))}
        {error && <div style={{ color: 'red', padding: '0.5rem' }}>Error: {error}</div>}
      </div>
      <ChatInput onSend={handleSendMessage} disabled={loading} placeholder="Ask your clones a question..." />
    </div>
  )
}
