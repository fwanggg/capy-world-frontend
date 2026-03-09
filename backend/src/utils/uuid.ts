import { createHash } from 'crypto'

/**
 * Convert a string user ID (from JWT) to a deterministic UUID v4 format
 * Used to maintain consistent user ID format in database
 */
export function userIdToUUID(userId: string): string {
  const hash = createHash('md5').update(userId).digest('hex')
  // Convert first 16 hex chars to UUID v4 format
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-a${hash.substring(17, 20)}-${hash.substring(20, 32)}`
}

/**
 * Generate a random UUID v4
 */
export function generateUUID(): string {
  const chars = '0123456789abcdef'
  let uuid = ''
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += '-'
    } else if (i === 14) {
      uuid += '4' // UUID v4
    } else {
      uuid += chars[Math.floor(Math.random() * (i === 19 ? 4 : 16))]
    }
  }
  return uuid
}
