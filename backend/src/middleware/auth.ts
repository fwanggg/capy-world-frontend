import { Request, Response, NextFunction } from 'express'
import { verifyJWT, extractUserIdFromJWT } from '../utils/jwt'
import { userIdToUUID } from '../utils/uuid'
import { supabase } from 'shared'

export interface AuthRequest extends Request {
  userId?: string
  userEmail?: string
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const isDev = process.env.DEV === 'true'

    // In dev mode, accept x-user-id header for testing
    if (isDev) {
      const userIdHeader = req.headers['x-user-id']
      if (userIdHeader) {
        const userHeaderStr = String(userIdHeader)
        const userId = userIdToUUID(userHeaderStr)
        console.log('[AUTH] DEV MODE: Using x-user-id header:', userHeaderStr, '=>', userId)
        req.userId = userId
        req.userEmail = 'dev@example.com'
        return next()
      }
    }

    const authHeader = req.headers['authorization']
    console.log('[AUTH] Authorization header present:', !!authHeader)

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH] Missing or invalid Authorization header')
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const token = authHeader.slice(7) // Remove 'Bearer ' prefix
    console.log('[AUTH] Token preview:', token.substring(0, 20) + '...')

    // In dev mode, accept any token and extract user ID from it
    if (isDev) {
      try {
        // Try to parse the JWT without verification in dev mode
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
          const userId = payload.sub || 'dev-user-' + Date.now()
          console.log('[AUTH] DEV MODE: Accepting token without verification, userId:', userId)
          req.userId = userId
          req.userEmail = payload.email || 'dev@example.com'
          return next()
        }
      } catch (e) {
        console.log('[AUTH] DEV MODE: Could not parse JWT, treating as dev token')
        // Fall through to treat as unknown token
        const userId = 'dev-user-' + Date.now()
        req.userId = userId
        req.userEmail = 'dev@example.com'
        return next()
      }
    }

    // Production: verify JWT signature
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

  // Skip approval check for localhost (development)
  const host = req.hostname || req.host || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  if (isLocalhost) {
    console.log('[APPROVAL] Localhost detected, skipping approval check')
    return next()
  }

  try {
    const { data: user, error } = await supabase
      .from('waitlist')
      .select('approval_status')
      .eq('id', req.userId)
      .single()

    if (error || !user) {
      console.log('[APPROVAL] User not found in waitlist:', req.userId)
      // User will be created on first signin, allow to proceed
      return next()
    }

    if (user.approval_status !== 'approved') {
      return res.status(403).json({ error: 'Pending approval' })
    }

    next()
  } catch (error) {
    console.error('[APPROVAL] Check failed:', error instanceof Error ? error.message : String(error))
    return res.status(500).json({ error: 'Approval check failed' })
  }
}
