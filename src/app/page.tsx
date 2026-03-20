'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [url, setUrl] = useState('')

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    router.push(`/results?url=${encodeURIComponent(url)}`)
  }

  return (
    <div className="dark min-h-screen bg-[#0a0c10]">
      {/* Top Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-8 bg-[#0a0c10]/90 backdrop-blur-xl border-b border-[#2a3a36]/50">
        <Link href="/" className="text-xl font-bold tracking-[0.2em] text-[#e1e2eb] font-headline uppercase hover:text-[#00f5d4] transition-colors">CAPYSAN</Link>
        <nav className="flex items-center gap-8">
          <a className="text-[#94d3c3] hover:text-[#00f5d4] transition-colors text-sm font-medium" href="#">About</a>
          <a className="text-[#94d3c3] hover:text-[#00f5d4] transition-colors text-sm font-medium" href="#">Personas</a>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex flex-col pt-16">
        <main className="w-full">
          {/* Hero Section */}
          <section className="relative min-h-[80vh] flex items-center justify-center px-6 md:px-8 bg-hero-gradient">
            <div className="max-w-4xl mx-auto text-center z-10 w-full flex flex-col items-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00f5d4]/30 bg-[#00f5d4]/10 mb-10">
                <svg className="w-[18px] h-[18px] text-[#00f5d4]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9Zm-7.5 6.5L9.5 14 8 11.5 5.5 10l2.5-1.5L8 6l1.5-2.5L12 5l1.5 2.5L15 8l-2.5 1.5L12 11.5l-.5 4ZM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15Z" />
                </svg>
                <span className="text-[10px] font-bold text-[#00f5d4] tracking-[0.2em] uppercase">Synthetic Market Intelligence</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-7xl font-extrabold font-headline text-[#e1e2eb] tracking-tight mb-8 leading-[1]">
                Test PMF with <span className="text-[#00f5d4] text-glow">10 AI Personas</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg md:text-xl text-[#b9cac4] max-w-2xl mx-auto mb-12 leading-relaxed">
                Deploy a fleet of high-fidelity synthetic users to stress-test your value proposition before you spend a dime on ads.
              </p>

              {/* CTA Form */}
              <form onSubmit={handleAnalyze} className="w-full max-w-xl flex flex-col sm:flex-row sm:items-stretch rounded-2xl border border-[#2a3a36]/50 bg-[#0f1218] overflow-hidden">
                <div className="flex-1 flex items-center gap-3 px-5 py-4 sm:py-5 min-w-0">
                  <svg className="w-5 h-5 text-[#83948f] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste your landing page URL..."
                    className="bg-transparent border-none focus:ring-0 focus:outline-none text-[#e1e2eb] w-full placeholder:text-[#83948f]/60 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#00f5d4] text-[#00382f] font-bold px-8 py-4 sm:py-5 flex items-center justify-center gap-2 hover:brightness-110 transition-all group text-sm flex-shrink-0"
                >
                  Analyze Now
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>

              {/* Social Proof */}
              <div className="mt-16 flex justify-center items-center gap-12 text-[#3a4a46]">
                <div className="font-headline font-bold text-lg tracking-widest">VENTURE</div>
                <div className="font-headline font-bold text-lg tracking-widest">SAAS.CO</div>
                <div className="font-headline font-bold text-lg tracking-widest">LUMINARY</div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-[#0b0e14] border-t border-[#2a3a36]/40">
            <div className="max-w-6xl mx-auto w-full py-16 px-6 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-1">
                  <div className="text-lg font-bold text-[#e1e2eb] mb-6 font-headline tracking-widest uppercase">Capysan</div>
                  <p className="text-[#94d3c3]/60 text-sm font-body leading-relaxed">
                    The gold standard for synthetic market validation. Built for the next generation of data-driven founders.
                  </p>
                </div>
                <div>
                  <h5 className="text-[#e1e2eb] font-bold mb-6 text-sm uppercase tracking-widest">Product</h5>
                  <ul className="space-y-4">
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Features</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Persona Library</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Case Studies</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Pricing</a></li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-[#e1e2eb] font-bold mb-6 text-sm uppercase tracking-widest">Company</h5>
                  <ul className="space-y-4">
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">About Us</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Careers</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Contact</a></li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-[#e1e2eb] font-bold mb-6 text-sm uppercase tracking-widest">Legal</h5>
                  <ul className="space-y-4">
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Privacy Policy</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Terms of Service</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Data Processing</a></li>
                  </ul>
                </div>
              </div>
              <div className="pt-8 mt-8 border-t border-[#2a3a36]/40 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-[#94d3c3]/40 text-xs font-medium font-label">© 2024 Capysan AI. All rights reserved.</div>
                <div className="flex gap-6">
                  <a className="text-[#94d3c3]/40 hover:text-[#00f5d4] transition-colors text-xs" href="#">Twitter</a>
                  <a className="text-[#94d3c3]/40 hover:text-[#00f5d4] transition-colors text-xs" href="#">Contact</a>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
