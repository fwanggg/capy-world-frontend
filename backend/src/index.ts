import express from 'express'
import cors from 'cors'
import chatRoutes from './routes/chat'
import cloneRoutes from './routes/clones'
import { requireAuth, requireApproval, AuthRequest } from './middleware/auth'
import { supabase } from 'shared'
import { userIdToUUID } from './utils/uuid'

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

// Protected chat routes
app.use('/chat', requireAuth, requireApproval, chatRoutes)

// Protected clone routes
app.use('/clones', requireAuth, cloneRoutes)

// User profile endpoint
app.get('/user/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    // User ID comes from Authorization header (verified by requireAuth middleware)
    // req.userId is guaranteed by requireAuth middleware
    const userIdFromJWT = req.userId!

    // Convert JWT user ID to UUID for database lookup
    const userId = userIdToUUID(userIdFromJWT)

    const { data: user, error } = await supabase
      .from('app_users')
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
