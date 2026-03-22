export function calculateXpForLevel(level: number): number {
  return level * 100
}

export interface StreakStateSnapshot {
  streakDays: number
  lastActivityDate: string | null
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

function getCalendarDayDiff(lastActiveDate: Date, now: Date): number {
  const last = startOfDay(lastActiveDate)
  const today = startOfDay(now)
  return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
}

export function shouldUpdateStreak(
  lastActiveDate: Date | null,
  now: Date
): boolean | 'reset' {
  if (!lastActiveDate) return true

  const diffDays = getCalendarDayDiff(lastActiveDate, now)

  if (diffDays === 0) return false
  if (diffDays === 1) return true
  return 'reset'
}

export function reconcileStreakState(
  state: StreakStateSnapshot,
  now: Date = new Date()
): StreakStateSnapshot {
  if (!state.lastActivityDate) {
    return state.streakDays > 0
      ? { streakDays: 0, lastActivityDate: null }
      : state
  }

  const parsedLastActivityDate = new Date(state.lastActivityDate)
  if (Number.isNaN(parsedLastActivityDate.getTime())) {
    return {
      streakDays: 0,
      lastActivityDate: null,
    }
  }

  if (state.streakDays <= 0) {
    return {
      streakDays: 0,
      lastActivityDate: state.lastActivityDate,
    }
  }

  const diffDays = getCalendarDayDiff(parsedLastActivityDate, now)
  if (diffDays <= 1) {
    return state
  }

  return {
    streakDays: 0,
    lastActivityDate: state.lastActivityDate,
  }
}

export function mergeStreakStateSnapshots(
  localState: StreakStateSnapshot,
  serverState: StreakStateSnapshot,
  now: Date = new Date()
): StreakStateSnapshot {
  const normalizedLocalState = reconcileStreakState(localState, now)
  const normalizedServerState = reconcileStreakState(serverState, now)

  const localTime = normalizedLocalState.lastActivityDate
    ? new Date(normalizedLocalState.lastActivityDate).getTime()
    : Number.NEGATIVE_INFINITY
  const serverTime = normalizedServerState.lastActivityDate
    ? new Date(normalizedServerState.lastActivityDate).getTime()
    : Number.NEGATIVE_INFINITY

  if (serverTime > localTime) {
    return normalizedServerState
  }

  if (localTime > serverTime) {
    return normalizedLocalState
  }

  return {
    streakDays: Math.max(normalizedLocalState.streakDays, normalizedServerState.streakDays),
    lastActivityDate: normalizedLocalState.lastActivityDate ?? normalizedServerState.lastActivityDate,
  }
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
