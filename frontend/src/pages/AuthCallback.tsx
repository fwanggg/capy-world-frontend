import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/auth'

export function AuthCallback() {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let isMounted = true

    const handleCallback = async () => {
      try {
        console.log('[AUTH_CALLBACK] Starting callback handler')

        // Wait a moment for Supabase to process the URL fragment
        await new Promise(resolve => setTimeout(resolve, 500))

        // Get the session - Supabase should have stored it from URL
        const { data: { session }, error } = await supabase.auth.getSession()

        console.log('[AUTH_CALLBACK] Session result:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          error: error?.message
        })

        if (error) {
          console.error('[AUTH_CALLBACK] Session error:', error)
        }

        // Check if component still mounted before state updates
        if (!isMounted) return

        if (session?.user) {
          // User is authenticated, redirect to chat
          console.log('[AUTH_CALLBACK] Session found, redirecting to /chat')
          navigate('/chat', { replace: true })
        } else {
          console.warn('[AUTH_CALLBACK] No session found, redirecting to /waitlist')
          navigate('/waitlist', { replace: true })
        }
      } catch (error) {
        console.error('[AUTH_CALLBACK] Error:', error)
        if (!isMounted) return
        navigate('/waitlist', { replace: true })
      } finally {
        if (isMounted) {
          setIsChecking(false)
        }
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
