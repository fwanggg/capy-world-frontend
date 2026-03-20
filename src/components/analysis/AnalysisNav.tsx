'use client'

import Link from 'next/link'
import { useState } from 'react'
import { analysisNavLinks } from '@/data/analysisPageData'
import { useAuthClient } from '@/hooks/useAuthClient'
import { SignInDialog } from '@/components/SignInDialog'

interface AnalysisNavProps {
  readonly activeLink?: string
}

export function AnalysisNav({ activeLink }: Readonly<AnalysisNavProps>) {
  const { user, loading, signOut } = useAuthClient()
  const [signInOpen, setSignInOpen] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/40">
        <div className="flex items-center justify-between px-8 h-16 w-full max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold tracking-tighter text-on-surface font-headline hover:text-primary-container transition-colors">
              CAPYSAN
            </Link>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <nav className="flex gap-8 items-center h-full font-headline tracking-tight text-sm font-semibold">
              {analysisNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`transition-colors ${
                    activeLink === link.label.toLowerCase()
                      ? 'text-primary-container'
                      : 'text-on-surface-variant hover:text-primary-container'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">account_circle</span>
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
                    className="px-4 py-1.5 bg-primary-container text-on-primary-container font-bold rounded-lg hover:brightness-110 transition-all text-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">login</span>
                    Sign In
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>
      <SignInDialog isOpen={signInOpen} onClose={() => setSignInOpen(false)} />
    </>
  )
}
