// ---------------------------------------------------------------------------
// Streak Bonus XP — one daily attendance-style bonus for keeping the streak
// ---------------------------------------------------------------------------

/**
 * Returns the streak bonus XP for the given streak length.
 * Only awarded once per day when user completes a video or game session.
 */
export function getStreakBonusXP(streakDays: number): number {
  if (streakDays <= 0) return 0
  return 10
}
