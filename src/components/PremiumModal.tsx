'use client'

import { useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getBillingConfig, type BillingPlan } from '@/lib/billing'
import { useAuth } from '@/hooks/useAuth'
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

const PLAN_DETAILS: Record<
  BillingPlan,
  { label: string; detail: string; price: string; highlight?: boolean }
> = {
  yearly: {
    label: '연간 플랜',
    detail: '1년 기준으로 가장 저렴한 옵션',
    price: '79,900원 / 년',
    highlight: true,
  },
  monthly: {
    label: '월간 플랜',
    detail: '가볍게 시작하는 월 구독',
    price: '9,900원 / 월',
  },
}

export function PremiumModal({
  isOpen,
  onClose,
  trigger = 'video-limit',
}: PremiumModalProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { enabled: billingEnabled } = getBillingConfig()
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>('yearly')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const nextPath = useMemo(() => {
    const query = searchParams.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  const handleCheckout = async () => {
    if (!billingEnabled) {
      return
    }

    if (!user) {
      window.location.assign(`/login?next=${encodeURIComponent(nextPath || '/profile')}`)
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
        const response = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ plan: selectedPlan, returnPath: nextPath }),
        })

      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null

      if (response.status === 401) {
        window.location.assign(`/login?next=${encodeURIComponent(nextPath || '/profile')}`)
        return
      }

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? 'checkout-failed')
      }

      window.location.assign(payload.url)
      onClose()
    } catch (error) {
      console.warn('[billing] checkout start failed:', error)
      setErrorMessage('결제 세션을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} position="bottom">
      <div className="mb-2 text-center text-sm text-[var(--text-muted)]">
        {triggerMessages[trigger]}
      </div>
      <ModalHeader
        eyebrow="Premium"
        title={billingEnabled ? '제한 없이 이어보기' : '결제 준비 중입니다'}
        description={
          billingEnabled
            ? '실제 결제와 서버 entitlement 기준으로 프리미엄 권한을 부여합니다.'
            : '실결제 연동이 끝나기 전까지는 프리미엄 판매와 강제 잠금을 열지 않습니다.'
        }
        onClose={onClose}
      />

      <ModalFeatureList
        items={[
          '무제한 영상 시청',
          '무제한 문장 저장',
          '전체 복습 게임 이용',
          '광고 없이 학습',
        ]}
      />

      {billingEnabled ? (
        <div className="mb-5 grid gap-3">
          {(['yearly', 'monthly'] as BillingPlan[]).map((plan) => {
            const details = PLAN_DETAILS[plan]
            const selected = selectedPlan === plan

            return (
              <button
                key={plan}
                onClick={() => setSelectedPlan(plan)}
                className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                  selected
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                    : 'border-[var(--border-card)] bg-[var(--bg-secondary)]/35'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {details.label}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{details.detail}</p>
                  </div>
                  {details.highlight && (
                    <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                      추천
                    </span>
                  )}
                </div>
                <p className="mt-3 text-lg font-bold text-[var(--text-primary)]">
                  {details.price}
                </p>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mb-5 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-amber-300">현재는 무료 운영 중</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
            서버 결제, 웹훅, 권한 검증이 모두 준비될 때까지는 판매를 비활성화합니다.
          </p>
        </div>
      )}

      {billingEnabled && !user && (
        <div className="mb-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-sky-300">로그인 후 결제</p>
          <p className="mt-1 text-xs leading-relaxed text-sky-100/80">
            결제 권한과 구독 상태는 계정 단위로 관리됩니다.
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={!billingEnabled || submitting}
        className="w-full rounded-2xl bg-[var(--accent-primary)] py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!billingEnabled
          ? '출시 준비 중'
          : submitting
            ? '결제 연결 중...'
            : user
              ? '프리미엄 시작'
              : '로그인 후 구독 시작'}
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
