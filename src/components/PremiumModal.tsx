'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { useDiscountStore } from '@/stores/useDiscountStore'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  trigger?: 'video-limit' | 'phrase-limit'
}

const triggerMessages: Record<'video-limit' | 'phrase-limit', string> = {
  'video-limit': '오늘 무료 영상 시청 수를 모두 사용했습니다.',
  'phrase-limit': '무료 표현 저장 수를 모두 사용했습니다.',
}

const MONTHLY_PRICE = 9900
const YEARLY_PRICE = 79900

function formatPrice(value: number) {
  return `${value.toLocaleString('ko-KR')}원`
}

export function PremiumModal({
  isOpen,
  onClose,
  trigger = 'video-limit',
}: PremiumModalProps) {
  const setPremium = usePremiumStore((state) => state.setPremium)
  const getCompletionRate = useDiscountStore((state) => state.getCompletionRate)
  const getDiscountRate = useDiscountStore((state) => state.getDiscountRate)
  const checkAndResetMonthly = useDiscountStore((state) => state.checkAndResetMonthly)

  useEffect(() => {
    if (isOpen) checkAndResetMonthly()
  }, [checkAndResetMonthly, isOpen])

  const completionRate = getCompletionRate()
  const discountRate = getDiscountRate()
  const discountedMonthly = Math.round(MONTHLY_PRICE * (1 - discountRate / 100))
  const discountedYearly = Math.round(YEARLY_PRICE * (1 - discountRate / 100))
  const currentCoupon = Math.round((YEARLY_PRICE * discountRate) / 100)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(event) => event.stopPropagation()}
            className="safe-area-bottom w-full max-w-md rounded-t-3xl bg-[var(--bg-card)] px-6 pb-10 pt-8"
            style={{
              boxShadow: '0 -4px 40px rgba(0,0,0,0.3)',
              border: '1px solid var(--border-card)',
              borderBottom: 'none',
            }}
          >
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-[var(--text-muted)] opacity-40" />
            <p className="mb-2 text-center text-sm text-[var(--text-muted)]">{triggerMessages[trigger]}</p>
            <h2 className="mb-3 text-center text-2xl font-bold text-[var(--text-primary)]">프리미엄으로 제한 없이</h2>
            <p className="mb-6 text-center text-xs text-[var(--text-muted)]">
              이번 달 달성률은 구독 할인으로 바로 이어집니다.
            </p>

            <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-emerald-400">이번 달 할인 진행률</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    현재 달성률 {Math.round(completionRate)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {discountRate > 0 ? `${discountRate}% 할인` : '할인 준비 중'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {discountRate > 0 ? `연간 쿠폰 ${formatPrice(currentCoupon)}` : '미션 달성 시 적용'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8 space-y-3 text-sm text-[var(--text-primary)]">
              <div className="rounded-2xl bg-[var(--bg-secondary)] px-4 py-3">무제한 영상 시청</div>
              <div className="rounded-2xl bg-[var(--bg-secondary)] px-4 py-3">무제한 표현 저장</div>
              <div className="rounded-2xl bg-[var(--bg-secondary)] px-4 py-3">전체 복습 게임 이용</div>
              <div className="rounded-2xl bg-[var(--bg-secondary)] px-4 py-3">광고 없이 학습</div>
            </div>

            <div className="mb-8 space-y-3">
              <div className="rounded-2xl bg-[var(--accent-glow)] px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-[var(--text-primary)]">연간 플랜</p>
                    <p className="mt-0.5 text-sm text-[var(--accent-text)]">
                      {discountRate > 0 ? `${discountRate}% 추가 쿠폰 적용` : '기본 할인 적용'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">{formatPrice(discountedYearly)}</p>
                    <p className="text-xs text-[var(--text-muted)]">/년</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-[var(--bg-secondary)] px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">월간 플랜</p>
                    <p className="mt-0.5 text-sm text-[var(--text-muted)]">부담 없이 시작</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[var(--text-primary)]">{formatPrice(discountedMonthly)}</p>
                    <p className="text-xs text-[var(--text-muted)]">/월</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setPremium(true)
                onClose()
              }}
              className="w-full rounded-2xl bg-[var(--accent-primary)] py-4 text-base font-bold text-white"
            >
              프리미엄 시작
            </button>
            <button
              onClick={onClose}
              className="mt-2 w-full py-3 text-sm font-medium text-[var(--text-muted)]"
            >
              나중에 하기
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
