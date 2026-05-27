import { checkRateLimit, getRateLimitInfo } from '../rate-limit'

describe('rate-limit', () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    jest.clearAllMocks()
  })

  describe('checkRateLimit', () => {
    it('allows first request', () => {
      const result = checkRateLimit('user-1', { maxRequests: 5, windowMs: 1000 })
      expect(result).toBe(true)
    })

    it('allows requests up to limit', () => {
      const config = { maxRequests: 3, windowMs: 1000 }
      expect(checkRateLimit('user-2', config)).toBe(true)
      expect(checkRateLimit('user-2', config)).toBe(true)
      expect(checkRateLimit('user-2', config)).toBe(true)
    })

    it('rejects request when limit exceeded', () => {
      const config = { maxRequests: 2, windowMs: 1000 }
      expect(checkRateLimit('user-3', config)).toBe(true)
      expect(checkRateLimit('user-3', config)).toBe(true)
      expect(checkRateLimit('user-3', config)).toBe(false)
    })

    it('limits per-user', () => {
      const config = { maxRequests: 1, windowMs: 1000 }
      expect(checkRateLimit('user-4', config)).toBe(true)
      expect(checkRateLimit('user-4', config)).toBe(false)
      expect(checkRateLimit('user-5', config)).toBe(true) // Different user
    })

    it('resets after window expires', async () => {
      const config = { maxRequests: 1, windowMs: 50 }
      expect(checkRateLimit('user-6', config)).toBe(true)
      expect(checkRateLimit('user-6', config)).toBe(false)

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 100))

      // Should allow again after window expires
      expect(checkRateLimit('user-6', config)).toBe(true)
    })
  })

  describe('getRateLimitInfo', () => {
    it('returns max requests when no history', () => {
      const config = { maxRequests: 10, windowMs: 1000 }
      const info = getRateLimitInfo('user-7', config)
      expect(info.remaining).toBe(10)
    })

    it('returns remaining after requests', () => {
      const config = { maxRequests: 5, windowMs: 1000 }
      checkRateLimit('user-8', config)
      checkRateLimit('user-8', config)

      const info = getRateLimitInfo('user-8', config)
      expect(info.remaining).toBe(3)
    })

    it('returns 0 remaining when limit exceeded', () => {
      const config = { maxRequests: 1, windowMs: 1000 }
      checkRateLimit('user-9', config)
      checkRateLimit('user-9', config)

      const info = getRateLimitInfo('user-9', config)
      expect(info.remaining).toBe(0)
    })

    it('provides reset time', () => {
      const config = { maxRequests: 5, windowMs: 1000 }
      checkRateLimit('user-10', config)
      const info = getRateLimitInfo('user-10', config)
      expect(info.resetAt).toBeInstanceOf(Date)
      expect(info.resetAt.getTime()).toBeGreaterThan(Date.now())
    })
  })
})
