'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthClient } from '@/hooks/useAuthClient'
import { SignInDialog } from '@/components/SignInDialog'

export function CTAForm() {
  const router = useRouter()
  const { user, loading } = useAuthClient()
  const [url, setUrl] = useState('')
  const [signInOpen, setSignInOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    if (!user) {
      setSignInOpen(true)
      return
    }

    router.push(`/results?url=${encodeURIComponent(url)}`)
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-surface-container-low p-1.5 rounded-full flex flex-col md:flex-row gap-2 shadow-2xl border border-outline-variant/10">
        <div className="flex-1 flex items-center px-6 py-3 gap-3">
          <span className="material-symbols-outlined text-outline">link</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste your landing page URL..."
            className="bg-transparent border-none focus:ring-0 text-on-surface w-full placeholder:text-on-surface-variant/40 font-body text-sm"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-primary-container text-on-primary-container font-bold px-8 py-3.5 rounded-full flex items-center justify-center gap-2 hover:brightness-110 transition-all group text-sm disabled:opacity-50"
        >
          Analyze Now
          <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
        </button>
      </form>
      <SignInDialog
        isOpen={signInOpen}
        onClose={() => setSignInOpen(false)}
        title="Sign in to Analyze"
        message="Sign in with Google to analyze your landing page and get feedback from AI personas."
      />
    </>
  )
}
