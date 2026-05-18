const windows = new Map<string, { count: number; resetAt: number }>()
const LIMIT = 20
const WINDOW_MS = 60_000

/**
 * Check whether the given token has exceeded the rate limit.
 * Returns true if the limit is exceeded (caller should return 429).
 */
export function checkRateLimit(token: string): boolean {
  const now = Date.now()
  const entry = windows.get(token)
  if (!entry || now >= entry.resetAt) {
    windows.set(token, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > LIMIT
}
