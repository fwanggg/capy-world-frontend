import { Router } from 'express'
import { AuthRequest } from '../middleware/auth'

const router = Router()

// Chat routes will be implemented here
// These routes are protected by requireAuth and requireApproval middleware

export default router
