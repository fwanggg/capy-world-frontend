import { useState, useEffect } from 'react'
import { GodMode } from '../components/GodMode'
import { ConversationMode } from '../components/ConversationMode'
import { getAuthHeaders, isApproved } from '../services/auth'

export function Chat() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [mode, setMode] = useState<'god' | 'conversation'>('god')
  const [activeClones, setActiveClones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check approval and initialize session
    if (!isApproved()) {
      window.location.href = '/waitlist'
      return
    }

    initializeSession()
  }, [])

  const initializeSession = async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const authHeaders = getAuthHeaders()
      if (authHeaders['x-user-id']) {
        headers['x-user-id'] = authHeaders['x-user-id']
      }

      const response = await fetch('http://localhost:3001/chat/init', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'god' }),
      })

      const session = await response.json()

      if (!response.ok) {
        throw new Error(session.error || 'Failed to initialize chat')
      }

      setSessionId(session.id)
    } catch (err: any) {
      setError(err.message || 'Session init error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading chat...</div>
  }

  if (error) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'red' }}>Error: {error}</div>
  }

  if (!sessionId) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Failed to initialize chat</div>
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '0.5rem 1rem', backgroundColor: '#f0f0f0', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setMode('god')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: mode === 'god' ? '#007bff' : '#ddd',
            color: mode === 'god' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: 'pointer',
          }}
        >
          God Mode
        </button>
        <button
          onClick={() => setMode('conversation')}
          disabled={activeClones.length === 0}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: mode === 'conversation' ? '#007bff' : '#ddd',
            color: mode === 'conversation' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '0.25rem',
            cursor: activeClones.length === 0 ? 'not-allowed' : 'pointer',
            opacity: activeClones.length === 0 ? 0.5 : 1,
          }}
        >
          Conversation Mode ({activeClones.length} clones)
        </button>
      </div>

      {mode === 'god' && (
        <GodMode
          sessionId={sessionId}
          onEnterConversation={(clones) => {
            setActiveClones(clones)
            setMode('conversation')
          }}
        />
      )}

      {mode === 'conversation' && <ConversationMode sessionId={sessionId} activeClones={activeClones} />}
    </div>
  )
}
