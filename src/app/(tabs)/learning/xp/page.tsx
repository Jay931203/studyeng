'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { XpHistoryFeed } from '@/components/learning/XpHistoryFeed'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import {
  buildMilestoneMissions,
  DAILY_VIDEO_XP_TARGET,
  getBenefitStatusLine,
  getMilestoneSummary,
  getTodayIsoDate,
  getMonthlyActivityExplainer,
} from '@/lib/learningDashboard'
import {
  formatWon,
  getMonthlyDiscountedPrice,
  getSavingsPercent,
  getYearlyRenewalPrice,
  MONTHLY_REFERENCE_PRICE,
  YEARLY_REFERENCE_PRICE,
} from '@/lib/billingPricing'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP } from '@/lib/xp/streakBonus'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLevelChallengeStore } from '@/stores/useLevelChallengeStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useMilestoneStore } from '@/stores/useMilestoneStore'
import { MONTHLY_ACTIVE_THRESHOLD, TIER_NAMES, type TierLevel, useTierStore } from '@/stores/useTierStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useLocaleStore } from '@/stores/useLocaleStore'
import { getLocaleStrings } from '@/locales'

const TIER_COLORS: Record<TierLevel, { bg: string; text: string; bar: string }> = {
  0: {
    bg: 'bg-[var(--bg-secondary)]',
    text: 'text-[var(--text-secondary)]',
    bar: 'bg-[var(--text-muted)]',
  },
  1: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', bar: 'bg-emerald-500' },
  2: { bg: 'bg-sky-500/10', text: 'text-sky-400', bar: 'bg-sky-500' },
  3: { bg: 'bg-violet-500/10', text: 'text-violet-400', bar: 'bg-violet-500' },
  4: { bg: 'bg-amber-500/10', text: 'text-amber-400', bar: 'bg-amber-500' },
  5: { bg: 'bg-rose-500/10', text: 'text-rose-300', bar: 'bg-rose-500' },
}

