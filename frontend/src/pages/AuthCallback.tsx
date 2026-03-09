import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/auth'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    let isMounted = true

    const handleCallback = async () => {
      try {
        console.log('[AUTH_CALLBACK] Starting callback handler')
        // Get the session from the URL (Supabase stores it automatically)
        const { data: { session }, error } = await supabase.auth.getSession()

        console.log('[AUTH_CALLBACK] Session result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          error: error?.message
        })

        if (error) throw error

        // Check if component still mounted before state updates
        if (!isMounted) return

        if (session?.user) {
          // User is authenticated, redirect to chat
          // Chat init will create user in app_users if needed
          console.log('[AUTH_CALLBACK] Session found, redirecting to /chat')
          navigate('/chat')
        } else {
          console.warn('[AUTH_CALLBACK] No session found, redirecting to /waitlist')
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
