import { anonymizeUsername } from './anonymize'

describe('anonymizeUsername', () => {
  it('should generate a hash from username', () => {
    const hash = anonymizeUsername('dryisnotwet')
    expect(hash).toBeDefined()
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
  })

  it('should be deterministic - same input produces same output', () => {
    const username = 'testuser123'
    const hash1 = anonymizeUsername(username)
    const hash2 = anonymizeUsername(username)
    expect(hash1).toBe(hash2)
  })

  it('should produce different hashes for different usernames', () => {
    const hash1 = anonymizeUsername('user1')
    const hash2 = anonymizeUsername('user2')
    expect(hash1).not.toBe(hash2)
  })

  it('should return a reasonable length (8-16 chars)', () => {
    const hash = anonymizeUsername('someuser')
    expect(hash.length).toBeGreaterThanOrEqual(8)
    expect(hash.length).toBeLessThanOrEqual(16)
  })
})
