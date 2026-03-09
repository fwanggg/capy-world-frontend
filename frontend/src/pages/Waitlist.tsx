import { useState } from 'react'
import { signInWithGoogle, getAuthHeaders } from '../services/auth'

export function Waitlist() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      // signInWithGoogle() will redirect to Google OAuth
      // After OAuth completes, Supabase will redirect to /auth/callback
      // The AuthCallback component will handle session verification and approval check
      await signInWithGoogle()
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
          Join the Waitlist
        </h1>

        <p style={{
          textAlign: 'center',
          color: 'var(--color-gray-500)',
          marginBottom: 'var(--space-2xl)',
        }}>
          Get early access to Capybara AI and start testing your ideas with AI-powered user research.
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
          <button
            onClick={handleSignIn}
            disabled={loading}
            style={{
              padding: 'var(--space-sm) var(--space-xl)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              backgroundColor: loading ? 'var(--color-gray-300)' : 'var(--color-teal)',
              color: 'var(--color-white)',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-teal-light)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                (e.target as HTMLButtonElement).style.backgroundColor = 'var(--color-teal)'
              }
            }}
          >
            {loading ? 'Signing in with Google...' : 'Sign in with Google'}
          </button>
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
