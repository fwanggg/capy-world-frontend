import { Request, Response, NextFunction } from 'express'
import { verifyJWT, extractUserIdFromJWT } from '../utils/jwt'
import { supabase } from 'shared'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers['authorization']
    console.log('[AUTH] Authorization header present:', !!authHeader)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH] Missing or invalid Authorization header')
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const token = authHeader.slice(7) // Remove 'Bearer ' prefix
    console.log('[AUTH] Token preview:', token.substring(0, 20) + '...')
    const payload = await verifyJWT(token)

    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const userId = extractUserIdFromJWT(payload)
    req.userId = userId
    req.userEmail = payload.email

    next()
  } catch (error) {
    console.error('[AUTH] Middleware error:', error instanceof Error ? error.message : String(error))
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

export async function requireApproval(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const { data: user, error } = await supabase
      .from('app_users')
      .select('approved')
      .eq('id', req.userId)
      .single()

    if (error || !user) {
      console.log('[APPROVAL] User not found in app_users:', req.userId)
      // User will be created on first chat init, allow to proceed to show pending approval UI
      return next()
    }

    if (!user.approved) {
      return res.status(403).json({ error: 'Pending approval' })
    }

    next()
  } catch (error) {
    console.error('[APPROVAL] Check failed:', error instanceof Error ? error.message : String(error))
    return res.status(500).json({ error: 'Approval check failed' })
  }
}
