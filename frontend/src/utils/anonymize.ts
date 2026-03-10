/**
 * Convert a username to an anonymized deterministic identifier (hash).
 *
 * Design:
 * - Deterministic: same username always produces same hash
 * - Anonymized: hash is opaque, doesn't reveal original username
 * - Future-proof: can improve hash algorithm later without breaking consistency
 *
 * Used for: displaying clone participants in sidebar while maintaining user privacy
 * and enabling future deduplication (same hash = same person across sessions)
 *
 * @param username - The original username (e.g., reddit handle)
 * @returns Anonymized hash string (e.g., "a7f2b9e1")
 */
export function anonymizeUsername(username: string): string {
  // Simple implementation using base36 hash
  // Future: can upgrade to SHA-256 or other algorithms

  let hash = 0
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Convert to hex string and take first 8 characters
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0').substring(0, 8)
  return hexHash
}
