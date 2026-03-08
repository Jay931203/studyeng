'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { useDiscountStore } from '@/stores/useDiscountStore'
import { usePremiumStore } from '@/stores/usePremiumStore'

const YEARLY_PRICE = 79900

function formatWon(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

export function DailyMissions() {
  const missions = useDailyMissionStore((state) => state.missions)
  const allCompleteBonus = useDailyMissionStore((state) => state.allCompleteBonus)
  const checkAndResetDaily = useDailyMissionStore((state) => state.checkAndResetDaily)

  useEffect(() => {
    checkAndResetDaily()
  }, [checkAndResetDaily])

  return (
    <div className="mb-8 overflow-hidden rounded-2xl border border-white/[0.04] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
          오늘의 미션
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            allCompleteBonus ? 'bg-green-500/15 text-green-400' : 'bg-white/[0.03] text-[var(--text-muted)]'
          }`}
        >
          {allCompleteBonus ? '전체 완료' : '진행 중'}
        </span>
      </div>

      <div className="px-4 pb-2">
        {missions.map((mission, index) => {
          const progress = mission.target > 0 ? (mission.current / mission.target) * 100 : 0
          return (
            <div key={mission.id} className="relative py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-secondary)] text-xs font-bold text-[var(--accent-text)]">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span
                      className={`text-sm ${
                        mission.completed
                          ? 'text-[var(--text-muted)] line-through'
                          : 'font-medium text-[var(--text-primary)]'
                      }`}
                    >
                      {mission.title}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {mission.current}/{mission.target}
                    </span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-white/[0.04]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      className={`h-full rounded-full ${
                        mission.completed ? 'bg-green-500' : 'bg-[var(--accent-primary)]'
                      }`}
                    />
                  </div>
                </div>
              </div>
              {index < missions.length - 1 && (
                <div className="absolute bottom-0 left-11 right-0 h-px bg-white/[0.04]" />
              )}
            </div>
          )
        })}
      </div>

      {allCompleteBonus && (
        <div className="px-4 pb-4">
          <p className="text-center text-xs text-green-400/80">
            오늘 미션 완료가 이번 달 구독 할인 진행률에 반영됐습니다.
          </p>
        </div>
      )}

      <DiscountProgress />
    </div>
  )
}

function DiscountProgress() {
  const isPremium = usePremiumStore((state) => state.isPremium)
  const checkAndResetMonthly = useDiscountStore((state) => state.checkAndResetMonthly)
  const completedDays = useDiscountStore((state) => state.completedDays)
  const getCompletionRate = useDiscountStore((state) => state.getCompletionRate)
  const getDiscountRate = useDiscountStore((state) => state.getDiscountRate)
  const getNextTierInfo = useDiscountStore((state) => state.getNextTierInfo)
  const getDaysInCurrentMonth = useDiscountStore((state) => state.getDaysInCurrentMonth)
  const hasConsecutiveBonus = useDiscountStore((state) => state.hasConsecutiveBonus)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    checkAndResetMonthly()
  }, [checkAndResetMonthly])

  const completionRate = getCompletionRate()
  const discountRate = getDiscountRate()
  const nextTier = getNextTierInfo()
  const totalDays = getDaysInCurrentMonth()
  const completedCount = completedDays.length
  const currentCoupon = Math.round((YEARLY_PRICE * discountRate) / 100)
  const nextCoupon = nextTier ? Math.round((YEARLY_PRICE * nextTier.nextDiscount) / 100) : 0
  const hasBonus = hasConsecutiveBonus()

  const milestoneRows = useMemo(
    () => [
      { label: '70% 달성', value: '10% 쿠폰', info: `${formatWon(Math.round(YEARLY_PRICE * 0.1))}` },
      { label: '90% 달성', value: '15% 쿠폰', info: `${formatWon(Math.round(YEARLY_PRICE * 0.15))}` },
      { label: '3개월 연속 90%', value: '20% 쿠폰', info: `${formatWon(Math.round(YEARLY_PRICE * 0.2))}` },
    ],
    [],
  )

  return (
    <>
      <div className="mx-4 mb-4">
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-xl border border-white/[0.03] bg-white/[0.02] px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-[var(--text-secondary)]">이번 달 구독 할인</span>
            <span className="text-[10px] text-[var(--text-muted)]">상세 보기</span>
          </div>
          <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
              style={{ width: `${Math.min(completionRate, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="text-[var(--text-muted)]">
              {completedCount}/{totalDays}일 완료 ({Math.round(completionRate)}%)
            </span>
            <span className="font-medium text-emerald-400">
              {nextTier ? `${nextTier.daysNeeded}일 더 채우면 ${nextTier.nextDiscount}%` : hasBonus ? '보너스 적용 중' : isPremium ? '현재 최고 구간' : '구독 시 적용'}
            </span>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-6 sm:items-center"
              onClick={() => setOpen(false)}
            >
              <div
                className="w-full max-w-md rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">Discount</p>
                    <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">이번 달 할인 진행 상황</h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      지금 달성한 정도와 다음 연간 결제 할인 쿠폰 예상 금액을 볼 수 있습니다.
                    </p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                    aria-label="할인 상세 닫기"
                  >
                    ×
                  </button>
                </div>

                <div className="rounded-2xl bg-[var(--bg-secondary)] p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">현재 달성률</p>
                      <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{Math.round(completionRate)}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)]">지금 기준 연간 쿠폰</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-400">
                        {discountRate > 0 ? formatWon(currentCoupon) : '아직 없음'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-primary)]/35 p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">다음 할인 구간</p>
                  {nextTier ? (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      앞으로 <span className="font-semibold text-[var(--text-primary)]">{nextTier.daysNeeded}일</span> 더 달성하면{' '}
                      <span className="font-semibold text-emerald-400">{nextTier.nextDiscount}% 쿠폰</span>을 받고,
                      예상 금액은 {formatWon(nextCoupon)}입니다.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {hasBonus ? '현재 연속 달성 보너스로 최고 할인 구간이 적용 중입니다.' : '이번 달 최고 구간을 이미 달성했습니다.'}
                    </p>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {milestoneRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between rounded-2xl bg-[var(--bg-secondary)] px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{row.label}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{row.info}</p>
                      </div>
                      <p className="text-sm font-semibold text-emerald-400">{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
