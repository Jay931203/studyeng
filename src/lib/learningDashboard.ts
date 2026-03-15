import {
  MONTHLY_ACTIVE_THRESHOLD,
  TIER_NAMES,
  type BenefitSnapshot,
  type TierLevel,
} from '@/stores/useTierStore'
import { MILESTONES, type AchievedEntry, type MilestoneDefinition } from '@/stores/useMilestoneStore'

export type SupportedLocale = 'ko' | 'ja' | 'zh-TW' | 'vi'

const DATE_LOCALE_MAP: Record<SupportedLocale, string> = {
  ko: 'ko-KR',
  ja: 'ja-JP',
  'zh-TW': 'zh-TW',
  vi: 'vi-VN',
}

interface DashboardTranslations {
  streakLocked: string
  streakLockedDetail: string
  streakAwardedToday: string
  streakAvailableToday: string
  streakAwardedDetail: string
  streakAvailableDetail: string
  milestoneClaimed: string
  milestoneReady: string
  milestoneExplainer: string
  monthlyActivityExplainer: (threshold: number) => string
  tierStatusMaxed: string
  tierStatusRemaining: (tierName: string, xp: string) => string
  benefitReduced: (threshold: number, tierName: string) => string
  benefitWarning: (threshold: number, tierName: string) => string
  benefitSafe: (tierName: string) => string
}

