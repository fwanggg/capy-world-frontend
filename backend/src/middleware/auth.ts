import { Request, Response, NextFunction } from 'express'
import { verifyJWT, extractUserIdFromJWT } from '../utils/jwt'
import { userIdToUUID } from '../utils/uuid'
import { supabase } from 'shared'
import { log } from '../services/logging'

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
        log.info('auth.dev_mode', 'DEV MODE: Converting x-user-id header to UUID', {
          sourceFile: 'auth.ts',
          sourceLine: 22,
          metadata: { header: userHeaderStr, convertedUserId: userId }
        })
        req.userId = userId
        req.userEmail = 'dev@example.com'
        return next()
      }
    }

    const authHeader = req.headers['authorization']
    log.info('auth.header_check', 'Authorization header check', {
      sourceFile: 'auth.ts',
      sourceLine: 35,
      metadata: { headerPresent: !!authHeader }
    })

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      log.error('auth.header_missing', 'Missing or invalid Authorization header', {
        sourceFile: 'auth.ts',
        sourceLine: 41,
        metadata: { headerPresent: !!authHeader }
      })
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const token = authHeader.slice(7) // Remove 'Bearer ' prefix
    log.info('auth.token_verify', 'Verifying JWT token', {
      sourceFile: 'auth.ts',
      sourceLine: 48,
      metadata: { tokenPreview: token.substring(0, 20) + '...' }
    })
    const payload = await verifyJWT(token)

    if (!payload) {
      log.error('auth.token_invalid', 'JWT verification returned null', {
        sourceFile: 'auth.ts',
        sourceLine: 54,
        metadata: { tokenPreview: token.substring(0, 20) + '...' }
      })
      return res.status(401).json({ error: 'Invalid token' })
    }

    const userId = extractUserIdFromJWT(payload)
    req.userId = userId
    req.userEmail = payload.email

    log.info('auth.success', 'User authenticated successfully', {
      sourceFile: 'auth.ts',
      sourceLine: 67,
      userId: userId,
      metadata: { email: payload.email }
    })

    next()
  } catch (error) {
    log.error('auth.extraction_failed', error instanceof Error ? error.message : String(error), {
      sourceFile: 'auth.ts',
      sourceLine: 76,
      metadata: { errorType: error instanceof Error ? error.name : 'Unknown' }
    })
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

export async function requireApproval(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    log.error('approval.no_user_id', 'User ID not found in request', {
      sourceFile: 'auth.ts',
      sourceLine: 87
    })
    return res.status(401).json({ error: 'Not authenticated' })
  }

  // Skip approval check for localhost (development)
  const host = req.hostname || req.host || ''
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
  if (isLocalhost) {
    log.info('approval.localhost_skip', 'Localhost detected, skipping approval check', {
      sourceFile: 'auth.ts',
      sourceLine: 97,
      userId: req.userId,
      metadata: { host }
    })
    return next()
  }

  try {
    log.info('approval.check_start', 'Starting approval check', {
      sourceFile: 'auth.ts',
      sourceLine: 106,
      userId: req.userId
    })

    const { data: user, error } = await supabase
      .from('waitlist')
      .select('approval_status')
      .eq('id', req.userId)
      .single()

    if (error || !user) {
      log.warn('approval.user_not_found', 'User not found in waitlist table', {
        sourceFile: 'auth.ts',
        sourceLine: 115,
        userId: req.userId,
        metadata: { error: error?.message }
      })
      // User will be created on first signin, allow to proceed
      return next()
    }

    if (user.approval_status !== 'approved') {
      log.error('approval.not_approved', 'User approval status is not approved', {
        sourceFile: 'auth.ts',
        sourceLine: 125,
        userId: req.userId,
        metadata: { approvalStatus: user.approval_status }
      })
      return res.status(403).json({ error: 'Pending approval' })
    }

    log.info('approval.success', 'User approval check passed', {
      sourceFile: 'auth.ts',
      sourceLine: 133,
      userId: req.userId
    })

    next()
  } catch (error) {
    log.error('approval.check_failed', error instanceof Error ? error.message : String(error), {
      sourceFile: 'auth.ts',
      sourceLine: 141,
      userId: req.userId,
      metadata: { errorType: error instanceof Error ? error.name : 'Unknown' }
    })
    return res.status(500).json({ error: 'Approval check failed' })
  }
}
