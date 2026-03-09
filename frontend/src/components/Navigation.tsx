import { useState } from 'react'

export function Navigation() {
  const [isAuth] = useState(false)

  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <a href="/" style={{ fontWeight: 'bold', textDecoration: 'none' }}>Capybara</a>
      <a href="/about" style={{ textDecoration: 'none' }}>About</a>
      <a href="/docs" style={{ textDecoration: 'none' }}>Docs</a>
      {!isAuth && <a href="/waitlist" style={{ textDecoration: 'none' }}>Join Waitlist</a>}
      {isAuth && <a href="/chat" style={{ textDecoration: 'none' }}>Chat</a>}
    </nav>
  )
}
