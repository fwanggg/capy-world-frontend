import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { signInWithGoogle } from '../services/auth'

export function Waitlist() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleGoogleLogin = async (credentialResponse: any) => {
    setLoading(true)
    setError(null)

    try {
      const data = await signInWithGoogle(credentialResponse.credential)

      if (data.approved) {
        setMessage('You are approved! Redirecting to chat...')
        setTimeout(() => {
          window.location.href = '/chat'
        }, 1000)
      } else {
        setMessage('Success! You have been added to the waitlist. We will notify you when you are approved.')
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', textAlign: 'center' }}>
      <h1>Join the Waitlist</h1>
      <p>Sign in with Google to join our waitlist. We'll notify you when you're approved for access.</p>

      {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}
      {message && <div style={{ color: 'green', marginBottom: '1rem' }}>{message}</div>}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <GoogleLogin
          onSuccess={handleGoogleLogin}
          onError={() => setError('Login failed')}
          size="large"
          theme="outline"
        />
      </div>

      {loading && <p>Signing in...</p>}
    </div>
  )
}
