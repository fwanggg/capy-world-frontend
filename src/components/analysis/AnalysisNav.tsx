import Link from 'next/link'
import { analysisNavLinks } from '@/data/analysisPageData'

interface AnalysisNavProps {
  readonly activeLink?: string
}

export function AnalysisNav({ activeLink }: Readonly<AnalysisNavProps>) {
  return (
    <header className="fixed top-0 w-full z-50 bg-[#10131a]/80 backdrop-blur-xl border-b border-outline-variant/10">
      <div className="flex items-center justify-between px-8 h-16 w-full max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold tracking-tighter text-[#e1e2eb] font-headline hover:text-[#00f5d4] transition-colors">
            CAPYSAN
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <nav className="flex gap-8 items-center h-full font-['Manrope'] tracking-tight text-sm font-semibold">
            {analysisNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  activeLink === link.label.toLowerCase()
                    ? 'text-[#00f5d4]'
                    : 'text-[#94d3c3] hover:text-[#00f5d4]'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#94d3c3] hover:text-[#e1e2eb] cursor-pointer active:scale-95 duration-200">
              settings
            </span>
            <span className="material-symbols-outlined text-[#94d3c3] hover:text-[#e1e2eb] cursor-pointer active:scale-95 duration-200">
              notifications
            </span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/20 active:scale-95 transition-transform bg-surface-container" />
        </div>
      </div>
    </header>
  )
}
