import { jwtVerify, importJWK } from 'jose'
import { log } from '../services/logging'

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET

if (!SUPABASE_JWT_SECRET) {
  log.error('jwt.env_missing', 'SUPABASE_JWT_SECRET environment variable is not set', {
    sourceFile: 'jwt.ts',
    sourceLine: 6
  })
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

    // Parse the JWK from environment variable (guaranteed to exist by check above)
    const jwk = JSON.parse(SUPABASE_JWT_SECRET!)
    const secret = await importJWK(jwk, jwk.alg)

    const verified = await jwtVerify(cleanToken, secret)
    log.debug('jwt.verification_success', 'JWT token verified successfully', {
      sourceFile: 'jwt.ts',
      sourceLine: 29,
      metadata: { sub: verified.payload.sub }
    })
    return verified.payload as JWTPayload
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorType = error instanceof Error ? error.name : 'Unknown'
    log.error('jwt.verification_failed', `JWT verification failed: ${errorMessage}`, {
      sourceFile: 'jwt.ts',
      sourceLine: 37,
      metadata: {
        errorType,
        tokenPreview: token.substring(0, 20) + '...'
      }
    })
    return null
  }
}

export function extractUserIdFromJWT(payload: JWTPayload): string {
  if (!payload.sub) {
    log.error('jwt.missing_sub_claim', 'JWT payload missing required "sub" claim', {
      sourceFile: 'jwt.ts',
      sourceLine: 47,
      metadata: { payloadKeys: Object.keys(payload) }
    })
    throw new Error('JWT payload missing required "sub" claim')
  }
  return payload.sub
}
