import { useState, useEffect } from 'react'
import { ParticipantSidebar } from '../components/ParticipantSidebar'
import { UnifiedChat } from '../components/UnifiedChat'
import { getAuthHeaders, supabase, waitForAuthInitialization } from '../services/auth'

export function Chat() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [activeClones, setActiveClones] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Monitor auth state - redirect if session is lost
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        console.log('[CHAT] Session lost, redirecting to waitlist')
        window.location.href = '/waitlist'
      }
    })

    // Initialize chat session
    initializeSession()

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const initializeSession = async () => {
    const controller = new AbortController()

    try {
      // Wait for Supabase to load the session from storage
      await waitForAuthInitialization()

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      const authHeaders = await getAuthHeaders()
      if ('Authorization' in authHeaders) {
        headers['Authorization'] = authHeaders['Authorization']
        console.log('[CHAT_INIT] Auth header set successfully')
      } else {
        console.warn('[CHAT_INIT] No Authorization header available')
      }

      const response = await fetch('/chat/init', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: 'god' }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }))
        if (response.status === 401) {
          window.location.href = '/waitlist'
          return
        }
        throw new Error(errorData.error || `HTTP ${response.status}`)
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
      {/* Header */}
      <div style={{
        backgroundColor: 'var(--color-white)',
        borderBottom: '1px solid var(--color-gray-100)',
        padding: 'var(--space-lg) var(--space-xl)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <h1 style={{
          fontSize: 'var(--text-2xl)',
          fontWeight: '700',
          color: 'var(--color-navy)',
          margin: 0,
        }}>
          Capy Studyroom
        </h1>
      </div>

      {/* Main Layout: Sidebar + Chat */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        <ParticipantSidebar currentUserId="you" activeClones={activeClones} />
        <UnifiedChat sessionId={sessionId} onActiveClonesChange={setActiveClones} />
      </div>
    </div>
  )
}
