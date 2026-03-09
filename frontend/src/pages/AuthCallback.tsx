import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/auth'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL (Supabase stores it automatically)
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        if (session?.user) {
          console.log('[AUTH_CALLBACK] User authenticated:', session.user.email)
          // Redirect to chat
          navigate('/chat')
        } else {
          console.log('[AUTH_CALLBACK] No session found')
          navigate('/waitlist')
        }
      } catch (error) {
        console.error('[AUTH_CALLBACK] Error:', error)
        navigate('/waitlist')
      }
    }

    handleCallback()
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
