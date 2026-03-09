import { useState } from 'react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { signInWithGoogle, getAuthHeaders } from '../services/auth'

export function Waitlist() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
    setLoading(true)
    setError(null)

    try {
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google')
      }

      await signInWithGoogle(credentialResponse.credential)

      // After successful sign-in, check approval status via backend
      // The backend will create app_users entry if it doesn't exist
      const authHeaders = await getAuthHeaders()
      const headers = {
        'Content-Type': 'application/json',
        ...authHeaders,
      }
      const response = await fetch('/user/profile', {
        headers: headers as HeadersInit,
      })

      if (!response.ok) {
        throw new Error(`Profile check failed: ${response.status}`)
      }

      const userData = await response.json()

      if (userData.approved) {
        setMessage('You are approved! Redirecting to chat...')
        setTimeout(() => {
          window.location.href = '/chat'
        }, 1000)
      } else {
        setLoading(false)
        setMessage('Success! You have been added to the waitlist. We will notify you when you are approved.')
      }
    } catch (err: any) {
      const message = err instanceof Error ? err.message : 'Authentication failed'
      setError(message)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-xl)',
      backgroundColor: 'var(--color-gray-50)',
    }}>
      <div style={{
        maxWidth: '450px',
        width: '100%',
        backgroundColor: 'var(--color-white)',
        borderRadius: '0.75rem',
        padding: 'var(--space-3xl)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <h1 style={{
          textAlign: 'center',
          fontSize: 'var(--text-3xl)',
          marginBottom: 'var(--space-lg)',
        }}>
          Join Capybara
        </h1>

        <p style={{
          textAlign: 'center',
          color: 'var(--color-gray-500)',
          marginBottom: 'var(--space-2xl)',
        }}>
          Sign in with Google to get early access and start testing your ideas with AI-powered user research.
        </p>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: 'var(--space-base)',
            borderRadius: '0.375rem',
            marginBottom: 'var(--space-lg)',
            fontSize: 'var(--text-sm)',
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            padding: 'var(--space-base)',
            borderRadius: '0.375rem',
            marginBottom: 'var(--space-lg)',
            fontSize: 'var(--text-sm)',
          }}>
            {message}
          </div>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 'var(--space-2xl)',
        }}>
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => setError('Login failed')}
            size="large"
            theme="outline"
          />
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--color-gray-400)' }}>
            Signing in...
          </p>
        )}

        <p style={{
          textAlign: 'center',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-gray-400)',
          marginTop: 'var(--space-2xl)',
        }}>
          We're in beta. Early applicants get priority access.
        </p>
      </div>
    </div>
  )
}
