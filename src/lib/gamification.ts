export function calculateXpForLevel(level: number): number {
  return level * 100
}

export function shouldUpdateStreak(
  lastActiveDate: Date | null,
  now: Date
): boolean | 'reset' {
  if (!lastActiveDate) return true

  const last = new Date(lastActiveDate)
  last.setHours(0, 0, 0, 0)
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)

  const diffDays = Math.floor(
    (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffDays === 0) return false
  if (diffDays === 1) return true
  return 'reset'
}

export function addXp(
  current: { level: number; xp: number },
  earned: number
): { level: number; xp: number; leveledUp: boolean } {
  let { level, xp } = current
  xp += earned
  let leveledUp = false

  while (xp >= calculateXpForLevel(level)) {
    xp -= calculateXpForLevel(level)
    level++
    leveledUp = true
  }

  return { level, xp, leveledUp }
}
