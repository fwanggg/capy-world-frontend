import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Home } from './pages/Home'
import { About } from './pages/About'
import { Docs } from './pages/Docs'
import { Waitlist } from './pages/Waitlist'
import { Chat } from './pages/Chat'
import { AuthCallback } from './pages/AuthCallback'

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/waitlist" element={<Waitlist />} />
        <Route path="/chat" element={<ProtectedRoute component={<Chat />} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
