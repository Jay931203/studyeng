import {
  MONTHLY_ACTIVE_THRESHOLD,
  TIER_NAMES,
  YEARLY_BASE_SAVINGS_PERCENT,
  type BenefitSnapshot,
  type TierLevel,
} from '@/stores/useTierStore'
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
      valueLabel: '잠김',
      detail: '오늘 첫 영상 또는 게임을 완료하면 연속 학습 보너스가 열립니다.',
    }
  }

  return {
    progress: streakAwardedToday ? 1 : 0,
    valueLabel: streakAwardedToday ? '오늘 적립 완료' : '오늘 적립 가능',
    detail: streakAwardedToday
      ? '오늘은 이미 연속 학습 보너스를 받았습니다.'
      : '오늘 첫 영상 또는 게임 완료 시 1회만 적립됩니다.',
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
      statusLabel: claimed ? '수령 완료' : ready ? '지금 수령 가능' : `${Math.min(current, def.target)}/${def.target}`,
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
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', year: 'numeric' }).format(date)
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
  '마일스톤은 영상 완료, 게임 완료, 연속 학습 기록, 챌린지 통과, 등급 달성 보상을 직접 수령하는 XP 보상입니다.'

export const MONTHLY_ACTIVITY_EXPLAINER = `완료된 월 기준으로 ${MONTHLY_ACTIVE_THRESHOLD} XP 미만이 2개월 연속 이어지면 다음 달 혜택 단계가 1단계 낮아집니다. 연간 플랜은 기본가 자체가 월간 12회 대비 약 ${YEARLY_BASE_SAVINGS_PERCENT}% 저렴하고, 갱신 할인은 별도로 더해집니다.`

export function getTierStatusDetail(nextTierXp: number, nextTier: TierLevel | null) {
  if (nextTier === null) return '최상위 등급을 잠금 해제했습니다.'
  return `${TIER_NAMES[nextTier]}까지 ${nextTierXp.toLocaleString()} XP 남음`
}

export function getBenefitStatusLine(snapshot: BenefitSnapshot) {
  if (snapshot.status === 'reduced') {
    return `${TIER_NAMES[snapshot.unlockedTier]} 잠금 유지 · 현재 ${TIER_NAMES[snapshot.benefitTier]} 혜택 적용`
  }

  if (snapshot.status === 'warning') {
    if (!snapshot.currentMonthActive) {
      return `이번 달 ${MONTHLY_ACTIVE_THRESHOLD} XP를 채우면 ${TIER_NAMES[snapshot.benefitTier]} 혜택을 안정적으로 유지합니다.`
    }
    return `최근 1개월이 기준 미달입니다. 이번 달도 ${MONTHLY_ACTIVE_THRESHOLD} XP 미만이면 다음 달 혜택이 내려갑니다.`
  }

  return `다음 월간 ${snapshot.monthlyDiscount}% · 연간 갱신 ${snapshot.yearlyRenewalDiscount}%`
}
