import { jwtVerify } from 'jose';

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET

if (!SUPABASE_JWT_SECRET) {
  throw new Error('SUPABASE_JWT_SECRET environment variable is not set')
}

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
    console.error('[JWT] Verification failed')
    return null
  }
}

export function extractUserIdFromJWT(payload: JWTPayload): string {
  if (!payload.sub) {
    throw new Error('JWT payload missing required "sub" claim')
  }
  return payload.sub
}
