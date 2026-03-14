'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import {
  buildMilestoneMissions,
  buildMonthlyXpTrend,
  DAILY_VIDEO_XP_TARGET,
  getMilestoneSummary,
  getStreakBonusProgress,
  getStreakProgress,
  getTierStatusDetail,
  getTodayIsoDate,
  MILESTONE_EXPLAINER,
  MONTHLY_ACTIVITY_EXPLAINER,
} from '@/lib/learningDashboard'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP } from '@/lib/xp/streakBonus'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLevelChallengeStore } from '@/stores/useLevelChallengeStore'
import { useLevelStore } from '@/stores/useLevelStore'
import { useMilestoneStore } from '@/stores/useMilestoneStore'
import { MONTHLY_ACTIVE_THRESHOLD, TIER_NAMES, type TierLevel, useTierStore } from '@/stores/useTierStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

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
  const monthlyXpHistory = useTierStore((state) => state.monthlyXpHistory)
  const recalculateTier = useTierStore((state) => state.recalculateTier)
  const getTierProgress = useTierStore((state) => state.getTierProgress)
  const getNextTierXp = useTierStore((state) => state.getNextTierXp)
  const getCurrentMonthXp = useTierStore((state) => state.getCurrentMonthXp)
  const getCurrentDiscount = useTierStore((state) => state.getCurrentDiscount)
  const completionCounts = useWatchHistoryStore((state) => state.completionCounts)
  const challengeAttempts = useLevelChallengeStore((state) => state.challengeAttempts)

  useEffect(() => {
    recalculateTier()
  }, [recalculateTier])

  const today = getTodayIsoDate()
  const completedVideos = Object.values(completionCounts).filter((count) => count > 0).length
  const gameXpToday = getDailyTotalGameXP()
  const streakBonusAwardedToday = streakBonusDate === today
  const streakBonusToday = streakBonusAwardedToday ? dailyStreakBonusXP : 0
  const streakBonusProgress = getStreakBonusProgress(streakDays, streakBonusAwardedToday)
  const todayTotal = gameXpToday + dailyVideoXP + streakBonusToday
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)
  const videoXpPct = Math.min((dailyVideoXP / DAILY_VIDEO_XP_TARGET) * 100, 100)
  const streakProgress = getStreakProgress(streakDays)
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
  )
  const milestoneSummary = getMilestoneSummary(milestoneMissions)

  const { next, progress } = getTierProgress()
  const nextTierXp = getNextTierXp()
  const monthlyXp = getCurrentMonthXp()
  const discount = getCurrentDiscount()
  const tierName = TIER_NAMES[currentTier]
  const colors = TIER_COLORS[currentTier]
  const isChampion = currentTier === 5
  const monthlyTrend = buildMonthlyXpTrend(monthlyXpHistory)

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
            XP
          </p>
        </div>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            총 XP
          </p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{totalXP}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            게임, 영상, 연속 학습 보너스, 마일스톤 수령 XP가 모두 여기에 누적됩니다.
          </p>
          <div className="mt-4 space-y-2.5">
            <InfoRow label="영상 누적 XP" value={`${videoXPTotal} XP`} />
            <InfoRow label="마일스톤 누적 XP" value={`${milestoneXP} XP`} />
            <InfoRow label="이번 달 XP" value={`${monthlyXp.toLocaleString()} XP`} />
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              오늘의 XP
            </p>
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              +{todayTotal} XP
            </span>
          </div>

          <div className="space-y-3.5">
            <ProgressRow
              label="게임"
              value={`${gameXpToday}/${DAILY_SESSION_XP_CAP} XP`}
              progress={gameXpPct}
            />
            <ProgressRow
              label="영상"
              value={`${dailyVideoXP}/${DAILY_VIDEO_XP_TARGET} XP`}
              progress={videoXpPct}
            />
            <ProgressRow
              label="연속 학습 보너스"
              value={
                streakBonusToday > 0
                  ? `${streakBonusToday}/${streakBonusToday} XP`
                  : streakDays > 0
                    ? `0/${getStreakBonusXP(streakDays)} XP`
                    : '잠김'
              }
              progress={streakBonusProgress.progress * 100}
              detail={
                streakDays > 0
                  ? `${streakDays}일 연속 학습 기준, 하루 1회만 적립`
                  : '연속 학습을 시작하면 보너스가 열립니다.'
              }
            />
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                마일스톤
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {MILESTONE_EXPLAINER}
              </p>
              <div className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
                <p>{milestoneSummary.readyCount}개 바로 수령 가능</p>
                <p>{milestoneSummary.claimedCount}개 이미 수령 완료</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push('/learning/milestones')}
              className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
            >
              상세 보기
            </button>
          </div>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            티어 상태
          </p>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${colors.bg} ${colors.text}`}>
                {tierName}
              </span>
              {discount > 0 && (
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                  {discount}% 할인
                </span>
              )}
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              이번 달 {monthlyXp.toLocaleString()} XP
            </span>
          </div>

          {!isChampion && next !== null ? (
            <div className="mt-3">
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-[var(--border-card)]">
                <motion.div
                  className={`h-full rounded-full ${colors.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-[var(--text-muted)]">
                {getTierStatusDetail(nextTierXp, next)}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-[10px] text-[var(--text-muted)]">현재 최상위 티어를 유지하고 있습니다.</p>
          )}
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            연속 학습
          </p>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{streakDays}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">연속 학습 일수</p>
            </div>
            <div className="text-right text-[11px] text-[var(--text-secondary)]">
              {streakProgress.remaining > 0 ? (
                <p>{streakProgress.target}일 마일스톤까지 {streakProgress.remaining}일 남음</p>
              ) : (
                <p>{streakProgress.target}일 마일스톤 달성</p>
              )}
            </div>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.max(streakProgress.progress, 0) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]"
            />
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            이 섹션은 연속 기록 진행도입니다. 위 보너스 바와 별개로 다음 마일스톤까지 얼마나 남았는지 보여줍니다.
          </p>
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            최근 XP 기록
          </p>
          {xpHistory.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">아직 기록된 XP 활동이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {xpHistory.slice(0, 8).map((event) => (
                <div key={event.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">{event.reason}</p>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                      {new Date(event.createdAt).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-[var(--accent-text)]">+{event.amount} XP</span>
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>

        <SurfaceCard className="p-5">
          <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            월간 활동
          </p>
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            {MONTHLY_ACTIVITY_EXPLAINER}
          </p>
          <div className="space-y-3">
            {monthlyTrend.map((point) => (
              <div key={point.key}>
                <div className="mb-1 flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-secondary)]">{point.label}</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {point.xp.toLocaleString()} / {MONTHLY_ACTIVE_THRESHOLD} XP
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${point.progress * 100}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={`h-full rounded-full ${point.active ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  />
                </div>
                <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                  {point.active ? '활동 기준을 유지한 달' : '유지 기준 아래인 달'}
                </p>
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </AppPage>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
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
      {detail ? (
        <p className="mt-1 text-[10px] text-[var(--text-muted)]">{detail}</p>
      ) : null}
    </div>
  )
}
