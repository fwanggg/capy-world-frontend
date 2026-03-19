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
    <div className="min-h-screen bg-[#10131a] text-[#e1e2eb]">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#10131a]/60 backdrop-blur-xl border-b border-[#3a4a46]/15">
        <div className="flex justify-between items-center px-8 h-20 max-w-7xl mx-auto">
          <Link href="/" className="text-2xl font-bold tracking-tight text-[#e1e2eb]">
            Capysan
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a className="text-[#00f5d4] font-semibold transition-colors duration-200" href="#how">
              How It Works
            </a>
            <a className="text-[#94d3c3] hover:text-[#00f5d4] transition-colors duration-200" href="#features">
              Features
            </a>
            <a className="text-[#94d3c3] hover:text-[#00f5d4] transition-colors duration-200" href="#pricing">
              Pricing
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-8 pt-20 overflow-hidden bg-gradient-to-br from-[#10131a] via-[#10131a] to-[#1a1f2e]">
        <div className="max-w-4xl mx-auto text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b5347]/30 border border-[#3a4a46]/15 mb-8">
            <span className="text-xs font-medium text-[#94d3c3] tracking-wider uppercase">Next-Gen Market Intelligence</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#e1e2eb] tracking-tight mb-6 leading-[1.1]">
            Test Product-Market Fit With{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f5d4] to-[#94d3c3]">
              10 AI Personas
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[#b9cac4] max-w-2xl mx-auto mb-12 leading-relaxed">
            Deploy a fleet of high-fidelity synthetic users to stress-test your value proposition and discover untapped segments before you spend a dime on ads.
          </p>

          {/* CTA Input */}
          <form onSubmit={handleAnalyze} className="max-w-2xl mx-auto bg-[#1d2026]/80 backdrop-blur-sm p-2 rounded-2xl flex flex-col md:flex-row gap-2 shadow-2xl border border-[#3a4a46]/10 mb-12">
            <div className="flex-1 flex items-center px-4 py-3 gap-3">
              <span className="text-[#00f5d4]">🔗</span>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your landing page URL..."
                className="bg-transparent border-none focus:ring-0 text-[#e1e2eb] w-full placeholder:text-[#b9cac4]/50"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-[#00f5d4] text-[#003d33] font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
              <span>→</span>
            </button>
          </form>

          {/* Social Proof */}
          <div className="mt-12 flex justify-center gap-8 opacity-50 grayscale contrast-125 text-sm font-semibold">
            <div>VENTURE</div>
            <div>SAAS.CO</div>
            <div>LUMINARY</div>
          </div>
        </div>

        {/* Background Shapes */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#00f5d4]/5 rounded-full blur-[120px]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0b5347]/10 rounded-full blur-[120px]"></div>
      </section>

      {/* How It Works - Bento Grid */}
      <section id="how" className="py-32 px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-sm font-bold text-[#00f5d4] uppercase tracking-[0.2em] mb-4">The Methodology</h2>
            <h3 className="text-4xl font-bold text-[#e1e2eb] leading-tight">Validate ideas at the speed of thought.</h3>
          </div>
          <div className="text-[#b9cac4] max-w-sm">
            Our AI models emulate real-world purchasing psychology, providing deep qualitative insights in seconds.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[500px]">
          {/* Step 1 */}
          <div className="md:col-span-4 bg-[#1d2026]/50 backdrop-blur-sm rounded-xl p-8 flex flex-col justify-between group hover:bg-[#1d2026] transition-colors border border-[#3a4a46]/5">
            <div>
              <div className="w-12 h-12 bg-[#272a31] rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📋</span>
              </div>
              <h4 className="text-2xl font-bold text-[#e1e2eb] mb-4">1. Paste URL</h4>
              <p className="text-[#b9cac4] leading-relaxed">
                Simply provide the link to your product, landing page, or pitch deck. Our AI extracts the core value prop instantly.
              </p>
            </div>
            <div className="mt-8 pt-8 border-t border-[#3a4a46]/10 text-[#00f5d4] font-semibold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              Step Details <span>→</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="md:col-span-5 bg-[#1d2026] rounded-xl p-8 flex flex-col justify-between relative overflow-hidden group border border-[#3a4a46]/10 shadow-xl">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-[#00f5d4]/10 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">👥</span>
              </div>
              <h4 className="text-2xl font-bold text-[#e1e2eb] mb-4">2. 10 Personas</h4>
              <p className="text-[#b9cac4] leading-relaxed">
                We generate 10 unique synthetic personas—from the "Skeptical CTO" to the "Impulsive Solopreneur"—tailored to your niche.
              </p>
            </div>
            <div className="mt-12 space-y-3 relative z-10">
              <div className="h-10 bg-[#272a31] rounded-full w-full flex items-center px-4 gap-3">
                <div className="w-2 h-2 rounded-full bg-[#00f5d4]"></div>
                <div className="h-2 bg-[#b9cac4]/20 rounded-full w-24"></div>
              </div>
              <div className="h-10 bg-[#272a31] rounded-full w-[80%] flex items-center px-4 gap-3">
                <div className="w-2 h-2 rounded-full bg-[#94d3c3]"></div>
                <div className="h-2 bg-[#b9cac4]/20 rounded-full w-32"></div>
              </div>
              <div className="h-10 bg-[#272a31] rounded-full w-[65%] flex items-center px-4 gap-3">
                <div className="w-2 h-2 rounded-full bg-[#00f5d4]"></div>
                <div className="h-2 bg-[#b9cac4]/20 rounded-full w-20"></div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="md:col-span-3 bg-[#0b0e14] rounded-xl p-8 flex flex-col justify-between border border-[#3a4a46]/15">
            <div>
              <div className="w-12 h-12 bg-[#272a31] rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">📊</span>
              </div>
              <h4 className="text-2xl font-bold text-[#e1e2eb] mb-4">3. Get Results</h4>
              <p className="text-[#b9cac4] leading-relaxed">
                Receive a comprehensive PMF score, objection map, and pricing sensitivity analysis for each persona.
              </p>
            </div>
            <div className="mt-8 flex gap-2">
              <div className="px-3 py-1 bg-[#0b5347]/40 text-[#94d3c3] text-xs rounded-full font-bold">PDF</div>
              <div className="px-3 py-1 bg-[#0b5347]/40 text-[#94d3c3] text-xs rounded-full font-bold">JSON</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Feature Section */}
      <section id="features" className="py-24 px-8">
        <div className="max-w-7xl mx-auto bg-[#1d2026]/50 backdrop-blur-sm rounded-[2rem] p-12 md:p-20 overflow-hidden relative border border-[#3a4a46]/10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#e1e2eb] mb-6 leading-tight">
                Stop guessing, start <span className="text-[#00f5d4]">validating</span>.
              </h2>
              <p className="text-[#b9cac4] mb-8 text-lg">
                Join 2,000+ founders using synthetic intelligence to build products that people actually want.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleAnalyze} className="bg-[#00f5d4] text-[#003d33] font-bold px-8 py-4 rounded-xl hover:opacity-90 transition-all">
                  Start Free Analysis
                </button>
                <button className="bg-[#272a31] text-[#e1e2eb] font-bold px-8 py-4 rounded-xl hover:bg-[#32353c] transition-all border border-[#3a4a46]/10">
                  View Sample Report
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-[#272a31] rounded-2xl p-6 shadow-2xl border border-[#3a4a46]/10 relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-[#32353c] flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <div className="text-[#e1e2eb] font-bold">Marketing Manager Mike</div>
                    <div className="text-xs text-[#b9cac4] uppercase tracking-widest font-bold">Synthetic Profile</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-[#1d2026] rounded-xl border border-[#3a4a46]/10">
                    <div className="text-xs font-bold text-[#94d3c3] mb-1">Objection</div>
                    <div className="text-sm text-[#b9cac4]">"The integration seems complex for our current stack..."</div>
                  </div>
                  <div className="p-4 bg-[#1d2026] rounded-xl border border-[#3a4a46]/10">
                    <div className="text-xs font-bold text-[#00f5d4] mb-1">Motivation</div>
                    <div className="text-sm text-[#b9cac4]">"Solving our attribution problem would save us 10h/week."</div>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-[#00f5d4]/10 blur-[100px] -z-0"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0b0e14] mt-20 border-t border-[#3a4a46]/15">
        <div className="max-w-7xl mx-auto w-full py-16 px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="text-lg font-bold text-[#e1e2eb] mb-6">Capysan</div>
              <p className="text-[#94d3c3]/60 text-sm leading-relaxed">
                The gold standard for synthetic market validation. Built for the next generation of data-driven founders.
              </p>
            </div>
            <div>
              <h5 className="text-[#e1e2eb] font-bold mb-6 text-sm uppercase tracking-widest">Product</h5>
              <ul className="space-y-4">
                <li>
                  <Link href="/" className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/use-cases" className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors">
                    Persona Library
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors">
                    Case Studies
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-[#e1e2eb] font-bold mb-6 text-sm uppercase tracking-widest">Company</h5>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-[#e1e2eb] font-bold mb-6 text-sm uppercase tracking-widest">Legal</h5>
              <ul className="space-y-4">
                <li>
                  <Link href="/privacy" className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#3a4a46]/15 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[#94d3c3]/40 text-xs font-medium">© 2024 Capysan AI. All rights reserved.</div>
            <div className="flex gap-6">
              <a className="text-[#94d3c3]/40 hover:text-[#00f5d4] transition-colors text-lg" href="#">
                🌐
              </a>
              <a className="text-[#94d3c3]/40 hover:text-[#00f5d4] transition-colors text-lg" href="#">
                ✉️
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
