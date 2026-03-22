/**
 * Simple in-memory IP-based rate limiter.
 *
 * Works well enough for Vercel serverless — each cold-start gets a fresh map,
 * so the worst case is that a burst across multiple instances isn't caught.
 * For a single instance the map enforces the limit correctly.
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Periodically clean up expired entries to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60_000 // 5 minutes
let lastCleanup = Date.now()

function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  rateLimitMap.forEach((record, key) => {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  })
}

/**
 * Check whether the given IP is allowed under the rate limit.
 *
 * @param ip       Client IP (from x-forwarded-for or fallback)
 * @param limit    Maximum requests allowed in the window
 * @param windowMs Window duration in milliseconds
 * @returns `true` if the request is allowed, `false` if rate-limited
 */
export function rateLimit(ip: string, limit = 20, windowMs = 60_000): boolean {
  cleanupExpired()

  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

/**
 * Build standard rate-limit response headers for the given IP.
 */
export function getRateLimitHeaders(ip: string, limit = 20): Record<string, string> {
  const record = rateLimitMap.get(ip)
  const remaining = record ? Math.max(0, limit - record.count) : limit
  const reset = record ? Math.ceil(record.resetTime / 1000) : Math.ceil(Date.now() / 1000) + 60

  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(reset),
  }
}

/**
 * Extract client IP from the request headers.
 * Falls back to 'unknown' if no IP can be determined.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can be comma-separated; take the first (original client)
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') ?? 'unknown'
}
