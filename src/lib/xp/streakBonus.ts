// ---------------------------------------------------------------------------
// Streak Bonus XP — fixed daily attendance bonus
// ---------------------------------------------------------------------------

/**
 * Returns the streak bonus XP. Fixed 10 XP regardless of streak length.
 * Only awarded once per day when user completes a video or game session.
 */
export function getStreakBonusXP(_streakDays: number): number {
  return 10
}
