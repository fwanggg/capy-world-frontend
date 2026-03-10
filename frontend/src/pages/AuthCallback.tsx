import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, getAuthHeaders } from '../services/auth'

// Persistent logging function
function logPersistent(level: 'log' | 'error' | 'warn', ...args: any[]) {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] ${args.join(' ')}`

  // Log to console
  console[level](...args)

  // Also save to localStorage for debugging
  try {
    const logs = JSON.parse(localStorage.getItem('auth_debug_logs') || '[]')
    logs.push({ level, timestamp, message })
    // Keep last 50 entries
    if (logs.length > 50) logs.shift()
    localStorage.setItem('auth_debug_logs', JSON.stringify(logs))
  } catch (e) {
    // Silently fail if localStorage is not available
  }
}

export function AuthCallback() {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)
  const [debugError, setDebugError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const handleCallback = async () => {
      try {
        logPersistent('log', '[AUTH_CALLBACK] ========== STARTING CALLBACK HANDLER ==========')
        logPersistent('log', '[AUTH_CALLBACK] Current URL:', window.location.href)
        logPersistent('log', '[AUTH_CALLBACK] URL has fragment:', window.location.hash.length > 0)
        logPersistent('log', '[AUTH_CALLBACK] Fragment:', window.location.hash.substring(0, 50))

        // Wait for Supabase to process the URL fragment and emit auth state change
        let sessionFound = false
        let attempts = 0
        const maxAttempts = 10

        while (!sessionFound && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 200))
          attempts++

          const { data: { session }, error } = await supabase.auth.getSession()

          logPersistent('log', `[AUTH_CALLBACK] Attempt ${attempts}/${maxAttempts}: hasSession=${!!session}, userId=${session?.user?.id}`)

          if (session?.user) {
            sessionFound = true
            if (!isMounted) return

            logPersistent('log', '[AUTH_CALLBACK] ✓ Session found, user:', session.user.id)

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
            return
          }
        }

        if (!isMounted) return

        if (!sessionFound) {
          const errorMsg = `No session found after ${maxAttempts} attempts. Supabase did not detect the OAuth token.`
          logPersistent('error', '[AUTH_CALLBACK] ❌ CRITICAL:', errorMsg)
          logPersistent('error', '[AUTH_CALLBACK] URL fragment present:', window.location.hash.length > 0)
          setDebugError(errorMsg)
          // Delay navigation to show error
          setTimeout(() => navigate('/waitlist', { replace: true }), 3000)
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error)
        logPersistent('error', '[AUTH_CALLBACK] ❌ Unexpected error:', errMsg)
        if (!isMounted) return
        setDebugError(errMsg)
        setTimeout(() => navigate('/waitlist', { replace: true }), 3000)
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
      <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
        {debugError ? (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '0.5rem',
            color: '#991b1b',
            padding: '1.5rem',
          }}>
            <h2>⚠️ Login Failed</h2>
            <p><strong>{debugError}</strong></p>
            <p>Redirecting to login in 3 seconds...</p>
            <p style={{ fontSize: '0.875rem', marginTop: '1rem', color: '#7f1d1d' }}>
              Debug: Run in console:<br/>
              <code>JSON.stringify(JSON.parse(localStorage.getItem('auth_debug_logs')), null, 2)</code>
            </p>
          </div>
        ) : (
          <>
            <h2>Authenticating...</h2>
            <p>Please wait while we complete your sign-in.</p>
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: '#666',
            }}>
              Check browser console (F12) for detailed logs
            </div>
          </>
        )}
      </div>
    </div>
  )
}
