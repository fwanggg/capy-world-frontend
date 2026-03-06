import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth'
import chatRoutes from './routes/chat'
import { requireAuth, requireApproval } from './middleware/auth'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// CORS headers middleware for additional control
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-user-id')
  next()
})

// Auth routes
app.use('/auth', authRoutes)

// Protected chat routes
app.use('/chat', requireAuth, requireApproval, chatRoutes)

// User profile endpoint
app.get('/user/profile', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const { supabase } = await import('shared')
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error

    res.json(user)
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from the backend! 🚀'
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
