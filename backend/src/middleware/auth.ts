import { Request, Response, NextFunction } from 'express'

export interface AuthRequest extends Request {
  userId?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string

  if (!userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  req.userId = userId
  next()
}

export function requireApproval(req: AuthRequest, res: Response, next: NextFunction) {
  // Check approval status (will be added in DB lookup)
  // For now, just ensure auth middleware ran first
  if (!req.userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}
