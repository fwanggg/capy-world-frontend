import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getAuthHeaders } from '../services/auth'

export function AuthCallback() {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)

  useEffect(() => {
    let isMounted = true

    const handleCallback = async () => {
      try {
        // Get the session from the URL (Supabase stores it automatically)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        // Check if component still mounted before state updates
        if (!isMounted) return

        if (session?.user) {
          // User is authenticated, check approval status
          try {
            const authHeaders = await getAuthHeaders()
            const response = await fetch('/user/profile', {
              headers: {
                'Content-Type': 'application/json',
                ...authHeaders,
              } as HeadersInit,
            })

            if (!response.ok) {
              throw new Error(`Profile check failed: ${response.status}`)
            }

            const userData = await response.json()

            if (!isMounted) return

            if (userData.approved) {
              // User is approved, redirect to chat
              navigate('/chat')
            } else {
              // User is not approved yet, show pending approval message
              setPending(true)
            }
          } catch (profileError) {
            console.error('[AUTH_CALLBACK] Profile check error:', profileError)
            if (!isMounted) return
            // If profile check fails, still redirect to chat - backend will handle approval
            navigate('/chat')
          }
        } else {
          navigate('/waitlist')
        }
      } catch (error) {
        console.error('[AUTH_CALLBACK] Error:', error)
        // Check if component still mounted before state updates
        if (!isMounted) return
        navigate('/waitlist')
      }
    }

    handleCallback()

    // Cleanup: mark as unmounted
    return () => {
      isMounted = false
    }
  }, [navigate])

  if (pending) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--color-gray-50)',
      }}>
        <div style={{
          maxWidth: '450px',
          width: '100%',
          backgroundColor: 'var(--color-white)',
          borderRadius: '0.75rem',
          padding: 'var(--space-3xl)',
          boxShadow: 'var(--shadow-lg)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '2.5rem',
            marginBottom: 'var(--space-lg)',
          }}>
            ✓
          </div>
          <h1 style={{
            fontSize: 'var(--text-2xl)',
            marginBottom: 'var(--space-base)',
            color: 'var(--color-navy)',
          }}>
            Account Created!
          </h1>
          <p style={{
            color: 'var(--color-gray-500)',
            marginBottom: 'var(--space-lg)',
            fontSize: 'var(--text-base)',
            lineHeight: 'var(--line-relaxed)',
          }}>
            You're on the beta waitlist for Capybara AI.
          </p>
          <p style={{
            color: 'var(--color-gray-500)',
            marginBottom: 'var(--space-2xl)',
            fontSize: 'var(--text-base)',
            lineHeight: 'var(--line-relaxed)',
          }}>
            Early access typically granted within 1-2 weeks. We'll send you an email as soon as you're approved.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: 'var(--space-sm) var(--space-xl)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              backgroundColor: 'var(--color-teal)',
              color: 'var(--color-white)',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-teal-light)'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-teal)'
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-gray-50)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <h2>Authenticating...</h2>
        <p>Please wait while we complete your sign-in.</p>
      </div>
    </div>
  )
}
