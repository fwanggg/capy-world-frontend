import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getAuthHeaders } from '../services/auth'

export function AuthCallback() {
  const navigate = useNavigate()

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
              // User is not approved yet, show waitlist message
              navigate('/waitlist', { state: { message: 'Your account is pending approval. We will notify you when approved.' } })
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
