import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getAuthHeaders } from '../services/auth'

export function AuthCallback() {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    let isMounted = true

    const handleCallback = async () => {
      try {
        console.log('[AUTH_CALLBACK] ========== STARTING CALLBACK HANDLER ==========')
        console.log('[AUTH_CALLBACK] Current URL:', window.location.href)

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
          console.log('[AUTH_CALLBACK] Session found, user:', session.user.id, 'email:', session.user.email)

          // Create waitlist record directly
          try {
            console.log('[AUTH_CALLBACK] Checking waitlist record...')
            const { data: existing, error: selectError } = await supabase
              .from('waitlist')
              .select('id')
              .eq('user_id', session.user.id)
              .single()

            if (selectError?.code === 'PGRST116') {
              // User doesn't exist, create one
              console.log('[AUTH_CALLBACK] Creating new waitlist record...')
              const { error: insertError } = await supabase
                .from('waitlist')
                .insert({
                  id: session.user.id,
                  user_id: session.user.id,
                  email: session.user.email || 'unknown@example.com',
                  approval_status: 'pending',
                  joined_at: new Date().toISOString(),
                })
              if (insertError) {
                console.error('[AUTH_CALLBACK] Creation error:', insertError.message)
              } else {
                console.log('[AUTH_CALLBACK] ✓ Waitlist record created')
              }
            } else if (!selectError) {
              console.log('[AUTH_CALLBACK] ✓ Waitlist record already exists')
            } else {
              console.error('[AUTH_CALLBACK] Error checking record:', selectError.message)
            }
          } catch (err) {
            console.error('[AUTH_CALLBACK] Error:', err instanceof Error ? err.message : err)
          }

          console.log('[AUTH_CALLBACK] Redirecting to /chat...')
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
