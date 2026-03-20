'use client'

import { useState } from 'react'
import { useAuthClient } from '@/hooks/useAuthClient'

interface SignInDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
}

export function SignInDialog({
  isOpen,
  onClose,
  title = 'Sign in to Analyze',
  message = 'Sign in with Google to analyze landing pages and get feedback from AI personas.',
}: SignInDialogProps) {
  const { signInWithGoogle } = useAuthClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    try {
      setLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface border border-outline-variant/20 rounded-2xl p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold font-headline text-on-surface">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-on-surface-variant hover:bg-surface-container p-2 rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Message */}
        <p className="text-on-surface-variant font-body text-sm mb-6 leading-relaxed">
          {message}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-error-container/20 border border-error/40 rounded-lg text-error text-sm">
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-surface-container text-on-surface font-bold rounded-full hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-primary-container text-on-primary-container font-bold rounded-full hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>
              {loading ? 'progress_activity' : 'login'}
            </span>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-on-surface-variant mt-6 text-center">
          We&apos;ll redirect you back after signing in
        </p>
      </div>
    </div>
  )
}
