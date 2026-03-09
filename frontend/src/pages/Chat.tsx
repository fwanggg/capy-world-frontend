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
    const checkApprovalAndInit = async () => {
      const approved = await isApproved()
      if (!approved) {
        window.location.href = '/waitlist'
        return
      }
      initializeSession()
    }
    checkApprovalAndInit()
  }, [])

  const initializeSession = async () => {
    const controller = new AbortController()

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const authHeaders = await getAuthHeaders()
      if ('Authorization' in authHeaders) {
        headers['Authorization'] = authHeaders['Authorization']
      }

      const response = await fetch('/chat/init', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'god' }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const session = await response.json()
      setSessionId(session.id)
    } catch (err: any) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Session initialization cancelled')
        return
      }
      setError(err.message || 'Session init error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-white)',
        color: 'var(--color-gray-400)',
      }}>
        <p style={{ fontSize: 'var(--text-lg)' }}>Initializing chat session...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-white)',
        padding: 'var(--space-xl)',
      }}>
        <div style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: 'var(--space-2xl)',
          borderRadius: '0.5rem',
          maxWidth: '500px',
        }}>
          <h2 style={{ marginBottom: 'var(--space-base)', fontSize: 'var(--text-lg)' }}>Session Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-white)',
        color: 'var(--color-gray-500)',
      }}>
        <p>Failed to initialize chat session</p>
      </div>
    )
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--color-white)',
    }}>
      {/* Header with Mode Switcher */}
      <div style={{
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-100)',
        padding: 'var(--space-lg) var(--space-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h1 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: '700',
          color: 'var(--color-navy)',
          margin: 0,
        }}>
          Research Session
        </h1>

        {/* Mode Switcher - Only show Conversation Mode when clones are selected */}
        {activeClones.length > 0 && (
          <div style={{
            display: 'flex',
            gap: 'var(--space-base)',
            backgroundColor: 'var(--color-gray-50)',
            padding: 'var(--space-sm)',
            borderRadius: '0.5rem',
          }}>
            <button
              onClick={() => setMode('god')}
              style={{
                padding: 'var(--space-sm) var(--space-lg)',
                backgroundColor: mode === 'god' ? 'var(--color-teal)' : 'transparent',
                color: mode === 'god' ? 'var(--color-white)' : 'var(--color-gray-500)',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: 'var(--text-sm)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseOver={(e) => {
                if (mode !== 'god') {
                  e.currentTarget.style.backgroundColor = 'var(--color-gray-100)'
                }
              }}
              onMouseOut={(e) => {
                if (mode !== 'god') {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              God Mode
            </button>
            <button
              onClick={() => setMode('conversation')}
              style={{
                padding: 'var(--space-sm) var(--space-lg)',
                backgroundColor: mode === 'conversation' ? 'var(--color-teal)' : 'transparent',
                color: mode === 'conversation' ? 'var(--color-white)' : 'var(--color-gray-500)',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: 'var(--text-sm)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseOver={(e) => {
                if (mode !== 'conversation') {
                  e.currentTarget.style.backgroundColor = 'var(--color-gray-100)'
                }
              }}
              onMouseOut={(e) => {
                if (mode !== 'conversation') {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              Conversation Mode ({activeClones.length})
            </button>
          </div>
        )}
      </div>

      {/* Chat Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {mode === 'god' && (
          <GodMode
            sessionId={sessionId}
            onEnterConversation={(clones) => {
              setActiveClones(clones)
              setMode('conversation')
            }}
          />
        )}

        {mode === 'conversation' && (
          <ConversationMode sessionId={sessionId} activeClones={activeClones} />
        )}
      </div>
    </div>
  )
}
