import Link from 'next/link'

export function LandingNav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-[#0a0c10]/80 backdrop-blur-xl border-b border-outline-variant/10">
      <div className="flex items-center justify-between px-8 h-20 w-full max-w-7xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-[0.2em] text-[#e1e2eb] font-headline uppercase">
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
  )
}
