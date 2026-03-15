'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  DAILY_VIDEO_XP_TARGET,
  getBenefitStatusLine,
  getTodayIsoDate,
} from '@/lib/learningDashboard'
import {
  formatPrice,
  getMonthlyDiscountedPrice,
  getSavingsPercent,
  getYearlyRenewalPrice,
  MONTHLY_REFERENCE_PRICE,
  YEARLY_REFERENCE_PRICE,
} from '@/lib/billingPricing'
import { DAILY_SESSION_XP_CAP } from '@/lib/xp/sessionXp'
import { getStreakBonusXP } from '@/lib/xp/streakBonus'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { useLevelStore } from '@/stores/useLevelStore'
import {
  MONTHLY_ACTIVE_THRESHOLD,
  MONTHLY_PLAN_DISCOUNTS,
  TIER_NAMES,
  TIER_THRESHOLDS,
  YEARLY_PLAN_RENEWAL_DISCOUNTS,
  useTierStore,
} from '@/stores/useTierStore'
import { useUserStore } from '@/stores/useUserStore'
import { useLocaleStore } from '@/stores/useLocaleStore'

const TRANSLATIONS = {
  ko: {
    details: '상세보기',
    tierStatus: '등급 상태',
    benefitGuide: '혜택 안내',
    totalXp: '총 XP',
    cumulativeXp: '누적 학습 보상 XP',
    todayEarned: '오늘 적립',
    todayEarnedDetail: '오늘 실제로 적립된 XP',
    games: '게임',
    gameDetail: '게임 완료 기준으로 적립됩니다.',
    videos: '영상',
    videoDetail: '영상 완료 기준으로 적립됩니다.',
    streakLabel: '출석 · 연속 학습',
    streakDetailActive: (target: number, days: number) =>
      `오늘 첫 영상 또는 게임 완료 시 ${target} XP 적립 · 현재 ${days}일 연속`,
    streakDetailNew: '오늘 첫 영상 또는 게임 완료 시 10 XP부터 시작됩니다.',
    close: '닫기',
    benefitGuideDescription:
      '누적 XP로 등급이 열리고, 이번 달 300 XP를 채우면 현재 잠금 등급 혜택을 유지하거나 바로 복구할 수 있습니다.',
    currentBenefit: '현재 적용 혜택',
    monthlyFinalPrice: '월간 최종가',
    yearlyFinalPrice: '연간 최종가',
    thisMonth: (current: number, threshold: number) =>
      `이번 달 ${current.toLocaleString()} / ${threshold} XP`,
    joinNow: '가입 즉시 시작',
    xpFrom: (threshold: number) => `${threshold.toLocaleString()} XP부터`,
    current: '현재',
    totalDiscount: (percent: number) => `총 ${percent}% 할인`,
    footerNote:
      '완료된 달 기준으로 300 XP 미만이 2개월 연속 이어지면 적용 혜택이 1단계 내려갑니다. 이번 달 300 XP를 채우면 잠금된 최고 혜택으로 바로 돌아옵니다.',
  },
  ja: {
    details: '詳細',
    tierStatus: 'ランクステータス',
    benefitGuide: '特典案内',
    totalXp: '合計XP',
    cumulativeXp: '累積学習報酬XP',
    todayEarned: '今日の獲得',
    todayEarnedDetail: '今日実際に獲得したXP',
    games: 'ゲーム',
    gameDetail: 'ゲーム完了基準で付与されます。',
    videos: '動画',
    videoDetail: '動画完了基準で付与されます。',
    streakLabel: '出席・連続学習',
    streakDetailActive: (target: number, days: number) =>
      `今日の最初の動画またはゲーム完了時に${target} XP付与 · 現在${days}日連続`,
    streakDetailNew: '今日の最初の動画またはゲーム完了時に10 XPから開始されます。',
    close: '閉じる',
    benefitGuideDescription:
      '累積XPでランクが解放され、今月300 XPを達成すると現在のロック中のランク特典を維持、または即時復旧できます。',
    currentBenefit: '現在適用中の特典',
    monthlyFinalPrice: '月額最終価格',
    yearlyFinalPrice: '年額最終価格',
    thisMonth: (current: number, threshold: number) =>
      `今月 ${current.toLocaleString()} / ${threshold} XP`,
    joinNow: '登録後すぐ開始',
    xpFrom: (threshold: number) => `${threshold.toLocaleString()} XPから`,
    current: '現在',
    totalDiscount: (percent: number) => `合計${percent}%割引`,
    footerNote:
      '完了した月基準で300 XP未満が2ヶ月連続すると、適用特典が1段階下がります。今月300 XPを達成するとロック中の最高特典にすぐ戻ります。',
  },
  'zh-TW': {
    details: '查看詳情',
    tierStatus: '等級狀態',
    benefitGuide: '福利指南',
    totalXp: '總 XP',
    cumulativeXp: '累計學習獎勵 XP',
    todayEarned: '今日獲得',
    todayEarnedDetail: '今日實際獲得的 XP',
    games: '遊戲',
    gameDetail: '以遊戲完成為基準進行累計。',
    videos: '影片',
    videoDetail: '以影片完成為基準進行累計。',
    streakLabel: '出席・連續學習',
    streakDetailActive: (target: number, days: number) =>
      `今日完成第一部影片或遊戲時可獲得 ${target} XP・目前已連續 ${days} 天`,
    streakDetailNew: '今日完成第一部影片或遊戲時，從 10 XP 開始累計。',
    close: '關閉',
    benefitGuideDescription:
      '透過累計 XP 解鎖等級，本月達到 300 XP 即可維持或立即恢復目前已鎖定的等級福利。',
    currentBenefit: '目前適用福利',
    monthlyFinalPrice: '月費最終價',
    yearlyFinalPrice: '年費最終價',
    thisMonth: (current: number, threshold: number) =>
      `本月 ${current.toLocaleString()} / ${threshold} XP`,
    joinNow: '加入即刻開始',
    xpFrom: (threshold: number) => `${threshold.toLocaleString()} XP 起`,
    current: '目前',
    totalDiscount: (percent: number) => `共 ${percent}% 折扣`,
    footerNote:
      '若連續兩個月未達 300 XP，適用福利將降一級。本月達到 300 XP 即可立即恢復至最高已解鎖福利。',
  },
  vi: {
    details: 'Xem chi tiết',
    tierStatus: 'Trạng thái hạng',
    benefitGuide: 'Hướng dẫn quyền lợi',
    totalXp: 'Tổng XP',
    cumulativeXp: 'XP thưởng học tập tích lũy',
    todayEarned: 'Hôm nay nhận được',
    todayEarnedDetail: 'XP thực tế nhận được hôm nay',
    games: 'Trò chơi',
    gameDetail: 'Được tích lũy khi hoàn thành trò chơi.',
    videos: 'Video',
    videoDetail: 'Được tích lũy khi hoàn thành video.',
    streakLabel: 'Điểm danh & Học liên tục',
    streakDetailActive: (target: number, days: number) =>
      `Nhận ${target} XP khi hoàn thành video hoặc trò chơi đầu tiên hôm nay - Hiện tại ${days} ngày liên tục`,
    streakDetailNew: 'Bắt đầu từ 10 XP khi hoàn thành video hoặc trò chơi đầu tiên hôm nay.',
    close: 'Đóng',
    benefitGuideDescription:
      'Mở khóa hạng bằng XP tích lũy. Đạt 300 XP trong tháng này để duy trì hoặc khôi phục ngay quyền lợi hạng đã khóa.',
    currentBenefit: 'Quyền lợi đang áp dụng',
    monthlyFinalPrice: 'Giá cuối tháng',
    yearlyFinalPrice: 'Giá cuối năm',
    thisMonth: (current: number, threshold: number) =>
      `Tháng này ${current.toLocaleString()} / ${threshold} XP`,
    joinNow: 'Bắt đầu ngay khi đăng ký',
    xpFrom: (threshold: number) => `Từ ${threshold.toLocaleString()} XP`,
    current: 'Hiện tại',
    totalDiscount: (percent: number) => `Giảm tổng ${percent}%`,
    footerNote:
      'Nếu 2 tháng liên tiếp không đạt 300 XP, quyền lợi sẽ bị hạ 1 cấp. Đạt 300 XP trong tháng này để khôi phục ngay quyền lợi cao nhất đã mở khóa.',
  },
} as const

