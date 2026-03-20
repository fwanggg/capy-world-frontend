export function LandingFooter() {
  return (
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
  )
}
