'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { AnalysisNav } from '@/components/analysis/AnalysisNav'
import { AnalysisProcessingState } from '@/components/analysis/AnalysisProcessingState'
import AnalysisDashboard from '@/components/AnalysisDashboard'
import type { AnalysisResult } from '@/types/analysis'
import type { ReasoningStep } from '@/types/chat'

function ResultsContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url') || ''
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([])

  useEffect(() => {
    if (!url) {
      setLoading(false)
      return
    }

    const fetchAnalysis = async () => {
      setLoading(true)
      setError(null)
      setReasoningSteps([])
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })

        if (!res.ok) throw new Error(`API error: ${res.status}`)

        const reader = res.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
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
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Analysis failed')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [url])

  return (
    <ResultsLayout
      result={result}
      loading={loading}
      error={error}
      url={url}
      reasoningSteps={reasoningSteps}
    />
  )
}

function ResultsLayout({
  result,
  loading,
  error,
  url,
  reasoningSteps,
}: {
  result: AnalysisResult | null
  loading: boolean
  error: string | null
  url: string
  reasoningSteps: ReasoningStep[]
}) {
  return (
    <div className="dark min-h-screen bg-surface text-on-surface font-body selection:bg-primary-container selection:text-on-primary">
      <AnalysisNav />

      <main className="pt-24 pb-16 min-h-screen bg-surface">
        {error ? (
          <div className="max-w-screen-2xl mx-auto px-8">
            <div className="p-8 bg-error-container/20 border border-error/40 rounded-xl text-error">
              <p className="font-bold mb-2">Analysis Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : loading && !result ? (
          <AnalysisProcessingState reasoningSteps={reasoningSteps} estimatedSeconds={12} />
        ) : (
          <AnalysisDashboard result={result} loading={loading} url={url} />
        )}
      </main>

      {/* Stitch FAB - Final Results only */}
      {!loading && result && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            className="w-14 h-14 bg-primary-container text-on-primary-fixed rounded-full shadow-[0_10px_30px_rgba(0,245,212,0.4)] flex items-center justify-center active:scale-90 transition-transform hover:shadow-[0_15px_40px_rgba(0,245,212,0.6)]"
            aria-label="Add"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'wght' 700" }}>
              add
            </span>
          </button>
        </div>
      )}
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