const TRANSLATIONS: Record<SupportedLocale, DashboardTranslations> = {
  ko: {
    streakLocked: '잠김',
    streakLockedDetail: '오늘 첫 영상 또는 게임을 완료하면 연속 학습 보너스가 열립니다.',
    streakAwardedToday: '오늘 적립 완료',
    streakAvailableToday: '오늘 적립 가능',
    streakAwardedDetail: '오늘은 이미 연속 학습 보너스를 받았습니다.',
    streakAvailableDetail: '오늘 첫 영상 또는 게임 완료 시 1회만 적립됩니다.',
    milestoneClaimed: '수령 완료',
    milestoneReady: '지금 수령 가능',
    milestoneExplainer:
      '마일스톤은 영상 완료, 게임 완료, 연속 학습 기록, 챌린지 통과, 등급 달성 보상을 직접 수령하는 XP 보상입니다.',
    monthlyActivityExplainer: (threshold) =>
      `완료된 월 기준으로 ${threshold} XP 미만이 2개월 연속 이어지면 혜택 단계가 1단계 낮아집니다. 이번 달 ${threshold} XP를 채우면 현재 잠금 등급 혜택으로 바로 복구할 수 있습니다.`,
    tierStatusMaxed: '최상위 등급을 잠금 해제했습니다.',
    tierStatusRemaining: (tierName, xp) => `${tierName}까지 ${xp} XP 남음`,
    benefitReduced: (threshold, tierName) =>
      `이번 달 ${threshold} XP를 채우면 ${tierName} 혜택으로 바로 복구됩니다.`,
    benefitWarning: (threshold, tierName) =>
      `이번 달 ${threshold} XP를 채우면 ${tierName} 혜택을 안정적으로 유지합니다.`,
    benefitSafe: (tierName) => `${tierName} 혜택이 정상 적용 중입니다.`,
  },
  ja: {
    streakLocked: 'ロック中',
    streakLockedDetail: '今日最初の動画またはゲームを完了すると、連続学習ボーナスが解放されます。',
    streakAwardedToday: '本日付与済み',
    streakAvailableToday: '本日付与可能',
    streakAwardedDetail: '今日はすでに連続学習ボーナスを受け取りました。',
    streakAvailableDetail: '今日最初の動画またはゲーム完了時に1回だけ付与されます。',
    milestoneClaimed: '受取済み',
    milestoneReady: '今すぐ受取可能',
    milestoneExplainer:
      'マイルストーンは動画完了、ゲーム完了、連続学習記録、チャレンジ通過、ランク達成の報酬を直接受け取るXP報酬です。',
    monthlyActivityExplainer: (threshold) =>
      `完了月基準で${threshold} XP未満が2ヶ月連続すると、特典ランクが1段階下がります。今月${threshold} XPを達成すると、現在のロック解除ランク特典にすぐ復帰できます。`,
    tierStatusMaxed: '最上位ランクをアンロックしました。',
    tierStatusRemaining: (tierName, xp) => `${tierName}まであと${xp} XP`,
    benefitReduced: (threshold, tierName) =>
      `今月${threshold} XPを達成すると、${tierName}特典にすぐ復帰します。`,
    benefitWarning: (threshold, tierName) =>
      `今月${threshold} XPを達成すると、${tierName}特典を安定的に維持します。`,
    benefitSafe: (tierName) => `${tierName}特典が正常に適用されています。`,
  },
  'zh-TW': {
    streakLocked: '已锁定',
    streakLockedDetail: '完成今天的第一个影片或游戏后，连续学习奖励将会解锁。',
    streakAwardedToday: '今日已领取',
    streakAvailableToday: '今日可领取',
    streakAwardedDetail: '今天已经领取了连续学习奖励。',
    streakAvailableDetail: '完成今天第一个影片或游戏时，仅可领取一次。',
    milestoneClaimed: '已领取',
    milestoneReady: '立即可领取',
    milestoneExplainer:
      '里程碑是透过完成影片、游戏、连续学习纪录、挑战通过及等级达成来直接领取的XP奖励。',
    monthlyActivityExplainer: (threshold) =>
      `若连续两个月低于${threshold} XP，福利等级将降低一级。本月达成${threshold} XP即可立即恢复至当前解锁等级的福利。`,
    tierStatusMaxed: '已解锁最高等级。',
    tierStatusRemaining: (tierName, xp) => `距离${tierName}还需${xp} XP`,
    benefitReduced: (threshold, tierName) =>
      `本月达成${threshold} XP即可立即恢复${tierName}福利。`,
    benefitWarning: (threshold, tierName) =>
      `本月达成${threshold} XP即可稳定维持${tierName}福利。`,
    benefitSafe: (tierName) => `${tierName}福利正常适用中。`,
  },
  vi: {
    streakLocked: '\u0110\u00e3 kh\u00f3a',
    streakLockedDetail: 'Ho\u00e0n th\u00e0nh video ho\u1eb7c tr\u00f2 ch\u01a1i \u0111\u1ea7u ti\u00ean h\u00f4m nay \u0111\u1ec3 m\u1edf kh\u00f3a th\u01b0\u1edfng h\u1ecdc li\u00ean t\u1ee5c.',
    streakAwardedToday: '\u0110\u00e3 nh\u1eadn h\u00f4m nay',
    streakAvailableToday: 'C\u00f3 th\u1ec3 nh\u1eadn h\u00f4m nay',
    streakAwardedDetail: 'B\u1ea1n \u0111\u00e3 nh\u1eadn th\u01b0\u1edfng h\u1ecdc li\u00ean t\u1ee5c h\u00f4m nay r\u1ed3i.',
    streakAvailableDetail: 'Ch\u1ec9 \u0111\u01b0\u1ee3c nh\u1eadn 1 l\u1ea7n khi ho\u00e0n th\u00e0nh video ho\u1eb7c tr\u00f2 ch\u01a1i \u0111\u1ea7u ti\u00ean h\u00f4m nay.',
    milestoneClaimed: '\u0110\u00e3 nh\u1eadn',
    milestoneReady: 'Nh\u1eadn ngay',
    milestoneExplainer:
      'C\u1ed9t m\u1ed1c l\u00e0 ph\u1ea7n th\u01b0\u1edfng XP nh\u1eadn tr\u1ef1c ti\u1ebfp khi ho\u00e0n th\u00e0nh video, tr\u00f2 ch\u01a1i, k\u1ef7 l\u1ee5c h\u1ecdc li\u00ean t\u1ee5c, v\u01b0\u1ee3t th\u1eed th\u00e1ch v\u00e0 \u0111\u1ea1t c\u1ea5p b\u1eadc.',
    monthlyActivityExplainer: (threshold) =>
      `N\u1ebfu d\u01b0\u1edbi ${threshold} XP trong 2 th\u00e1ng li\u00ean ti\u1ebfp, c\u1ea5p ph\u00fac l\u1ee3i s\u1ebd gi\u1ea3m 1 b\u1eadc. \u0110\u1ea1t ${threshold} XP th\u00e1ng n\u00e0y \u0111\u1ec3 kh\u00f4i ph\u1ee5c ph\u00fac l\u1ee3i c\u1ea5p hi\u1ec7n t\u1ea1i ngay l\u1eadp t\u1ee9c.`,
    tierStatusMaxed: '\u0110\u00e3 m\u1edf kh\u00f3a c\u1ea5p b\u1eadc cao nh\u1ea5t.',
    tierStatusRemaining: (tierName, xp) => `C\u00f2n ${xp} XP n\u1eefa \u0111\u1ec3 \u0111\u1ea1t ${tierName}`,
    benefitReduced: (threshold, tierName) =>
      `\u0110\u1ea1t ${threshold} XP th\u00e1ng n\u00e0y \u0111\u1ec3 kh\u00f4i ph\u1ee5c ph\u00fac l\u1ee3i ${tierName} ngay l\u1eadp t\u1ee9c.`,
    benefitWarning: (threshold, tierName) =>
      `\u0110\u1ea1t ${threshold} XP th\u00e1ng n\u00e0y \u0111\u1ec3 duy tr\u00ec \u1ed5n \u0111\u1ecbnh ph\u00fac l\u1ee3i ${tierName}.`,
    benefitSafe: (tierName) => `Ph\u00fac l\u1ee3i ${tierName} \u0111ang \u0111\u01b0\u1ee3c \u00e1p d\u1ee5ng b\u00ecnh th\u01b0\u1eddng.`,
  },
}

