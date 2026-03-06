export function Home() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <h1>Talk to 10 Digital Clones. Get Honest Feedback in Minutes.</h1>
      <p>Instant, actionable user research — not aggregated summaries.</p>
      <div>
        <h2>Why Copybar?</h2>
        <ul>
          <li><strong>Speed:</strong> Get feedback in minutes, not weeks</li>
          <li><strong>Depth:</strong> Real user perspectives, not patterns</li>
          <li><strong>Actionability:</strong> Catch what will actually fail</li>
          <li><strong>AI-Native:</strong> Fully powered by advanced AI</li>
        </ul>
      </div>
      <button style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
        <a href="/waitlist" style={{ textDecoration: 'none', color: 'inherit' }}>Join the Waitlist</a>
      </button>
    </div>
  )
}
