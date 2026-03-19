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
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-8 pt-20 pb-16 overflow-hidden bg-gradient-to-br from-[#10131a] via-[#10131a] to-[#1a1f2e]">
        <div className="w-full max-w-4xl mx-auto text-center z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0b5347]/30 border border-[#3a4a46]/15 mb-8">
            <span className="text-xs font-medium text-[#94d3c3] tracking-wider uppercase">Next-Gen Market Intelligence</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-6xl md:text-7xl font-extrabold text-[#e1e2eb] tracking-tight mb-8 leading-[1.2]">
            Test Product-Market Fit With <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f5d4] to-[#94d3c3]">10 AI Personas</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[#b9cac4] max-w-3xl mx-auto mb-16 leading-relaxed">
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
                className="bg-transparent border-none focus:ring-0 focus:outline-none text-[#e1e2eb] w-full placeholder:text-[#b9cac4]/50 text-sm"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="bg-[#00f5d4] text-[#003d33] font-bold px-8 py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
              <span>→</span>
            </button>
          </form>

          {/* Social Proof */}
          <div className="mt-16 flex justify-center gap-12 opacity-40 text-xs font-bold tracking-widest">
            <div>VENTURE</div>
            <div>SAAS.CO</div>
            <div>LUMINARY</div>
          </div>
        </div>

        {/* Background Shapes */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#00f5d4]/5 rounded-full blur-[120px]"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0b5347]/10 rounded-full blur-[120px]"></div>
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
