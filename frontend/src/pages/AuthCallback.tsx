import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/auth'

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
          // User is authenticated, redirect to chat
          // Chat init will create user in app_users if needed
          navigate('/chat')
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
