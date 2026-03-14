// ---------------------------------------------------------------------------
// Streak Bonus XP — daily bonus based on consecutive streak days
// ---------------------------------------------------------------------------

/**
 * Returns the streak bonus XP for the given streak length.
 * Only awarded once per day when user completes a video or game session.
 */
export function getStreakBonusXP(streakDays: number): number {
  if (streakDays <= 0) return 0
  if (streakDays <= 2) return 2
  if (streakDays <= 6) return 4
  if (streakDays <= 13) return 6
  if (streakDays <= 29) return 8
  return 10 // 30+ days
}

/**
 * Monthly cap enforcement: streak XP cannot exceed 30% of total monthly XP.
 *
 * @param streakXpThisMonth - Streak XP already earned this month
 * @param totalXpThisMonth - Total XP earned this month (all sources)
 * @param proposedStreakXp - The streak bonus about to be awarded
 * @returns Actual streak XP to award (may be reduced or 0)
 */
export function applyMonthlyStreakCap(
  streakXpThisMonth: number,
  totalXpThisMonth: number,
  proposedStreakXp: number,
): number {
  // To avoid division-by-zero at month start, allow streak XP freely
  // until total monthly XP reaches a meaningful amount.
  // The 30% cap means: streakXpThisMonth + proposed <= 0.3 * (totalXpThisMonth + proposed)
  // Rearranging: proposed <= 0.3 * totalXpThisMonth + 0.3 * proposed - streakXpThisMonth
  // 0.7 * proposed <= 0.3 * totalXpThisMonth - streakXpThisMonth
  // proposed <= (0.3 * totalXpThisMonth - streakXpThisMonth) / 0.7

  const maxAllowed = (0.3 * (totalXpThisMonth + proposedStreakXp) - streakXpThisMonth)
  if (maxAllowed <= 0) return 0
  return Math.min(proposedStreakXp, Math.floor(maxAllowed))
}
