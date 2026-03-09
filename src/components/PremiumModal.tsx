'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { getBillingConfig, type BillingPlan } from '@/lib/billing'
import { isNative } from '@/lib/platform'
import { useAuth } from '@/hooks/useAuth'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { ModalFeatureList, ModalHeader, ModalShell } from '@/components/ui/ModalShell'
import type { PurchasesPackage } from '@revenuecat/purchases-typescript-internal-esm'

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
  const setPremiumEntitlement = usePremiumStore((s) => s.setPremiumEntitlement)
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>('yearly')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [nativePackages, setNativePackages] = useState<PurchasesPackage[]>([])
  const native = isNative()
  const nextPath = useMemo(() => {
    const query = searchParams.toString()
    return query ? `${pathname}?${query}` : pathname
  }, [pathname, searchParams])

  // Load RevenueCat offerings on native
  useEffect(() => {
    if (!native || !isOpen) return

    let cancelled = false

    const loadOfferings = async () => {
      try {
        const { getOfferings } = await import('@/lib/nativeBilling')
        const offerings = await getOfferings()
        if (!cancelled && offerings?.current) {
          setNativePackages(offerings.current.availablePackages)
        }
      } catch (error) {
        console.warn('[billing] failed to load native offerings:', error)
      }
    }

    void loadOfferings()
    return () => { cancelled = true }
  }, [native, isOpen])

  const handleNativePurchase = async (pkg: PurchasesPackage) => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      const { purchasePackage, isPremiumFromCustomerInfo } = await import('@/lib/nativeBilling')
      const customerInfo = await purchasePackage(pkg.identifier)
      const isPremium = isPremiumFromCustomerInfo(customerInfo)
      setPremiumEntitlement(isPremium)

      if (isPremium) {
        onClose()
      }
    } catch (error: unknown) {
      const err = error as { code?: string; userCancelled?: boolean }
      if (err.userCancelled || err.code === 'PURCHASE_CANCELLED') {
        // User cancelled, no error message needed
      } else {
        setErrorMessage('결제에 실패했습니다. 다시 시도해 주세요.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleWebCheckout = async () => {
    if (!billingEnabled) return

    if (!user) {
      window.location.assign(`/login?next=${encodeURIComponent(nextPath || '/profile')}`)
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleCheckout = () => {
    if (native && nativePackages.length > 0) {
      const pkg = nativePackages.find((p) =>
        selectedPlan === 'yearly'
          ? p.packageType === 'ANNUAL'
          : p.packageType === 'MONTHLY',
      ) ?? nativePackages[0]
      void handleNativePurchase(pkg)
    } else {
      void handleWebCheckout()
    }
  }

  const isReady = native ? nativePackages.length > 0 : billingEnabled

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} position="bottom">
      <div className="mb-2 text-center text-sm text-[var(--text-muted)]">
        {triggerMessages[trigger]}
      </div>
      <ModalHeader
        eyebrow="Premium"
        title={isReady ? '제한 없이 이어보기' : '결제 준비 중입니다'}
        description={
          isReady
            ? '프리미엄으로 업그레이드하면 모든 기능을 제한 없이 이용할 수 있습니다.'
            : '결제 연동이 준비되면 프리미엄 구독을 시작할 수 있습니다.'
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

      {isReady ? (
        <div className="mb-5 grid gap-3">
          {native && nativePackages.length > 0
            ? nativePackages.map((pkg) => {
                const isYearly = pkg.packageType === 'ANNUAL'
                const selected =
                  (selectedPlan === 'yearly' && isYearly) ||
                  (selectedPlan === 'monthly' && !isYearly)

                return (
                  <button
                    key={pkg.identifier}
                    onClick={() => setSelectedPlan(isYearly ? 'yearly' : 'monthly')}
                    className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                      selected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                        : 'border-[var(--border-card)] bg-[var(--bg-secondary)]/35'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {isYearly ? '연간 플랜' : '월간 플랜'}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {pkg.product.description}
                        </p>
                      </div>
                      {isYearly && (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                          추천
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-lg font-bold text-[var(--text-primary)]">
                      {pkg.product.priceString}
                    </p>
                  </button>
                )
              })
            : (['yearly', 'monthly'] as BillingPlan[]).map((plan) => {
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
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                          {details.detail}
                        </p>
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
        <div className="mb-5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">현재는 무료 운영 중</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            결제 연동이 준비되면 프리미엄 구독을 시작할 수 있습니다.
          </p>
        </div>
      )}

      {isReady && !native && !user && (
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
        disabled={!isReady || submitting}
        className="w-full rounded-2xl bg-[var(--accent-primary)] py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {!isReady
          ? '출시 준비 중'
          : submitting
            ? '결제 연결 중...'
            : !native && !user
              ? '로그인 후 구독 시작'
              : '프리미엄 시작'}
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
