export function About() {
  return (
    <div>
      {/* Hero */}
      <section style={{
        padding: 'var(--space-4xl) var(--space-xl)',
        backgroundColor: 'var(--color-gray-50)',
      }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h1 style={{ marginBottom: 'var(--space-2xl)' }}>
            The Problem with User Research Today
          </h1>
          <p style={{ fontSize: 'var(--text-lg)' }}>
            Existing research tools are slow, expensive, and miss the nuance. You wait weeks for insights that don't capture implicit user needs. Copybar changes that.
          </p>
        </div>
      </section>

      {/* The Solution */}
      <section style={{ padding: 'var(--space-4xl) var(--space-xl)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ marginBottom: 'var(--space-xl)' }}>Our Solution</h2>
          <p style={{ marginBottom: 'var(--space-lg)' }}>
            Digital clones trained on real user personas. Each clone understands implicit needs, not just surface-level signals. You get instant feedback designed for action.
          </p>
          <p>
            Built for founders, marketers, and product teams who don't have time to wait. Test faster. Iterate smarter. Ship with confidence.
          </p>
        </div>
      </section>

      {/* Audience */}
      <section style={{
        backgroundColor: 'var(--color-navy)',
        color: 'var(--color-white)',
        padding: 'var(--space-4xl) var(--space-xl)',
      }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          <h2 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-xl)' }}>
            For Early-Stage Founders & Marketers
          </h2>
          <p style={{ color: 'var(--color-gray-200)', marginBottom: 'var(--space-lg)' }}>
            You're building something new. You need real feedback, not generic surveys. You need it fast. Copybar gives you honest, individual perspectives from AI personas trained on real user data.
          </p>
          <p style={{ color: 'var(--color-gray-200)' }}>
            Validate your go-to-market strategy. Test messaging. Find product gaps. All in minutes.
          </p>
        </div>
      </section>
    </div>
  )
}