type LocaleKey = keyof typeof TRANSLATIONS

function useT() {
  const locale = useLocaleStore((s) => s.locale)
  const key: LocaleKey = locale in TRANSLATIONS ? (locale as LocaleKey) : 'ko'
  return TRANSLATIONS[key]
}

export function TodayDashboard() {
  const router = useRouter()
  const t = useT()
  const locale = useLocaleStore((s) => s.locale)
  const [showTierGuide, setShowTierGuide] = useState(false)
  const totalXP = useUserStore((state) => state.getTotalXP())
  const streakDays = useUserStore((state) => state.streakDays)
  const getDailyTotalGameXP = useGameProgressStore((state) => state.getDailyTotalGameXP)
  const streakBonusDate = useGameProgressStore((state) => state.streakBonusDate)
  const dailyStreakBonusXP = useGameProgressStore((state) => state.dailyStreakBonusXP)
  const dailyVideoXP = useLevelStore((state) => state.getDailyVideoXP())
  const getBenefitSnapshot = useTierStore((state) => state.getBenefitSnapshot)

  const today = getTodayIsoDate()
  const benefitSnapshot = getBenefitSnapshot()
  const gameXpToday = getDailyTotalGameXP()
  const streakTarget = streakDays > 0 ? getStreakBonusXP(streakDays) : 10
  const streakBonusToday = streakBonusDate === today ? dailyStreakBonusXP : 0
  const todayTotal = gameXpToday + dailyVideoXP + streakBonusToday
  const gameXpPct = Math.min((gameXpToday / DAILY_SESSION_XP_CAP) * 100, 100)
  const videoXpPct = Math.min((dailyVideoXP / DAILY_VIDEO_XP_TARGET) * 100, 100)
  const streakBonusPct = streakTarget > 0 ? Math.min((streakBonusToday / streakTarget) * 100, 100) : 0

  const priceLocale = locale === 'ja' ? 'ja' : 'ko'
  const currentMonthlyPrice = getMonthlyDiscountedPrice(benefitSnapshot.monthlyDiscount)
  const currentYearlyPrice = getYearlyRenewalPrice(
    benefitSnapshot.yearlyRenewalDiscount,
    benefitSnapshot.monthlyDiscount,
  )

  const tierRows = TIER_NAMES.map((tierName, index) => {
    const monthlyPrice = getMonthlyDiscountedPrice(MONTHLY_PLAN_DISCOUNTS[index])
    const yearlyPrice = getYearlyRenewalPrice(
      YEARLY_PLAN_RENEWAL_DISCOUNTS[index],
      MONTHLY_PLAN_DISCOUNTS[index],
    )

    return {
      tierName,
      threshold: TIER_THRESHOLDS[index],
      monthlyPrice,
      yearlyPrice,
      monthlySavings: getSavingsPercent(MONTHLY_REFERENCE_PRICE, monthlyPrice),
      yearlySavings: getSavingsPercent(YEARLY_REFERENCE_PRICE, yearlyPrice),
      isCurrent: index === benefitSnapshot.benefitTier,
    }
  })

  return (
    <div className="mb-8 min-w-0 overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] text-left shadow-[var(--card-shadow)]">
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            MY XP
          </span>
          <button
            type="button"
            onClick={() => router.push('/learning/xp')}
            className="text-[11px] font-medium text-[var(--text-muted)]"
          >
            {t.details}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowTierGuide(true)}
          className="mt-4 w-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-4 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] text-[var(--text-secondary)]">{t.tierStatus}</p>
              <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                {TIER_NAMES[benefitSnapshot.benefitTier]}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
                {getBenefitStatusLine(benefitSnapshot)}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[var(--bg-primary)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-muted)]">
              {t.benefitGuide}
            </span>
          </div>
        </button>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatCard
            label={t.totalXp}
            value={`${totalXP.toLocaleString()} XP`}
            detail={t.cumulativeXp}
          />
          <StatCard
            label={t.todayEarned}
            value={`+${todayTotal} XP`}
            detail={t.todayEarnedDetail}
          />
        </div>

        <div className="mt-5 space-y-3">
          <ProgressRow
            label={t.games}
            value={`${gameXpToday}/${DAILY_SESSION_XP_CAP} XP`}
            progress={gameXpPct}
            detail={t.gameDetail}
          />
          <ProgressRow
            label={t.videos}
            value={`${dailyVideoXP}/${DAILY_VIDEO_XP_TARGET} XP`}
            progress={videoXpPct}
            detail={t.videoDetail}
          />
          <ProgressRow
            label={t.streakLabel}
            value={`${streakBonusToday}/${streakTarget} XP`}
            progress={streakBonusPct}
            detail={
              streakDays > 0
                ? t.streakDetailActive(streakTarget, streakDays)
                : t.streakDetailNew
            }
          />
        </div>
      </div>

      {showTierGuide && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4"
          onClick={() => setShowTierGuide(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border-card)] bg-[var(--bg-primary)] shadow-[var(--card-shadow)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 border-b border-[var(--border-card)] bg-[var(--bg-primary)] px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                    {t.benefitGuide}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {t.benefitGuideDescription}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTierGuide(false)}
                  className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-xs font-semibold text-[var(--text-secondary)]"
                >
                  {t.close}
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
              <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-3">
                <p className="text-[11px] text-[var(--text-secondary)]">{t.currentBenefit}</p>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {TIER_NAMES[benefitSnapshot.benefitTier]}
                  </p>
                  <div className="text-right">
                    <p className="text-[11px] text-[var(--text-muted)]">{t.monthlyFinalPrice}</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {formatPrice(currentMonthlyPrice, priceLocale)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {t.yearlyFinalPrice} {formatPrice(currentYearlyPrice, priceLocale)}
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {t.thisMonth(benefitSnapshot.currentMonthXp, MONTHLY_ACTIVE_THRESHOLD)}
                  </p>
                </div>
              </div>

              <div className="mt-4 divide-y divide-[var(--border-card)]">
                {tierRows.map((row) => (
                  <div
                    key={row.tierName}
                    className={`rounded-2xl px-3 py-3 ${
                      row.isCurrent
                        ? 'border border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {row.tierName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {row.threshold === 0 ? t.joinNow : t.xpFrom(row.threshold)}
                        </p>
                      </div>
                      {row.isCurrent ? (
                        <span className="rounded-full bg-[var(--accent-glow)] px-2.5 py-1 text-[10px] font-semibold text-[var(--accent-text)]">
                          {t.current}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                      <CompactPrice
                        label={t.monthlyFinalPrice}
                        original={formatPrice(MONTHLY_REFERENCE_PRICE, priceLocale)}
                        current={formatPrice(row.monthlyPrice, priceLocale)}
                        detail={t.totalDiscount(row.monthlySavings)}
                      />
                      <CompactPrice
                        label={t.yearlyFinalPrice}
                        original={formatPrice(YEARLY_REFERENCE_PRICE, priceLocale)}
                        current={formatPrice(row.yearlyPrice, priceLocale)}
                        detail={t.totalDiscount(row.yearlySavings)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-[11px] leading-relaxed text-[var(--text-muted)]">
                {t.footerNote}
              </p>
            </div>
          </div>
        </div>
      )}
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

function StatCard({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-3">
      <p className="text-[11px] text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">{detail}</p>
    </div>
  )
}

function CompactPrice({
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
    <div className="rounded-2xl bg-[var(--bg-card)] px-3 py-2">
      <p className="text-[10px] text-[var(--text-muted)]">{label}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <span className="text-[10px] text-[var(--text-muted)] line-through">{original}</span>
        <span className="text-sm font-semibold text-[var(--text-primary)]">{current}</span>
      </div>
      <p className="mt-1 text-[10px] text-[var(--text-muted)]">{detail}</p>
    </div>
  )
}

export const DailyMissions = TodayDashboard
