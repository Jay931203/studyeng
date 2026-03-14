export const DAILY_VIDEO_XP_TARGET = 15

export interface AchievedMilestoneEntry {
  achievedAt: number
  xpAwarded: number
}

export function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function getTodayMilestoneSummary(
  achieved: Record<string, AchievedMilestoneEntry>,
  todayIso = getTodayIsoDate(),
) {
  let count = 0
  let xp = 0

  for (const entry of Object.values(achieved)) {
    if (new Date(entry.achievedAt).toISOString().slice(0, 10) !== todayIso) continue
    count += 1
    xp += entry.xpAwarded ?? 0
  }

  return { count, xp }
}

export function getStreakProgress(streakDays: number) {
  const target = streakDays >= 30 ? 30 : 7
  const current = Math.min(streakDays, target)
  const progress = target > 0 ? Math.min(1, current / target) : 0

  return {
    current,
    target,
    progress,
    remaining: Math.max(target - current, 0),
  }
}

export const MILESTONE_EXPLAINER =
  'Milestones are one-time XP bonuses for first clears, streak records, and tier unlocks.'
