'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ReasoningTimeline from '@/components/ReasoningTimeline'
import AnalysisDashboard from '@/components/AnalysisDashboard'
import type { AnalysisResult, AnalysisSSEEvent } from '@/types/analysis'
import type { ReasoningStep } from '@/types/chat'

function ResultsContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url')

  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) {
      setError('Missing URL parameter')
      setLoading(false)
      return
    }

    const fetchAnalysis = async () => {
      try {
        setLoading(true)
        setError(null)
        setResult(null)
        setReasoningSteps([])

        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const events = buffer.split('\n\n')
          buffer = events.pop() || ''

          for (const event of events) {
            if (event.startsWith('data: ')) {
              try {
                const data = JSON.parse(event.slice(6)) as AnalysisSSEEvent
                if (data.type === 'progress' && data.step) {
                  setReasoningSteps((prev) => [...prev, data.step!])
                } else if (data.type === 'complete' && data.result) {
                  setResult(data.result)
                  setLoading(false)
                } else if (data.type === 'error') {
                  setError(data.error || 'Unknown error')
                  setLoading(false)
                }
              } catch (err) {
                console.error('Failed to parse SSE event:', err)
              }
            }
          }
        }

        // Handle any remaining buffer data
        if (buffer.trim().startsWith('data: ')) {
          try {
            const data = JSON.parse(buffer.slice(6)) as AnalysisSSEEvent
            if (data.type === 'complete' && data.result) {
              setResult(data.result)
            } else if (data.type === 'error') {
              setError(data.error || 'Unknown error')
            }
          } catch (err) {
            console.error('Failed to parse final SSE event:', err)
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        setError(`Failed to analyze: ${errorMsg}`)
        console.error('Analysis error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysis()
  }, [url])

  if (!url) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Missing URL</p>
          <p className="text-slate-400 mt-2">Please provide a URL parameter</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Top nav */}
      <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-800 px-6 py-4">
        <button
          onClick={() => window.location.href = '/'}
          className="text-teal-400 hover:text-teal-300 transition-colors text-sm font-medium"
        >
          ← Back to analyzer
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="border-b border-red-800 bg-red-900/20 px-6 py-4">
          <p className="text-red-400 font-semibold">Analysis Error</p>
          <p className="text-red-300 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Main content: 2-column layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left sidebar: Reasoning timeline */}
          <ReasoningTimeline steps={reasoningSteps} loading={loading && !result} />

          {/* Right content: Dashboard */}
          <AnalysisDashboard result={result} loading={loading} url={url} />
        </div>
      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><p className="text-slate-400">Loading...</p></div>}>
      <ResultsContent />
    </Suspense>
  )
}
