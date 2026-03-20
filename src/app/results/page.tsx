'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import ReasoningTimeline from '@/components/ReasoningTimeline'
import AnalysisDashboard from '@/components/AnalysisDashboard'
import type { AnalysisResult } from '@/types/analysis'
import type { ReasoningStep } from '@/types/chat'

function ResultsContent() {
  const searchParams = useSearchParams()
  const url = searchParams.get('url') || ''
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [reasoningSteps, setReasoningSteps] = useState<ReasoningStep[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return

    const fetchAnalysis = async () => {
      setLoading(true)
      setError(null)
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

                if (data.type === 'progress') {
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
    <ResultsLayout result={result} reasoningSteps={reasoningSteps} loading={loading} error={error} url={url} />
  )
}

function ResultsLayout({ result, reasoningSteps, loading, error, url }: { result: AnalysisResult | null; reasoningSteps: ReasoningStep[]; loading: boolean; error: string | null; url: string }) {
  return (
    <div className="dark bg-background text-on-surface font-body">
      {/* Top Nav */}
      <header className="fixed top-0 w-full z-50 bg-[#10131a]/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex items-center justify-between px-8 h-16 w-full max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-tighter text-[#e1e2eb] font-headline">CAPYSAN</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex gap-8 items-center h-full font-manrope tracking-tight text-sm font-semibold">
              <a className="text-[#94d3c3] hover:text-[#00f5d4] transition-colors" href="#">About</a>
              <a className="text-[#94d3c3] hover:text-[#00f5d4] transition-colors" href="#">Personas</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#94d3c3] hover:text-[#e1e2eb] cursor-pointer active:scale-95 duration-200">settings</span>
              <span className="material-symbols-outlined text-[#94d3c3] hover:text-[#e1e2eb] cursor-pointer active:scale-95 duration-200">notifications</span>
            </div>
            <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/20 active:scale-95 transition-transform bg-surface-container"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 min-h-screen bg-surface">
        <div className="max-w-screen-2xl mx-auto px-8 flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Reasoning Timeline */}
          <div className="lg:w-80 flex-shrink-0">
            <ReasoningTimeline steps={reasoningSteps} loading={loading} />
          </div>

          {/* Right Content - Analysis Dashboard */}
          <div className="flex-1">
            {error ? (
              <div className="p-8 bg-error-container/20 border border-error/30 rounded-xl text-error">
                <p className="font-bold mb-2">Analysis Error</p>
                <p className="text-sm">{error}</p>
              </div>
            ) : (
              <AnalysisDashboard result={result} loading={loading} url={url} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="dark bg-background text-on-surface font-body min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResultsContent />
    </Suspense>
  )
}
