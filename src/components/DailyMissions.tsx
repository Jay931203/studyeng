'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useDailyMissionStore } from '@/stores/useDailyMissionStore'
import { useDiscountStore } from '@/stores/useDiscountStore'
import { usePremiumStore } from '@/stores/usePremiumStore'

const YEARLY_PRICE = 79900

const missionMeta: Record<
  string,
  {
    title: string
    helper: string
    icon: ReactNode
    colors: { bg: string; icon: string; bar: string }
  }
> = {
  'watch-videos': {
    title: '영상 시청',
    helper: '오늘 추천 클립 보기',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
          clipRule="evenodd"
        />
      </svg>
    ),
    colors: {
      bg: 'bg-blue-500/10',
      icon: 'text-blue-400',
      bar: 'bg-blue-500',
    },
  },
  'play-game': {
    title: '게임 플레이',
    helper: '복습 게임 1회',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M11.25 5.337c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.036 1.007-1.875 2.25-1.875S15 2.34 15 3.375c0 .369-.128.713-.349 1.003-.215.283-.401.604-.401.959 0 .332.278.598.61.578 1.91-.114 3.79-.342 5.632-.676a.75.75 0 01.878.645 49.17 49.17 0 01.376 5.452.657.657 0 01-.66.664c-.354 0-.675-.186-.958-.401a1.647 1.647 0 00-1.003-.349c-1.035 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401.31 0 .557.262.534.571a48.774 48.774 0 01-.595 4.845.75.75 0 01-.61.61c-1.82.317-3.673.533-5.555.642a.58.58 0 01-.611-.581c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.035-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959a.641.641 0 01-.658.643 49.118 49.118 0 01-4.708-.441.75.75 0 01-.645-.878c.293-1.614.504-3.257.629-4.924A.53.53 0 005.337 15c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.036 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.369 0 .713.128 1.003.349.283.215.604.401.959.401a.656.656 0 00.659-.663 47.703 47.703 0 00-.31-4.82.75.75 0 01.83-.832c1.343.155 2.703.254 4.077.294a.64.64 0 00.657-.642z" />
      </svg>
    ),
    colors: {
      bg: 'bg-purple-500/10',
      icon: 'text-purple-400',
      bar: 'bg-purple-500',
    },
  },
  'save-phrase': {
    title: '표현 저장',
    helper: '좋은 표현 1개 저장',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
          clipRule="evenodd"
        />
      </svg>
    ),
    colors: {
      bg: 'bg-amber-500/10',
      icon: 'text-amber-400',
      bar: 'bg-amber-500',
    },
  },
}

