'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuthClient } from '@/hooks/useAuthClient'
import { SignInDialog } from '@/components/SignInDialog'

export function LandingNav() {
  const { user, loading, signOut } = useAuthClient()
  const [signInOpen, setSignInOpen] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
        <div className="flex items-center justify-between px-8 h-20 w-full max-w-7xl mx-auto">
          <Link href="/" className="text-xl font-bold tracking-[0.2em] text-on-surface font-headline uppercase">
            CAPYSAN
          </Link>
          <div className="flex items-center gap-10 font-headline tracking-tight text-sm font-medium">
            <a className="text-secondary hover:text-primary-container transition-colors" href="#">About</a>
            <Link href="/personas" className="text-secondary hover:text-primary-container transition-colors">Personas</Link>
          </div>
          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="flex items-center gap-2 px-4 py-2 bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">account_circle</span>
                      <span className="text-on-surface font-body text-sm">Account</span>
                    </button>
                    {showMenu && (
                      <div className="absolute top-full right-0 mt-2 bg-surface-container border border-outline-variant/20 rounded-lg shadow-lg min-w-40">
                        <button
                          onClick={() => {
                            signOut()
                            setShowMenu(false)
                          }}
                          className="w-full text-left px-4 py-3 text-on-surface hover:bg-surface-container-high transition-colors text-sm font-body flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">logout</span>
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setSignInOpen(true)}
                    className="px-6 py-2 bg-primary-container text-on-primary-container font-bold rounded-lg hover:brightness-110 transition-all text-sm flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">login</span>
                    Sign In
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </nav>
      <SignInDialog isOpen={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  )
}
