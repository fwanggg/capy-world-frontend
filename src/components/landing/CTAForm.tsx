'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CTAForm() {
  const router = useRouter()
  const [url, setUrl] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const raw = url.trim()
    if (!raw) return
    const normalized =
      raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`
    router.push(`/results?url=${encodeURIComponent(normalized)}`)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-xl mx-auto bg-surface-container-low p-1.5 rounded-full flex flex-col md:flex-row gap-2 shadow-2xl border border-outline-variant/10">
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
  )
}
