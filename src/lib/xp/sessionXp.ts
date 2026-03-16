// ---------------------------------------------------------------------------
// Session XP — awards XP for completing a full game session
// ---------------------------------------------------------------------------

const SESSION_XP: Record<string, number> = {
  expressionSwipe: 5,
  listenAndFill: 5,
}

/** Minimum session duration in ms (2 minutes). Sessions faster than this get 0 XP. */
const MIN_SESSION_DURATION_MS = 120_000

/** Daily cap for visible game XP across all game sources */
export const DAILY_SESSION_XP_CAP = 20

/**
 * Calculate XP for completing a game session.
 *
 * @param game - The game type that was completed
 * @param sessionStartTime - Date.now() when the session began
 * @returns XP amount (0 if session was too fast)
 */
export function calculateSessionXP(
  game: 'expressionSwipe' | 'listenAndFill',
  sessionStartTime: number,
): number {
  const elapsed = Date.now() - sessionStartTime

  // Anti-farming: sessions completed in under 2 minutes get 0 XP
  if (elapsed < MIN_SESSION_DURATION_MS) {
    return 0
  }

  return SESSION_XP[game] ?? 0
}
