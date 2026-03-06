export function Docs() {
  return (
    <div>
      {/* Hero Section */}
      <section style={{
        paddingTop: 'var(--space-4xl)',
        paddingBottom: 'var(--space-4xl)',
        paddingLeft: 'var(--space-xl)',
        paddingRight: 'var(--space-xl)',
        backgroundColor: 'var(--color-gray-50)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{ marginBottom: 'var(--space-lg)' }}>Getting Started with Copybar</h1>
          <p style={{ fontSize: 'var(--text-lg)' }}>
            Launch your research in four simple steps. Test your ideas against real user personas in minutes.
          </p>
        </div>
      </section>

      {/* Steps Section */}
      <section style={{
        padding: 'var(--space-4xl) var(--space-xl)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div className="grid grid-2" style={{ marginBottom: 'var(--space-4xl)' }}>
            {[
              {
                step: '1',
                title: 'Join the Waitlist',
                desc: 'Click "Join Waitlist" to sign up with Google. We\'ll review your request and grant access shortly.',
              },
              {
                step: '2',
                title: 'Enter God Mode',
                desc: 'Once approved, log in and describe your research goal. Example: "Test my sales pitch on early-stage SaaS founders." Copybar AI will suggest relevant digital clones to chat with.',
              },
              {
                step: '3',
                title: 'Enter Conversation Mode',
                desc: 'Select your clones and ask them questions. Each clone responds with their individual perspective.',
              },
              {
                step: '4',
                title: 'Get Insights',
                desc: 'Review responses to identify patterns and gaps in your pitch or product positioning.',
              },
            ].map((item) => (
              <div key={item.step} className="card" style={{ position: 'relative', paddingLeft: 'var(--space-3xl)' }}>
                <div style={{
                  position: 'absolute',
                  left: 'var(--space-base)',
                  top: 'var(--space-base)',
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-teal)',
                  color: 'var(--color-white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: 'var(--text-lg)',
                }}>
                  {item.step}
                </div>
                <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-base)' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 'var(--text-base)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pro Tips Section */}
      <section style={{
        backgroundColor: 'var(--color-navy)',
        color: 'var(--color-white)',
        padding: 'var(--space-4xl) var(--space-xl)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ color: 'var(--color-white)', marginBottom: 'var(--space-2xl)' }}>Pro Tips</h2>
          <ul style={{
            listStyle: 'none',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--space-2xl)',
          }}>
            {[
              'Be specific in your questions',
              'Ask follow-ups to dig deeper',
              'Use @mentions to target specific clones',
              'Switch back to God Mode for guidance anytime',
            ].map((tip, idx) => (
              <li key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-base)',
              }}>
                <span style={{
                  color: 'var(--color-teal)',
                  fontWeight: '700',
                  marginTop: '0.25rem',
                }}>
                  ✓
                </span>
                <span style={{ color: 'var(--color-gray-200)' }}>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
