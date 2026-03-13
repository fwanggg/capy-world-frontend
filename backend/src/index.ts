import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') })

import express from 'express'
import cors from 'cors'
import { supabase } from 'shared'
import chatRoutes from './routes/chat'
import cloneRoutes from './routes/clones'
import studyroomRoutes from './routes/studyrooms'
import { requireAuth, requireApproval, AuthRequest } from './middleware/auth'

const app = express()
const PORT = 3001

// ⚠️ DEV MODE WARNING
if (process.env.DEV === 'true') {
  console.warn('⚠️⚠️⚠️ DEVELOPMENT MODE ENABLED ⚠️⚠️⚠️')
  console.warn('⚠️ JWT verification is DISABLED - tokens accepted without signature verification')
  console.warn('⚠️ NEVER set DEV=true in production!')
  console.warn('⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️')
}

app.use(cors())
app.use(express.json())

// Protected chat routes
app.use('/chat', requireAuth, requireApproval, chatRoutes)

// Protected clone routes
app.use('/clones', requireAuth, cloneRoutes)

// Protected studyroom routes
app.use('/studyrooms', requireAuth, requireApproval, studyroomRoutes)

// User profile endpoint
app.get('/user/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    // User ID comes from Authorization header (verified by requireAuth middleware)
    // req.userId is guaranteed by requireAuth middleware and is the Supabase auth user ID
    const userId = req.userId!

    const { data: user, error } = await supabase
      .from('waitlist')
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

// Test endpoint - verify backend is responding
app.get('/test', (req, res) => {
  console.log('[TEST] Request received')
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

// Waitlist endpoint - creates user record when they sign in
app.post('/waitlist/join', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!
    const email = req.userEmail || 'unknown@example.com'
    const isDev = process.env.DEV === 'true'

    console.log('[WAITLIST_JOIN] Request received', { userId, email, isDev })

    // UPSERT user into waitlist - create if doesn't exist, update if does
    const { data: user, error } = await supabase
      .from('waitlist')
      .upsert({
        user_id: userId,
        approval_status: isDev ? 'approved' : 'pending',
      }, { onConflict: 'user_id' })
      .select('approval_status')
      .single()

    if (error) {
      console.error('[WAITLIST_JOIN] Upsert error:', error.message, error.details)
      return res.status(500).json({ error: 'Failed to join waitlist', details: error.message })
    }

    console.log('[WAITLIST_JOIN] ✓ User created/updated:', userId, 'status:', user?.approval_status)
    res.json({ approval_status: user?.approval_status })
  } catch (error) {
    console.error('[WAITLIST_JOIN] Exception:', error instanceof Error ? error.message : error)
    res.status(500).json({ error: 'Failed to join waitlist' })
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
