import { MONTHLY_ACTIVE_THRESHOLD, TIER_NAMES, type TierLevel } from '@/stores/useTierStore'
import { MILESTONES, type AchievedEntry, type MilestoneDefinition } from '@/stores/useMilestoneStore'

export const DAILY_VIDEO_XP_TARGET = 15
export const DAILY_STREAK_BONUS_TARGET = 1

export interface MilestoneProgressInput {
  completedVideos: number
  totalGameSessions: number
  streakDays: number
  passedLevelChallenge: boolean
  currentTier: TierLevel
}

export interface MilestoneMission extends MilestoneDefinition {
  current: number
  progress: number
  ready: boolean
  claimed: boolean
  statusLabel: string
}

export interface MonthlyXpPoint {
  key: string
  label: string
  xp: number
  progress: number
  active: boolean
}

export function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

export function getTodayMilestoneSummary(
  achieved: Record<string, AchievedEntry>,
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

export function getStreakBonusProgress(streakDays: number, streakAwardedToday: boolean) {
  if (streakDays <= 0) {
    return {
      progress: 0,
      valueLabel: 'Locked',
      detail: 'Start a streak to unlock the daily bonus.',
    }
  }

  return {
    progress: streakAwardedToday ? 1 : 0,
    valueLabel: streakAwardedToday ? 'Claimed' : 'Ready',
    detail: streakAwardedToday
      ? 'Today streak bonus already collected.'
      : 'Complete a session today to collect the streak bonus.',
  }
}

function getMilestoneCurrent(def: MilestoneDefinition, input: MilestoneProgressInput) {
  switch (def.metric) {
    case 'videos':
      return input.completedVideos
    case 'games':
      return input.totalGameSessions
    case 'streak':
      return input.streakDays
    case 'challenge':
      return input.passedLevelChallenge ? 1 : 0
    case 'tier':
      return input.currentTier
    default:
      return 0
  }
}

export function buildMilestoneMissions(
  input: MilestoneProgressInput,
  achieved: Record<string, AchievedEntry>,
): MilestoneMission[] {
  return MILESTONES.map((def) => {
    const current = getMilestoneCurrent(def, input)
    const progress = def.target > 0 ? Math.min(current / def.target, 1) : 0
    const claimed = Boolean(achieved[def.id])
    const ready = !claimed && current >= def.target

    return {
      ...def,
      current,
      progress,
      claimed,
      ready,
      statusLabel: claimed ? 'Claimed' : ready ? 'Ready to claim' : `${Math.min(current, def.target)}/${def.target}`,
    }
  })
}

export function getMilestoneSummary(missions: MilestoneMission[]) {
  const readyCount = missions.filter((mission) => mission.ready).length
  const claimedCount = missions.filter((mission) => mission.claimed).length
  const inProgressCount = missions.length - readyCount - claimedCount
  const claimedXp = missions
    .filter((mission) => mission.claimed)
    .reduce((sum, mission) => sum + mission.xp, 0)

  return {
    readyCount,
    claimedCount,
    inProgressCount,
    claimedXp,
  }
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)
}

export function buildMonthlyXpTrend(
  monthlyXpHistory: Record<string, number>,
  months = 4,
) {
  const points: MonthlyXpPoint[] = []
  const cursor = new Date()
  cursor.setDate(1)

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(cursor.getFullYear(), cursor.getMonth() - index, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const xp = monthlyXpHistory[key] ?? 0
    points.push({
      key,
      label: formatMonthLabel(key),
      xp,
      progress: Math.min(xp / MONTHLY_ACTIVE_THRESHOLD, 1),
      active: xp >= MONTHLY_ACTIVE_THRESHOLD,
    })
  }

  return points
}

export const MILESTONE_EXPLAINER =
  'Milestones are manual XP claims for video clears, game clears, streak records, challenge clears, and tier unlocks.'

export const MONTHLY_ACTIVITY_EXPLAINER = `Monthly activity below ${MONTHLY_ACTIVE_THRESHOLD} XP counts as inactive and can put your tier status at risk.`

export function getTierStatusDetail(nextTierXp: number, nextTier: TierLevel | null) {
  if (nextTier === null) return 'Top tier active'
  return `${nextTierXp.toLocaleString()} XP to ${TIER_NAMES[nextTier]}`
}