export default function XPPage() {
  const router = useRouter()
  const locale = useLocaleStore((s) => s.locale)
  const strings = getLocaleStrings(locale)
  const T = strings.xp
  const tierT = strings.tier
  const commonT = strings.common
  const totalXP = useUserStore((state) => state.getTotalXP())
  const streakDays = useUserStore((state) => state.streakDays)
  const xpHistory = useUserStore((state) => state.xpHistory)
  const getDailyTotalGameXP = useGameProgressStore((state) => state.getDailyTotalGameXP)
  const streakBonusDate = useGameProgressStore((state) => state.streakBonusDate)
  const dailyStreakBonusXP = useGameProgressStore((state) => state.dailyStreakBonusXP)
  const totalGameSessions = useGameProgressStore((state) => state.getTotalSessions())
  const dailyVideoXP = useLevelStore((state) => state.getDailyVideoXP())
  const videoXPTotal = useLevelStore((state) => state.getVideoXPTotal())
  const achievedMilestones = useMilestoneStore((state) => state.achieved)
  const currentTier = useTierStore((state) => state.currentTier)
  const recalculateTier = useTierStore((state) => state.recalculateTier)
  const getTierProgress = useTierStore((state) => state.getTierProgress)
  const getBenefitSnapshot = useTierStore((state) => state.getBenefitSnapshot)
  const completionCounts = useWatchHistoryStore((state) => state.completionCounts)
  const challengeAttempts = useLevelChallengeStore((state) => state.challengeAttempts)

  useEffect(() => {
    recalculateTier()
  }, [recalculateTier])

  const benefitSnapshot = getBenefitSnapshot()
  const today = getTodayIsoDate()
  const completedVideos = Object.values(completionCounts).filter((count) => count > 0).length
  const gameXpToday = getDailyTotalGameXP()
  const streakTarget = streakDays > 0 ? getStreakBonusXP(streakDays) : 10
  const streakBonusAwardedToday = streakBonusDate === today
  const streakBonusToday = streakBonusAwardedToday ? dailyStreakBonusXP : 0
  const todayTotal = gameXpToday + dailyVideoXP + streakBonusToday
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)
  const videoXpPct = Math.min((dailyVideoXP / DAILY_VIDEO_XP_TARGET) * 100, 100)
  const streakBonusPct = streakTarget > 0 ? Math.min((streakBonusToday / streakTarget) * 100, 100) : 0
  const milestoneXP = Object.values(achievedMilestones).reduce(
    (sum, entry) => sum + (entry.xpAwarded ?? 0),
    0,
  )
  const milestoneMissions = buildMilestoneMissions(
    {
      completedVideos,
      totalGameSessions,
      streakDays,
      passedLevelChallenge: challengeAttempts.some((attempt) => attempt.passed),
      currentTier,
    },
    achievedMilestones,
    locale,
  )
  const milestoneSummary = getMilestoneSummary(milestoneMissions)
  const { next, progress } = getTierProgress()
  const tierColors = TIER_COLORS[benefitSnapshot.benefitTier]
  const currentMonthProgress = Math.min(benefitSnapshot.currentMonthXp / MONTHLY_ACTIVE_THRESHOLD, 1)
  const monthlyPrice = getMonthlyDiscountedPrice(benefitSnapshot.monthlyDiscount)
  const yearlyPrice = getYearlyRenewalPrice(
    benefitSnapshot.yearlyRenewalDiscount,
    benefitSnapshot.monthlyDiscount,
  )
  const monthlySavings = getSavingsPercent(MONTHLY_REFERENCE_PRICE, monthlyPrice)
  const yearlySavings = getSavingsPercent(YEARLY_REFERENCE_PRICE, yearlyPrice)

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.replace('/learning')
  }

  return (
    <AppPage>
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-[var(--text-secondary)] transition-transform active:scale-90"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            {T.myXp}
          </p>
        </div>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            {tierT.benefitStatus}
          </p>

          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tierColors.bg} ${tierColors.text}`}>
            {TIER_NAMES[benefitSnapshot.benefitTier]}
          </span>

          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {getBenefitStatusLine(benefitSnapshot, locale)}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <PriceInfoBlock
              label={tierT.monthlyFinalPrice}
              original={formatWon(MONTHLY_REFERENCE_PRICE)}
              current={formatWon(monthlyPrice)}
              detail={tierT.totalDiscount(monthlySavings)}
            />
            <PriceInfoBlock
              label={tierT.yearlyFinalPrice}
              original={formatWon(YEARLY_REFERENCE_PRICE)}
              current={formatWon(yearlyPrice)}
              detail={tierT.totalDiscount(yearlySavings)}
            />
          </div>

          <div className="mt-4 space-y-2.5">
            <InfoRow
              label={tierT.thisMonthActivity}
              value={`${benefitSnapshot.currentMonthXp.toLocaleString()} / ${MONTHLY_ACTIVE_THRESHOLD} XP`}
              detail={tierT.thisMonthActivityHint}
            />
          </div>

          {next !== null ? (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] text-[var(--text-muted)]">
                <span>
                  {TIER_NAMES[currentTier]} → {TIER_NAMES[next]}
                </span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <div className="h-[4px] w-full overflow-hidden rounded-full bg-[var(--border-card)]">
                <motion.div
                  className={`h-full rounded-full ${tierColors.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                {T.nextTierRemaining(benefitSnapshot.nextTierXp.toLocaleString())}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-[11px] text-[var(--text-muted)]">
              {T.maxTierMaintained}
            </p>
          )}
        </SurfaceCard>

        <section className="grid gap-4 px-1 sm:grid-cols-2">
          <StatSection
            title={T.totalXp}
            value={`${totalXP.toLocaleString()} XP`}
            detail={T.totalXpDetail}
          >
            <div className="mt-4 border-t border-[var(--border-card)] pt-4">
              <div className="space-y-2.5">
                <InfoRow label={T.videoAccumulatedXp} value={`${videoXPTotal} XP`} />
                <InfoRow label={T.milestoneAccumulatedXp} value={`${milestoneXP} XP`} />
                <InfoRow
                  label={T.thisMonthActivityXp}
                  value={`${benefitSnapshot.currentMonthXp.toLocaleString()} XP`}
                />
              </div>
            </div>
          </StatSection>

          <StatSection
            title={T.todayEarned}
            value={`+${todayTotal} XP`}
            detail={T.todayDetail}
          >
            <div className="mt-4 space-y-3.5">
              <ProgressRow
                label={T.games}
                value={`${gameXpToday}/${DAILY_SESSION_XP_CAP} XP`}
                progress={gameXpPct}
                detail={T.gameXpDetail}
              />
              <ProgressRow
                label={T.videos}
                value={`${dailyVideoXP}/${DAILY_VIDEO_XP_TARGET} XP`}
                progress={videoXpPct}
                detail={T.videoXpDetail}
              />
              <ProgressRow
                label={T.attendance}
                value={`${streakBonusToday}/${streakTarget} XP`}
                progress={streakBonusPct}
                detail={
                  streakDays > 0
                    ? T.streakDetailActive(streakTarget, streakDays)
                    : T.streakDetailInactive
                }
              />
            </div>
          </StatSection>
        </section>

        <SurfaceCard className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                {T.milestones}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {T.milestoneDetail}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/learning/milestones')}
              className="text-[11px] font-medium text-[var(--text-muted)]"
            >
              {commonT.viewMore}
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SummaryBox label={T.readyToClaim} value={String(milestoneSummary.readyCount)} />
            <SummaryBox label={T.claimed} value={String(milestoneSummary.claimedCount)} />
            <SummaryBox label={T.claimedXp} value={`${milestoneSummary.claimedXp} XP`} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              {T.recentXpHistory}
            </p>
            <button
              type="button"
              onClick={() => router.push('/learning/xp/history')}
              className="text-[11px] font-medium text-[var(--text-muted)]"
            >
              {commonT.viewMore}
            </button>
          </div>
          <XpHistoryFeed events={xpHistory} limit={8} />
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                {T.thisMonthActivity}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {getMonthlyActivityExplainer(locale)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push('/learning/xp/activity')}
              className="text-[11px] font-medium text-[var(--text-muted)]"
            >
              {commonT.viewMore}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--text-secondary)]">{T.thisMonthProgress}</span>
              <span className="font-medium text-[var(--text-primary)]">
                {benefitSnapshot.currentMonthXp.toLocaleString()} / {MONTHLY_ACTIVE_THRESHOLD} XP
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${currentMonthProgress * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={`h-full rounded-full ${benefitSnapshot.currentMonthActive ? 'bg-emerald-500' : 'bg-amber-500'}`}
              />
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              {benefitSnapshot.currentMonthActive
                ? T.tierMaintained(TIER_NAMES[benefitSnapshot.benefitTier])
                : T.xpRemaining(MONTHLY_ACTIVE_THRESHOLD - benefitSnapshot.currentMonthXp)}
            </p>
          </div>
        </SurfaceCard>
      </div>
    </AppPage>
  )
}

function InfoRow({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <div className="text-right">
        <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
        {detail ? <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{detail}</p> : null}
      </div>
    </div>
  )
}

function ProgressRow({
  label,
  value,
  progress,
  detail,
}: {
  label: string
  value: string
  progress: number
  detail?: string
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-medium text-[var(--text-primary)]">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(progress, 0)}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
        />
      </div>
      {detail ? <p className="mt-1 text-[10px] text-[var(--text-muted)]">{detail}</p> : null}
    </div>
  )
}

function SummaryBox({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-3">
      <p className="text-[11px] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

function PriceInfoBlock({
  label,
  original,
  current,
  detail,
}: {
  label: string
  original: string
  current: string
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-3">
      <p className="text-[11px] text-[var(--text-secondary)]">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="text-[11px] text-[var(--text-muted)] line-through">{original}</span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{current}</span>
      </div>
      <p className="mt-1 text-[10px] text-[var(--text-muted)]">{detail}</p>
    </div>
  )
}

function StatSection({
  title,
  value,
  detail,
  children,
}: {
  title: string
  value: string
  detail: string
  children: ReactNode
}) {
  return (
    <div>
      <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
        {title}
      </p>
      <p className="mt-3 text-3xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{detail}</p>
      {children}
    </div>
  )
}
