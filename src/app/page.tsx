'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    try {
      router.push(`/results?url=${encodeURIComponent(url)}`)
    } catch (err) {
      console.error('Navigation error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/" className="text-teal-400 font-bold text-lg">
            Capysan
          </Link>
        </div>
      </nav>

      {/* Main Section */}
      <section className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="max-w-2xl w-full">
          {/* Hero */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-slate-100 mb-4 leading-tight">
              Test Product-Market Fit
              <br />
              With 10 AI Personas
            </h1>
            <p className="text-xl text-slate-400 mb-8 max-w-xl mx-auto">
              Paste a landing page URL. 10 personas run the Mom Test. Get honest product feedback in ~60 seconds.
            </p>
          </div>

          {/* URL Input Form */}
          <form onSubmit={handleAnalyze} className="mb-12">
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="px-6 py-3 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </form>

          {/* 3-Step Guide */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400 text-center mb-6">
              How It Works
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-teal-500 mb-2">1</div>
                <p className="text-sm font-semibold text-slate-200 mb-1">Paste URL</p>
                <p className="text-xs text-slate-400">Share your product landing page</p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-teal-500 mb-2">2</div>
                <p className="text-sm font-semibold text-slate-200 mb-1">10 Personas</p>
                <p className="text-xs text-slate-400">
                  Run the Mom Test (4 questions)
                </p>
              </div>
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-teal-500 mb-2">3</div>
                <p className="text-sm font-semibold text-slate-200 mb-1">Get Results</p>
                <p className="text-xs text-slate-400">
                  Vote breakdown + actionable insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-8 mt-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-slate-100 mb-2">Capysan</h3>
              <p className="text-sm text-slate-400">
                Product-market fit validation powered by AI personas.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-100 mb-2">Product</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/use-cases" className="text-slate-400 hover:text-slate-200 transition-colors">
                    Use Cases
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-slate-100 mb-2">Legal</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <Link href="/privacy" className="text-slate-400 hover:text-slate-200 transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-400 hover:text-slate-200 transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-6 text-center text-sm text-slate-400">
            <p>© 2025 Capysan. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
