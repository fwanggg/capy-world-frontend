import { useState, useEffect } from 'react'

function App() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchMessage = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/hello')
        const data = await res.json()
        setMessage(data.message)
      } catch (error) {
        console.error('Failed to fetch message:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessage()
  }, [])

  return (
    <div className="app">
      <h1>Capybara AI</h1>
      <div className="container">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <p>{message || 'No message from server'}</p>
        )}
      </div>
    </div>
  )
}

export default App
