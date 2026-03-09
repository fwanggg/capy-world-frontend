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

      {/* CTA Section */}
      <section style={{
        backgroundColor: 'var(--color-navy)',
        color: 'var(--color-white)',
        padding: 'var(--space-4xl) var(--space-xl)',
        textAlign: 'center',
      }}>
        <div className="container">
          <h2 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-xl)' }}>
            Ready to Transform Your Research?
          </h2>
          <p style={{ color: 'var(--color-gray-300)', marginBottom: 'var(--space-2xl)' }}>
            Join founders and marketers who are validating ideas faster than ever.
          </p>
          <a href="/waitlist" className="btn btn-primary">
            Get Early Access
          </a>
        </div>
      </section>
    </div>
  )
}
