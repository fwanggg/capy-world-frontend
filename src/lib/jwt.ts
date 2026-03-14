import { createSecretKey } from 'node:crypto'
import { jwtVerify, importJWK, createRemoteJWKSet } from 'jose'
import { log } from './logging'

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(
  /\/$/,
  ""
)
const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET

if (!SUPABASE_URL && !SUPABASE_JWT_SECRET) {
  log.error('jwt.env_missing', 'Set SUPABASE_URL for JWKS, or SUPABASE_JWT_SECRET for legacy HS256', {
    sourceFile: 'jwt.ts',
    sourceLine: 8
  })
  throw new Error('Set SUPABASE_URL or SUPABASE_JWT_SECRET for JWT verification')
}

/** JWKS for Supabase asymmetric keys (ES256, RS256) */
const jwks = SUPABASE_URL
  ? createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
  : null

/** Resolve key for legacy HS256 (JWK JSON or raw string) */
async function getLegacySecretKey(): Promise<unknown> {
  const raw = SUPABASE_JWT_SECRET!.trim()
  if (raw.startsWith('{')) {
    try {
      const jwk = JSON.parse(raw)
      if (jwk.kty && jwk.alg) {
        return await importJWK(jwk, jwk.alg)
      }
    } catch {
      /* fall through */
    }
  }
  return createSecretKey(Buffer.from(raw, 'utf-8'))
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
    const cleanToken = token.replace(/^Bearer\s+/i, '')
    const key = jwks ?? await getLegacySecretKey()

    const verified = await jwtVerify(cleanToken, key as CryptoKey)
    log.debug('jwt.verification_success', 'JWT token verified successfully', {
      sourceFile: 'jwt.ts',
      sourceLine: 48,
      metadata: { sub: verified.payload.sub }
    })
    return verified.payload as JWTPayload
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorType = error instanceof Error ? error.name : 'Unknown'
    log.error('jwt.verification_failed', `JWT verification failed: ${errorMessage}`, {
      sourceFile: 'jwt.ts',
      sourceLine: 56,
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
      sourceLine: 66,
      metadata: { payloadKeys: Object.keys(payload) }
    })
    throw new Error('JWT payload missing required "sub" claim')
  }
  return payload.sub
}
