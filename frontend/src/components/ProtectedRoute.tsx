import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getAuthHeaders, isLoggedIn, isApproved } from '../services/auth'

interface ProtectedRouteProps {
  component: React.ReactNode
}

export function ProtectedRoute({ component }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      // Check local auth status first
      const isLogged = await isLoggedIn()
      if (!isLogged) {
        setIsAuthorized(false)
        return
      }

      const approved = await isApproved()
      if (!approved) {
        setIsAuthorized(false)
        return
      }

      // Verify with backend
      try {
        const headers = await getAuthHeaders()
        const response = await fetch('http://localhost:3001/user/profile', {
          headers: headers as HeadersInit,
        })

        const user = await response.json()
        setIsAuthorized(user.approved === true)
      } catch (error) {
        console.error('Auth check error:', error)
        setIsAuthorized(false)
      }
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
