import { NextResponse } from 'next/server'
import { logger } from './logger'

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export const LIMITS = {
  AI_PROMPTS:  { maxRequests: 10, windowMs:      60_000 },
  AI_SUMMARY:  { maxRequests:  5, windowMs:      60_000 },
  WRITE:       { maxRequests: 20, windowMs:      60_000 },
  READ:        { maxRequests: 60, windowMs:      60_000 },
  ACCOUNT:     { maxRequests:  5, windowMs:      60_000 },
  EXPORT:      { maxRequests:  3, windowMs: 60 * 60_000 },
} as const satisfies Record<string, RateLimitConfig>

/**
 * Check the rate limit for a user + route combination.
 * Returns a 429 NextResponse if the limit is exceeded, or null if the request is allowed.
 * Uses a namespaced key (`routeKey:userId`) so each route has its own counter per user.
 */
export function rateLimit(
  userId: string,
  routeKey: string,
  config: RateLimitConfig
): NextResponse | null {
  const key = `${routeKey}:${userId}`
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  let allowed: boolean
  let remaining: number
  let resetTime: number

  if (!entry || now >= entry.resetTime) {
    resetTime = now + config.windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    allowed = true
    remaining = config.maxRequests - 1
  } else if (entry.count < config.maxRequests) {
    entry.count++
    remaining = config.maxRequests - entry.count
    resetTime = entry.resetTime
    allowed = true
  } else {
    remaining = 0
    resetTime = entry.resetTime
    allowed = false
  }

  if (!allowed) {
    const retryAfterSecs = Math.ceil((resetTime - now) / 1000)
    logger.warn('Rate limit exceeded', { userId, routeKey }, 'rate-limit')
    return NextResponse.json(
      { error: 'Too many requests', retryAfter: retryAfterSecs },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
          'Retry-After': String(retryAfterSecs),
        },
      }
    )
  }

  return null
}

// Legacy helpers kept for backward compatibility with existing tests and code.
const DEFAULT_WINDOW = 60 * 1000

export function checkRateLimit(identifier: string, config: RateLimitConfig): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(identifier)

  if (!entry || now >= entry.resetTime) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + (config.windowMs || DEFAULT_WINDOW),
    })
    return true
  }

  if (entry.count < config.maxRequests) {
    entry.count++
    return true
  }

  return false
}

export function getRateLimitInfo(
  identifier: string,
  config: RateLimitConfig
): { remaining: number; resetAt: Date } {
  const entry = rateLimitStore.get(identifier)

  if (!entry) {
    return {
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + (config.windowMs || DEFAULT_WINDOW)),
    }
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: new Date(entry.resetTime),
  }
}

setInterval(() => {
  const now = Date.now()
  let cleaned = 0
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key)
      cleaned++
    }
  }
  if (cleaned > 0) {
    logger.debug('Rate limit cleanup', { cleaned }, 'rate-limit')
  }
}, 5 * 60 * 1000).unref()
