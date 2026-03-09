import { jwtVerify } from 'jose';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'your-supabase-jwt-secret'

interface JWTPayload {
  sub: string // user ID
  email?: string
  aud?: string
  exp?: number
  iat?: number
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '')

    // Use Supabase's JWT secret (available in Supabase project settings)
    const secret = new TextEncoder().encode(SUPABASE_JWT_SECRET)

    const verified = await jwtVerify(cleanToken, secret)
    return verified.payload as JWTPayload
  } catch (error) {
    console.error('[JWT] Verification failed:', error instanceof Error ? error.message : String(error))
    return null
  }
}

export function extractUserIdFromJWT(payload: JWTPayload): string {
  return payload.sub
}
