import { Router, Request, Response } from 'express'
import { supabase } from 'shared'

const router = Router()

interface GoogleTokenPayload {
  email: string
  sub: string
  name?: string
}

/**
 * POST /auth/google
 * Exchange Google ID token for session
 */
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Missing token' })
    }

    // Verify token with Google (simplified - in production use google-auth-library)
    // For now, trust the frontend JWT decoding
    const googleId = extractGoogleId(token)
    const email = extractEmail(token)

    if (!googleId || !email) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get or create user
    let { data: user, error: userError } = await supabase
      .from('app_users')
      .select('*')
      .eq('google_id', googleId)
      .single()

    if (userError && userError.code !== 'PGRST116') {
      throw userError
    }

    if (!user) {
      // Create new user + add to waitlist
      const { data: newUser, error: createError } = await supabase
        .from('app_users')
        .insert({ email, google_id: googleId, approved: false })
        .select()
        .single()

      if (createError) throw createError

      // Add to waitlist
      await supabase.from('waitlist').insert({ user_id: newUser.id })

      user = newUser
    }

    // Return user + approval status
    res.json({
      user_id: user.id,
      email: user.email,
      approved: user.approved,
      session_token: generateSessionToken(user.id),
    })
  } catch (error) {
    console.error('Auth error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
})

/**
 * POST /auth/logout
 * Clear session
 */
router.post('/logout', (req: Request, res: Response) => {
  // Session tokens managed client-side in localStorage
  res.json({ success: true })
})

// Helper functions (placeholder)
function extractGoogleId(token: string): string | null {
  // In production, verify JWT signature with Google's public keys
  // For MVP, decode without verification (unsafe for production)
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.sub || null
  } catch {
    return null
  }
}

function extractEmail(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    return payload.email || null
  } catch {
    return null
  }
}

function generateSessionToken(userId: string): string {
  // Simple token (in production, use JWT)
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64')
}

export default router
