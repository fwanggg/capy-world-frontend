export function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section style={{
        paddingTop: 'var(--space-4xl)',
        paddingBottom: 'var(--space-4xl)',
        paddingLeft: 'var(--space-xl)',
        paddingRight: 'var(--space-xl)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{
            fontSize: 'var(--text-5xl)',
            marginBottom: 'var(--space-xl)',
            lineHeight: 'var(--line-tight)',
          }}>
            Talk to Digital Clones.<br />
            <span style={{ color: 'var(--color-teal)' }}>Get Honest Feedback in Minutes.</span>
          </h1>

          <p style={{
            fontSize: 'var(--text-xl)',
            marginBottom: 'var(--space-3xl)',
            color: 'var(--color-gray-500)',
            maxWidth: '600px',
            margin: '0 auto var(--space-3xl)',
          }}>
            Instant, actionable user research powered by AI. Test your pitch, validate ideas, and find gaps—without waiting weeks for surveys.
          </p>

          <a href="/waitlist" className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }}>
            Join the Waitlist
          </a>
        </div>
      </section>

      {/* Value Props */}
      <section style={{
        backgroundColor: 'var(--color-gray-50)',
        padding: 'var(--space-4xl) var(--space-xl)',
      }}>
        <div className="container">
          <h2 style={{
            textAlign: 'center',
            marginBottom: 'var(--space-3xl)',
            fontSize: 'var(--text-3xl)',
          }}>
            Why Capybara Works
          </h2>

          <div className="grid grid-2" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {[
              { title: 'Speed', desc: 'Get feedback in minutes, not weeks' },
              { title: 'Depth', desc: 'Real user perspectives, not aggregated patterns' },
              { title: 'Actionability', desc: 'Catch what will actually fail with users' },
              { title: 'AI-Powered', desc: 'Fully intelligent digital personas at scale' },
            ].map((item) => (
              <div key={item.title} className="card">
                <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-base)' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 'var(--text-base)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--color-navy)',
        color: 'var(--color-gray-300)',
        padding: 'var(--space-3xl) var(--space-xl)',
        borderTop: '1px solid var(--color-gray-700)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3xl)',
            marginBottom: 'var(--space-3xl)',
          }}>
            {/* Company Info */}
            <div>
              <h3 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-base)', fontSize: 'var(--text-lg)' }}>
                Capybara AI
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
                AI-powered user research for founders and marketers.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-base)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                Product
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: 'var(--space-sm)' }}>
                  <a href="/" style={{ color: 'var(--color-gray-300)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
                    Home
                  </a>
                </li>
                <li style={{ marginBottom: 'var(--space-sm)' }}>
                  <a href="/waitlist" style={{ color: 'var(--color-gray-300)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
                    Join Waitlist
                  </a>
                </li>
                <li>
                  <a href="/docs" style={{ color: 'var(--color-gray-300)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
                    Docs
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-base)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                Legal
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ marginBottom: 'var(--space-sm)' }}>
                  <a href="#" style={{ color: 'var(--color-gray-300)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" style={{ color: 'var(--color-gray-300)', textDecoration: 'none', fontSize: 'var(--text-sm)' }}>
                    Terms
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div style={{
            borderTop: '1px solid var(--color-gray-700)',
            paddingTop: 'var(--space-2xl)',
            textAlign: 'center',
            fontSize: 'var(--text-sm)',
            color: 'var(--color-gray-400)',
          }}>
            <p>© 2025 Capybara AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
