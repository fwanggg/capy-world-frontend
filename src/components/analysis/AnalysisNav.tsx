'use client'

import Link from 'next/link'
import { analysisNavLinks } from '@/data/analysisPageData'
import { UserMenu } from '@/components/UserMenu'

interface AnalysisNavProps {
  readonly activeLink?: string
}

export function AnalysisNav({ activeLink }: Readonly<AnalysisNavProps>) {
  return (
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
          <UserMenu showName />
        </div>
      </div>
    </header>
  )
}
