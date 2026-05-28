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

const DEFAULT_WINDOW = 60 * 1000 // 1 minute

export function checkRateLimit(identifier: string, config: RateLimitConfig): boolean {
  const now = Date.now()
  const key = `${identifier}`

  const entry = rateLimitStore.get(key)

  if (!entry || now >= entry.resetTime) {
    rateLimitStore.set(key, {
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
  const key = `${identifier}`
  const entry = rateLimitStore.get(key)

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

// Cleanup old entries every 5 minutes
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
