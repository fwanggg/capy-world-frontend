import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../services/auth'

interface ProtectedRouteProps {
  component: React.ReactNode
}

export function ProtectedRoute({ component }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    // Listen to auth state changes - this is more reliable than checking manually
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[PROTECTED_ROUTE] Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id
        })

        if (session?.user) {
          setIsAuthorized(true)
        } else {
          setIsAuthorized(false)
        }
      }
    )

    return () => {
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
