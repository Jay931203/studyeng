'use client'

import { useEffect } from 'react'
import { getBillingConfig } from '@/lib/billing'
import { useDiscountStore } from '@/stores/useDiscountStore'
import { ModalFeatureList, ModalHeader, ModalShell } from '@/components/ui/ModalShell'

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  trigger?: 'video-limit' | 'phrase-limit'
}

const triggerMessages: Record<'video-limit' | 'phrase-limit', string> = {
  'video-limit': '오늘 무료 영상 시청 한도를 모두 사용했습니다.',
  'phrase-limit': '무료 문장 저장 한도를 모두 사용했습니다.',
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
  const { checkoutUrl, enabled: billingEnabled } = getBillingConfig()

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} position="bottom">
      <div className="mb-2 text-center text-sm text-[var(--text-muted)]">
        {triggerMessages[trigger]}
      </div>
      <ModalHeader
        eyebrow="프리미엄"
        title={billingEnabled ? '제한 없이 이어보기' : '결제 준비 중입니다'}
        description={
          billingEnabled
            ? '이번 달 달성률은 구독 할인으로 바로 이어집니다.'
            : '실결제 연동 전이라 현재는 프리미엄 판매를 열어두지 않았습니다.'
        }
        onClose={onClose}
      />

      {billingEnabled ? (
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
                {discountRate > 0
                  ? `연간 쿠폰 ${formatPrice(currentCoupon)}`
                  : '미션 달성 시 적용'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-amber-300">현재는 무료 운영 중</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
            실제 결제와 구독 검증이 준비되기 전까지는 프리미엄 판매와 강제 잠금을
            비활성화합니다.
          </p>
        </div>
      )}

      <ModalFeatureList
        items={['무제한 영상 시청', '무제한 문장 저장', '전체 복습 게임 이용', '광고 없이 학습']}
      />

      {billingEnabled && (
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
                <p className="text-lg font-bold text-emerald-400">
                  {formatPrice(discountedYearly)}
                </p>
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
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {formatPrice(discountedMonthly)}
                </p>
                <p className="text-xs text-[var(--text-muted)]">/월</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (!billingEnabled || !checkoutUrl) {
            return
          }

          window.location.assign(checkoutUrl)
          onClose()
        }}
        disabled={!billingEnabled || !checkoutUrl}
        className="w-full rounded-2xl bg-[var(--accent-primary)] py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {billingEnabled ? '프리미엄 시작' : '출시 준비 중'}
      </button>
      <button
        onClick={onClose}
        className="mt-2 w-full py-3 text-sm font-medium text-[var(--text-muted)]"
      >
        계속 둘러보기
      </button>
    </ModalShell>
  )
}
