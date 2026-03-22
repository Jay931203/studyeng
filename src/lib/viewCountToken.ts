/**
 * Signed view-count token for server-side daily view enforcement.
 *
 * The token embeds the user ID, date, and current count, signed with
 * a server-side secret. The client stores the token and sends it back
 * on each view request so the server can verify the count without
 * needing a database column.
 *
 * This prevents localStorage manipulation because:
 * - The token is cryptographically signed; changing the count invalidates it
 * - A missing/invalid token resets count to 0, so the user gets at most
 *   VIEW_LIMIT additional views per tamper attempt (not unlimited)
 * - The date is embedded, so yesterday's token won't work today
 */

import { createHmac } from 'crypto'

export const VIEW_LIMIT = 10

const SECRET = process.env.VIEW_COUNT_SECRET || 'shortee-vc-guard-2026'

/**
 * Create a signed token encoding (userId, date, count).
 */
export function createViewToken(userId: string, date: string, count: number): string {
  const payload = `${userId}:${date}:${count}`
  const signature = createHmac('sha256', SECRET).update(payload).digest('base64url')
  // Token format: base64url(payload):signature
  const encodedPayload = Buffer.from(payload).toString('base64url')
  return `${encodedPayload}.${signature}`
}

/**
 * Verify a token and extract the count.
 * Returns the count if valid, null if tampered or invalid.
 */
export function verifyViewToken(token: string, userId: string, date: string): number | null {
  const dotIndex = token.indexOf('.')
  if (dotIndex === -1) return null

  const encodedPayload = token.slice(0, dotIndex)
  const signature = token.slice(dotIndex + 1)

  let payload: string
  try {
    payload = Buffer.from(encodedPayload, 'base64url').toString()
  } catch {
    return null
  }

  // Verify the payload matches expected userId and date
  const parts = payload.split(':')
  if (parts.length !== 3) return null

  const [tokenUserId, tokenDate, tokenCountStr] = parts
  if (tokenUserId !== userId || tokenDate !== date) return null

  const count = parseInt(tokenCountStr, 10)
  if (isNaN(count) || count < 0) return null

  // Verify signature
  const expectedSignature = createHmac('sha256', SECRET).update(payload).digest('base64url')
  if (signature !== expectedSignature) return null

  return count
}
