'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef, Suspense } from 'react'
import { AnalysisNav } from '@/components/analysis/AnalysisNav'
import { AnalysisProcessingState } from '@/components/analysis/AnalysisProcessingState'
import AnalysisDashboard from '@/components/AnalysisDashboard'
import { SignInDialog } from '@/components/SignInDialog'
import { useAuthClient } from '@/hooks/useAuthClient'
import { getSupabaseClient } from '@/lib/supabase-client'
import type { AnalysisResult } from '@/types/analysis'
import type { ReasoningStep } from '@/types/chat'

function ResultsContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url') || ''
  const { user, loading: authLoading } = useAuthClient()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([])
  const [showSignIn, setShowSignIn] = useState(false)
  const [dismissedSignIn, setDismissedSignIn] = useState(false)
  const [retryKey, setRetryKey] = useState(0)
  const [authRejected, setAuthRejected] = useState(false) // 401/403 - don't show "did not complete"
  const mountedRef = useRef(true)
  const fetchIdRef = useRef(0)

  // Show sign-in when auth is ready, we have a URL, and user is not logged in
  const needsSignIn = !authLoading && url && !user && !dismissedSignIn

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!url) {
      setLoading(false)
      return
    }
    if (!user) {
      setLoading(false)
      return
    }

    setAuthRejected(false)
    const currentFetchId = ++fetchIdRef.current
    const fetchAnalysis = async () => {
      setLoading(true)
      setError(null)
      setReasoningSteps([])
      setShowSignIn(false)
      try {
        let session: { access_token?: string } | null = null
        try {
          const { data } = await getSupabaseClient().auth.getSession()
          session = data.session
        } catch {
          setShowSignIn(true)
          setLoading(false)
          return
        }

        if (!session?.access_token) {
          setShowSignIn(true)
          setLoading(false)
          return
        }

        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ url }),
          // No AbortController - Strict Mode double-mount was aborting the first fetch before it could complete
        })

        if (res.status === 401) {
          if (mountedRef.current) {
            setAuthRejected(true)
            setShowSignIn(true)
            setLoading(false)
          }
          return
        }

        if (res.status === 403) {
          const data = await res.json().catch(() => ({}))
          setError((data as { error?: string })?.error ?? 'Access denied. Please sign up at /waitlist first.')
          setLoading(false)
          return
        }

        if (!res.ok) throw new Error(`API error: ${res.status}`)

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''

        const processLine = (line: string) => {
          if (!line.startsWith('data: ')) return
          try {
            const data = JSON.parse(line.slice(6))
            if (!mountedRef.current || currentFetchId !== fetchIdRef.current) return
            if (data.type === 'progress' && data.step) {
              setReasoningSteps((prev) => [...prev, data.step])
            } else if (data.type === 'complete') {
              setResult(data.result)
            } else if (data.type === 'error') {
              setError(data.error)
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e)
          }
        }

        while (true) {
          const { done, value } = await reader.read()
          // Decode and process even when done (final chunk may contain complete event)
          if (value) {
            buffer += decoder.decode(value, { stream: true })
          }
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            processLine(line)
          }
          if (done) {
            if (buffer.trim()) processLine(buffer)
            break
          }
        }
      } catch (err) {
        if (mountedRef.current && currentFetchId === fetchIdRef.current) {
          setError(err instanceof Error ? err.message : 'Analysis failed')
        }
      } finally {
        if (mountedRef.current && currentFetchId === fetchIdRef.current) {
          setLoading(false)
        }
      }
    }

    fetchAnalysis()
  }, [url, user, retryKey])

  const canRetry = Boolean(url && user)
  return (
    <>
      <ResultsLayout
        result={result}
        loading={loading}
        error={error}
        url={url}
        reasoningSteps={reasoningSteps}
        authLoading={authLoading}
        onRetry={canRetry ? () => setRetryKey((k) => k + 1) : undefined}
        attemptedFetch={canRetry}
        authRejected={authRejected}
      />
      <SignInDialog
        isOpen={showSignIn || needsSignIn}
        onClose={() => {
          setShowSignIn(false)
          setDismissedSignIn(true)
        }}
        redirectTo={typeof window !== 'undefined' ? window.location.href : undefined}
      />
    </>
  )
}

function ResultsLayout({
  result,
  loading,
  error,
  url,
  reasoningSteps,
  authLoading,
  onRetry,
  attemptedFetch,
  authRejected,
}: {
  result: AnalysisResult | null
  loading: boolean
  error: string | null
  url: string
  reasoningSteps: ReasoningStep[]
  authLoading?: boolean
  onRetry?: () => void
  attemptedFetch?: boolean
  authRejected?: boolean
}) {
  const showEmptyState = !loading && !result && !error && url && attemptedFetch && !authRejected
  const showAuthLoading = authLoading

  return (
    <div className="dark min-h-screen bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary">
      <AnalysisNav />

      <main className="pt-24 pb-16 min-h-screen bg-surface">
        {error ? (
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="p-8 bg-error-container/20 border border-error/40 rounded-xl text-error">
              <p className="font-bold mb-2">Analysis Error</p>
              <p className="text-sm">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-4 px-4 py-2 rounded-lg bg-primary text-on-primary font-medium hover:opacity-90"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        ) : showAuthLoading ? (
          <div className="max-w-screen-2xl mx-auto px-8 flex items-center justify-center min-h-[40vh]">
            <p className="text-on-surface-variant">Checking authentication…</p>
          </div>
        ) : loading && !result ? (
          <AnalysisProcessingState reasoningSteps={reasoningSteps} estimatedSeconds={12} />
        ) : showEmptyState ? (
          <div className="max-w-screen-2xl mx-auto px-8 flex flex-col items-center justify-center min-h-[40vh] gap-4">
            <p className="text-on-surface-variant">
              Analysis did not complete. The request may have timed out or been interrupted.
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-lg bg-primary text-on-primary font-medium hover:opacity-90"
              >
                Try again
              </button>
            )}
          </div>
        ) : (
          <AnalysisDashboard result={result} loading={loading} url={url} />
        )}
      </main>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="dark min-h-screen bg-surface text-on-surface font-body flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
