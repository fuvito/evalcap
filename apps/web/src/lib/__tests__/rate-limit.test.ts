import { checkRateLimit, getRateLimitInfo, rateLimit, LIMITS } from '../rate-limit'

jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((body, init) => ({ body, status: init?.status ?? 200, headers: init?.headers ?? {} })),
  },
}))

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

  describe('cleanup interval', () => {
    afterEach(() => jest.useRealTimers())

    it('removes expired entries after 5 minutes and logs cleanup', () => {
      jest.useFakeTimers()
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})

      let localCheck: (id: string, config: { maxRequests: number; windowMs: number }) => boolean
      jest.isolateModules(() => {
        const mod = require('@/lib/rate-limit') as typeof import('../rate-limit')
        localCheck = mod.checkRateLimit
      })

      // Create an entry that will be immediately expired (1ms window)
      localCheck!('cleanup-key', { maxRequests: 5, windowMs: 1 })

      // Advance past 5-minute cleanup interval
      jest.advanceTimersByTime(5 * 60 * 1000)

      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG]'),
        'Rate limit cleanup',
        expect.objectContaining({ cleaned: 1 })
      )

      debugSpy.mockRestore()
    })

    it('does not log when no entries are cleaned', () => {
      jest.useFakeTimers()
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {})

      jest.isolateModules(() => {
        // Import to register the setInterval - empty store, nothing to clean
        require('@/lib/rate-limit')
      })

      jest.advanceTimersByTime(5 * 60 * 1000)

      // No expired entries → cleaned = 0 → no debug log
      expect(debugSpy).not.toHaveBeenCalledWith(
        expect.anything(),
        'Rate limit cleanup',
        expect.anything()
      )

      debugSpy.mockRestore()
    })
  })

  describe('rateLimit', () => {
    it('returns null when under limit', () => {
      const result = rateLimit('user-rl-1', 'test.read', { maxRequests: 5, windowMs: 1000 })
      expect(result).toBeNull()
    })

    it('returns 429 response when limit exceeded', () => {
      const config = { maxRequests: 2, windowMs: 1000 }
      rateLimit('user-rl-2', 'test.write', config)
      rateLimit('user-rl-2', 'test.write', config)
      const result = rateLimit('user-rl-2', 'test.write', config)
      expect(result).not.toBeNull()
      expect((result as any).status).toBe(429)
    })

    it('namespaces counters by routeKey so different routes are independent', () => {
      const config = { maxRequests: 1, windowMs: 1000 }
      expect(rateLimit('user-rl-3', 'route.a', config)).toBeNull()
      expect(rateLimit('user-rl-3', 'route.a', config)).not.toBeNull() // route.a exhausted
      expect(rateLimit('user-rl-3', 'route.b', config)).toBeNull()     // route.b is fresh
    })

    it('namespaces counters by userId so different users are independent', () => {
      const config = { maxRequests: 1, windowMs: 1000 }
      expect(rateLimit('user-rl-4', 'shared.route', config)).toBeNull()
      expect(rateLimit('user-rl-4', 'shared.route', config)).not.toBeNull()
      expect(rateLimit('user-rl-5', 'shared.route', config)).toBeNull() // different user
    })

    it('response includes standard rate limit headers', () => {
      const config = { maxRequests: 1, windowMs: 1000 }
      rateLimit('user-rl-6', 'hdr.test', config)
      const result = rateLimit('user-rl-6', 'hdr.test', config) as any
      expect(result?.headers?.['X-RateLimit-Limit']).toBe('1')
      expect(result?.headers?.['X-RateLimit-Remaining']).toBe('0')
      expect(result?.headers?.['X-RateLimit-Reset']).toBeDefined()
      expect(result?.headers?.['Retry-After']).toBeDefined()
    })
  })

  describe('LIMITS', () => {
    it('exports the expected tier configs', () => {
      expect(LIMITS.AI_PROMPTS.maxRequests).toBe(10)
      expect(LIMITS.AI_SUMMARY.maxRequests).toBe(5)
      expect(LIMITS.WRITE.maxRequests).toBe(20)
      expect(LIMITS.READ.maxRequests).toBe(60)
      expect(LIMITS.ACCOUNT.maxRequests).toBe(5)
      expect(LIMITS.EXPORT.maxRequests).toBe(3)
      expect(LIMITS.EXPORT.windowMs).toBe(60 * 60_000)
    })
  })
})
