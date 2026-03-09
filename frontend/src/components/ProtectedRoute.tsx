import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { isLoggedIn } from '../services/auth'

interface ProtectedRouteProps {
  component: React.ReactNode
}

export function ProtectedRoute({ component }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      // Check if user has valid JWT session
      const isLogged = await isLoggedIn()
      setIsAuthorized(isLogged)
    }

    checkAuth()
  }, [])

  if (isAuthorized === null) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  if (!isAuthorized) {
    return <Navigate to="/waitlist" replace />
  }

  return component
}