const discountMilestones = [
  { label: '이번 달 70% 달성', rate: 70, discount: 10 },
  { label: '이번 달 90% 달성', rate: 90, discount: 15 },
  { label: '3개월 연속 90% 달성', rate: 90, discount: 20 },
]

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-8"
    >
      <div className="overflow-hidden rounded-2xl border border-white/[0.04] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
        <div className="flex items-center justify-between px-4 pb-2 pt-4">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            오늘의 미션
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              allCompleteBonus
                ? 'bg-green-500/15 text-green-400'
                : 'bg-white/[0.03] text-[var(--text-muted)]'
            }`}
          >
            {allCompleteBonus ? '전체 완료' : '진행 중'}
          </span>
        </div>

        <div className="px-4 pb-2">
          {missions.map((mission, index) => {
            const meta = missionMeta[mission.id] ?? missionMeta['watch-videos']
            const progress = mission.target > 0 ? mission.current / mission.target : 0

            return (
              <div key={mission.id} className="relative py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${meta.colors.bg} ${
                      mission.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <span className={meta.colors.icon}>{meta.icon}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p
                          className={`text-sm ${
                            mission.completed
                              ? 'text-[var(--text-muted)] line-through'
                              : 'font-medium text-[var(--text-primary)]'
                          }`}
                        >
                          {meta.title}
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)]">{meta.helper}</p>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">
                        {mission.current}/{mission.target}
                      </span>
                    </div>

                    <div className="h-1 overflow-hidden rounded-full bg-white/[0.04]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress * 100, 100)}%` }}
                        transition={{ duration: 0.35, ease: 'easeOut' }}
                        className={`h-full rounded-full ${
                          mission.completed ? 'bg-green-500/80' : meta.colors.bar
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
              오늘 미션을 모두 완료해서 할인 진행률에 반영했어요.
            </p>
          </div>
        )}

        <DiscountProgress />
      </div>
    </motion.div>
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

  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    checkAndResetMonthly()
  }, [checkAndResetMonthly])

  const completionRate = getCompletionRate()
  const discountRate = getDiscountRate()
  const nextTier = getNextTierInfo()
  const totalDays = getDaysInCurrentMonth()
  const completedCount = completedDays.length
  const currentAnnualCouponValue = Math.round((YEARLY_PRICE * discountRate) / 100)
  const nextAnnualCouponValue = nextTier
    ? Math.round((YEARLY_PRICE * nextTier.nextDiscount) / 100)
    : 0

  const milestoneRows = useMemo(
    () =>
      discountMilestones.map((milestone) => {
        const requiredDays = milestone.label.includes('3개월')
          ? null
          : Math.ceil((milestone.rate / 100) * totalDays)
        const reached = milestone.label.includes('3개월')
          ? hasConsecutiveBonus()
          : completionRate >= milestone.rate

        return {
          ...milestone,
          requiredDays,
          reached,
          couponValue: Math.round((YEARLY_PRICE * milestone.discount) / 100),
        }
      }),
    [completionRate, hasConsecutiveBonus, totalDays],
  )

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.25 }}
        className="mx-4 mb-4"
      >
        <button
          onClick={() => setShowDetail(true)}
          className="w-full rounded-xl border border-white/[0.03] bg-white/[0.02] px-3 py-3 text-left transition-colors hover:bg-white/[0.04]"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-emerald-400">
                <path
                  fillRule="evenodd"
                  d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                이번 달 구독 할인
              </span>
            </div>
            <div className="flex items-center gap-2">
              {discountRate > 0 && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
                  {discountRate}% 할인
                </span>
              )}
              <span className="text-[10px] font-medium text-[var(--text-muted)]">
                상세 보기
              </span>
            </div>
          </div>

          <div className="relative mb-2 h-1.5 overflow-hidden rounded-full bg-white/[0.04]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(completionRate, 100)}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
            {[30, 50, 70, 90].map((mark) => (
              <div
                key={mark}
                className="absolute bottom-0 top-0 w-px bg-white/10"
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] text-[var(--text-muted)]">
              {completedCount}/{totalDays}일 완료 ({Math.round(completionRate)}%)
            </span>
            {nextTier ? (
              <span className="text-[10px] font-medium text-emerald-400">
                {nextTier.daysNeeded}일 더 채우면 {nextTier.nextDiscount}% 쿠폰
              </span>
            ) : hasConsecutiveBonus() ? (
              <span className="text-[10px] font-medium text-yellow-400">
                연속 달성 보너스 적용 중
              </span>
            ) : (
              <span className="text-[10px] text-[var(--text-muted)]">
                {isPremium ? '현재 최고 구간' : '구독 시 바로 적용'}
              </span>
            )}
          </div>
        </button>
      </motion.div>

      <AnimatePresence>
        {showDetail && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm"
              onClick={() => setShowDetail(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed inset-0 z-[150] flex items-end justify-center px-4 pb-6 sm:items-center"
              onClick={() => setShowDetail(false)}
            >
              <div
                className="w-full max-w-md rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                      Discount
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                      이번 달 할인 진행 상황
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      지금 얼마나 달성했고, 다음 연간 결제 할인 쿠폰까지 얼마나 남았는지
                      한 번에 확인할 수 있습니다.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDetail(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                    aria-label="할인 상세 닫기"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>

                <div className="rounded-2xl bg-[var(--bg-secondary)] p-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs text-[var(--text-muted)]">현재 달성률</p>
                      <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">
                        {Math.round(completionRate)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[var(--text-muted)]">지금 기준 연간 할인</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-400">
                        {discountRate > 0 ? formatWon(currentAnnualCouponValue) : '아직 없음'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
                      style={{ width: `${Math.min(completionRate, 100)}%` }}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>{completedCount}일 완료</span>
                    <span>이번 달 {totalDays}일 기준</span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-primary)]/35 p-4">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">다음 할인까지</p>
                  {nextTier ? (
                    <>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        앞으로{' '}
                        <span className="font-semibold text-[var(--text-primary)]">
                          {nextTier.daysNeeded}일
                        </span>{' '}
                        더 달성하면{' '}
                        <span className="font-semibold text-emerald-400">
                          {nextTier.nextDiscount}% 연간 할인 쿠폰
                        </span>
                        을 받을 수 있어요.
                      </p>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        예상 할인 금액 {formatWon(nextAnnualCouponValue)}
                      </p>
                    </>
                  ) : hasConsecutiveBonus() ? (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      현재 3개월 연속 달성 보너스로 최고 구간 할인 중입니다.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      이번 달 최고 구간 할인까지 이미 달성했습니다.
                    </p>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {milestoneRows.map((milestone) => (
                    <div
                      key={`${milestone.label}-${milestone.discount}`}
                      className="flex items-center justify-between rounded-2xl bg-[var(--bg-secondary)] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {milestone.label}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {milestone.requiredDays
                            ? `${milestone.requiredDays}일 달성 기준`
                            : '연속 달성 보너스'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-400">
                          {milestone.discount}% 쿠폰
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {formatWon(milestone.couponValue)}
                        </p>
                        <p
                          className={`mt-1 text-[11px] ${
                            milestone.reached ? 'text-green-400' : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {milestone.reached ? '달성 완료' : '아직 전'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs text-[var(--text-muted)]">
                  {isPremium
                    ? '프리미엄 구독 시 다음 연간 결제에 쿠폰이 적용됩니다.'
                    : '프리미엄 구독을 시작하면 다음 연간 결제 할인 쿠폰을 바로 쓸 수 있어요.'}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