function getT(locale: SupportedLocale = 'ko'): DashboardTranslations {
  return TRANSLATIONS[locale] ?? TRANSLATIONS.ko
}

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

export function getStreakBonusProgress(
  streakDays: number,
  streakAwardedToday: boolean,
  locale: SupportedLocale = 'ko',
) {
  const t = getT(locale)

  if (streakDays <= 0) {
    return {
      progress: 0,
      valueLabel: t.streakLocked,
      detail: t.streakLockedDetail,
    }
  }

  return {
    progress: streakAwardedToday ? 1 : 0,
    valueLabel: streakAwardedToday ? t.streakAwardedToday : t.streakAvailableToday,
    detail: streakAwardedToday ? t.streakAwardedDetail : t.streakAvailableDetail,
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
  locale: SupportedLocale = 'ko',
): MilestoneMission[] {
  const t = getT(locale)

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
      statusLabel: claimed ? t.milestoneClaimed : ready ? t.milestoneReady : `${Math.min(current, def.target)}/${def.target}`,
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

function formatMonthLabel(monthKey: string, locale: SupportedLocale = 'ko') {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  const dateLocale = DATE_LOCALE_MAP[locale] ?? DATE_LOCALE_MAP.ko
  return new Intl.DateTimeFormat(dateLocale, { month: 'short', year: 'numeric' }).format(date)
}

export function buildMonthlyXpTrend(
  monthlyXpHistory: Record<string, number>,
  months = 4,
  locale: SupportedLocale = 'ko',
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
      label: formatMonthLabel(key, locale),
      xp,
      progress: Math.min(xp / MONTHLY_ACTIVE_THRESHOLD, 1),
      active: xp >= MONTHLY_ACTIVE_THRESHOLD,
    })
  }

  return points
}

export function getMilestoneExplainer(locale: SupportedLocale = 'ko'): string {
  return getT(locale).milestoneExplainer
}

export function getMonthlyActivityExplainer(locale: SupportedLocale = 'ko'): string {
  return getT(locale).monthlyActivityExplainer(MONTHLY_ACTIVE_THRESHOLD)
}

/** @deprecated Use getMilestoneExplainer(locale) instead */
export const MILESTONE_EXPLAINER =
  '마일스톤은 영상 완료, 게임 완료, 연속 학습 기록, 챌린지 통과, 등급 달성 보상을 직접 수령하는 XP 보상입니다.'

/** @deprecated Use getMonthlyActivityExplainer(locale) instead */
export const MONTHLY_ACTIVITY_EXPLAINER = `완료된 월 기준으로 ${MONTHLY_ACTIVE_THRESHOLD} XP 미만이 2개월 연속 이어지면 혜택 단계가 1단계 낮아집니다. 이번 달 ${MONTHLY_ACTIVE_THRESHOLD} XP를 채우면 현재 잠금 등급 혜택으로 바로 복구할 수 있습니다.`

export function getTierStatusDetail(
  nextTierXp: number,
  nextTier: TierLevel | null,
  locale: SupportedLocale = 'ko',
) {
  const t = getT(locale)
  if (nextTier === null) return t.tierStatusMaxed
  return t.tierStatusRemaining(TIER_NAMES[nextTier], nextTierXp.toLocaleString())
}

export function getBenefitStatusLine(
  snapshot: BenefitSnapshot,
  locale: SupportedLocale = 'ko',
) {
  const t = getT(locale)

  if (snapshot.status === 'reduced') {
    return t.benefitReduced(MONTHLY_ACTIVE_THRESHOLD, TIER_NAMES[snapshot.unlockedTier])
  }

  if (snapshot.status === 'warning') {
    return t.benefitWarning(MONTHLY_ACTIVE_THRESHOLD, TIER_NAMES[snapshot.benefitTier])
  }

  return t.benefitSafe(TIER_NAMES[snapshot.benefitTier])
}
