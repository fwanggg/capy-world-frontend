/**
 * @deprecated Replaced by src/components/landing/* composition in src/app/page.tsx
 * Kept for reference during migration.
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function HomeDeprecated() {
  const router = useRouter()
  const [url, setUrl] = useState('')

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return
    router.push(`/results?url=${encodeURIComponent(url)}`)
  }

  return (
    <div className="dark">
      <nav className="fixed top-0 w-full z-50 bg-[#0a0c10]/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex items-center justify-between px-8 h-20 w-full max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold tracking-[0.2em] text-[#e1e2eb] font-headline uppercase hover:text-[#00f5d4] transition-colors">
            CAPYSAN
          </Link>
          <div className="flex items-center gap-10 font-['Manrope'] tracking-tight text-sm font-medium">
            <a className="text-[#94d3c3] hover:text-[#00f5d4] transition-colors" href="#">About</a>
            <Link href="/personas" className="text-[#94d3c3] hover:text-[#00f5d4] transition-colors">Personas</Link>
          </div>
          <div className="flex items-center gap-4">
            <button className="material-symbols-outlined text-[#94d3c3] hover:bg-[#1d2026] p-2 rounded-lg transition-all active:scale-95 duration-200" aria-label="Notifications">notifications</button>
            <button className="material-symbols-outlined text-[#94d3c3] hover:bg-[#1d2026] p-2 rounded-lg transition-all active:scale-95 duration-200" aria-label="Settings">settings</button>
          </div>
        </div>
      </nav>

      <div className="flex flex-col pt-20">
        <main className="w-full">
          <section className="relative min-h-[80vh] flex items-center justify-center px-8 bg-hero-gradient">
            <div className="max-w-4xl mx-auto text-center z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-container/20 bg-primary-container/5 mb-10">
                <span className="material-symbols-outlined text-primary-container text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <span className="text-[10px] font-bold font-label text-primary-container tracking-[0.2em] uppercase">Synthetic Market Intelligence</span>
              </div>

              <h1 className="text-6xl md:text-[84px] font-extrabold font-headline text-on-surface tracking-tight mb-8 leading-[1]">
                Test PMF with <span className="text-primary-container text-glow">10 AI Personas</span>
              </h1>

              <p className="text-xl text-on-surface-variant max-w-2xl mx-auto mb-16 font-body leading-relaxed opacity-80">
                Deploy a fleet of high-fidelity synthetic users to stress-test your value proposition before you spend a dime on ads.
              </p>

              <form onSubmit={handleAnalyze} className="max-w-xl mx-auto bg-surface-container-low p-1.5 rounded-full flex flex-col md:flex-row gap-2 shadow-2xl border border-outline-variant/10">
                <div className="flex-1 flex items-center px-6 py-3 gap-3">
                  <span className="material-symbols-outlined text-outline">link</span>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste your landing page URL..."
                    className="bg-transparent border-none focus:ring-0 text-on-surface w-full placeholder:text-on-surface-variant/40 font-body text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-primary-container text-on-primary-container font-bold px-8 py-3.5 rounded-full flex items-center justify-center gap-2 hover:brightness-110 transition-all group text-sm"
                >
                  Analyze Now
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </button>
              </form>

              <div className="mt-20 flex justify-center items-center gap-12 opacity-30 grayscale hover:opacity-50 transition-opacity duration-500">
                <div className="font-headline font-bold text-lg tracking-widest">VENTURE</div>
                <div className="font-headline font-bold text-lg tracking-widest">SAAS.CO</div>
                <div className="font-headline font-bold text-lg tracking-widest">LUMINARY</div>
              </div>
            </div>
          </section>

          <footer className="bg-[#0b0e14]">
            <div className="max-w-7xl mx-auto w-full py-16 px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-1">
                  <div className="text-lg font-bold text-[#e1e2eb] mb-6 font-headline tracking-widest uppercase">Capysan</div>
                  <p className="text-[#94d3c3]/60 text-sm font-body leading-relaxed">
                    The gold standard for synthetic market validation. Built for the next generation of data-driven founders.
                  </p>
                </div>
                <div>
                  <h5 className="text-on-surface font-bold mb-6 text-sm uppercase tracking-widest">Product</h5>
                  <ul className="space-y-4">
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Features</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Persona Library</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Case Studies</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Pricing</a></li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-on-surface font-bold mb-6 text-sm uppercase tracking-widest">Company</h5>
                  <ul className="space-y-4">
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">About Us</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Careers</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Contact</a></li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-on-surface font-bold mb-6 text-sm uppercase tracking-widest">Legal</h5>
                  <ul className="space-y-4">
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Privacy Policy</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Terms of Service</a></li>
                    <li><a className="text-[#94d3c3]/60 hover:text-[#00f5d4] text-xs font-medium transition-colors" href="#">Data Processing</a></li>
                  </ul>
                </div>
              </div>
              <div className="pt-8 border-t border-[#3a4a46]/15 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-[#94d3c3]/40 text-xs font-medium font-label">© 2024 Capysan AI. All rights reserved.</div>
                <div className="flex gap-6">
                  <a className="text-[#94d3c3]/40 hover:text-[#00f5d4] transition-colors" href="#"><span className="material-symbols-outlined text-sm">public</span></a>
                  <a className="text-[#94d3c3]/40 hover:text-[#00f5d4] transition-colors" href="#"><span className="material-symbols-outlined text-sm">alternate_email</span></a>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}
