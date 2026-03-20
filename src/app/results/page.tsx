'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
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
    <ResultsLayout result={result} loading={loading} error={error} url={url} />
  )
}

function ResultsLayout({
  result,
  loading,
  error,
  url,
}: {
  result: AnalysisResult | null
  loading: boolean
  error: string | null
  url: string
}) {
  return (
    <div className="min-h-screen bg-[#10131a] text-[#e1e2eb]">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-8 bg-[#10131a]/95 backdrop-blur-xl border-b border-[#2a3a36]/50">
        <Link href="/" className="text-xl font-bold tracking-tighter text-[#e1e2eb] hover:text-[#00f5d4] transition-colors">
          CAPYSAN
        </Link>
        <nav className="flex items-center gap-8">
          <a className="text-[#94d3c3] hover:text-[#00f5d4] transition-colors text-sm font-medium" href="#">About</a>
          <a className="text-[#94d3c3] hover:text-[#00f5d4] transition-colors text-sm font-medium" href="#">Personas</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-16 min-h-screen bg-[#10131a]">
        {error ? (
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <div className="p-8 bg-[#93000a]/20 border border-[#ffb4ab]/50 rounded-xl text-[#ffb4ab]">
              <p className="font-bold mb-2">Analysis Error</p>
              <p className="text-sm">{error}</p>
            </div>
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
        <div className="min-h-screen bg-[#10131a] text-[#e1e2eb] flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
