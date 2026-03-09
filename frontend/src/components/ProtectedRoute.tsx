import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../services/auth'

interface ProtectedRouteProps {
  component: React.ReactNode
}

export function ProtectedRoute({ component }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        // First, get the current session
        const { data: { session } } = await supabase.auth.getSession()

        if (isMounted) {
          console.log('[PROTECTED_ROUTE] Initial session check:', {
            hasSession: !!session,
            userId: session?.user?.id
          })
          setIsAuthorized(!!session?.user)
        }
      } catch (error) {
        console.error('[PROTECTED_ROUTE] Session check error:', error)
        if (isMounted) {
          setIsAuthorized(false)
        }
      }
    }

    // Check initial session
    checkAuth()

    // Also listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (isMounted) {
          console.log('[PROTECTED_ROUTE] Auth state changed:', {
            event,
            hasSession: !!session,
            userId: session?.user?.id
          })
          setIsAuthorized(!!session?.user)
        }
      }
    )

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  if (isAuthorized === null) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  if (!isAuthorized) {
    return <Navigate to="/waitlist" replace />
  }

  return component
}
