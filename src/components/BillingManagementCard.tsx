'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { PurchasesPackage } from '@revenuecat/purchases-typescript-internal-esm'
import { getBillingConfig, type BillingPlan } from '@/lib/billing'
import { getPlatform, isNative } from '@/lib/platform'
import { useAuth } from '@/hooks/useAuth'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { SurfaceCard } from '@/components/ui/AppPage'

interface BillingStatusPayload {
  enabled: boolean
  isPremium: boolean
  entitlement: {
    planKey: string
    status: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null
}

interface PlanOption {
  id: BillingPlan
  label: string
  detail: string
  price: string
  highlight?: string
}

const ANDROID_APP_ID = 'com.studyeng.app'

const WEB_PLAN_OPTIONS: Record<BillingPlan, PlanOption> = {
  yearly: {
    id: 'yearly',
    label: 'YEARLY',
    detail: '꾸준히 쓰는 분들에게 가장 유리한 플랜',
    price: '연 79,900원',
    highlight: 'BEST VALUE',
  },
  monthly: {
    id: 'monthly',
    label: 'MONTHLY',
    detail: '부담 없이 시작할 수 있는 월간 플랜',
    price: '월 9,900원',
  },
}

function formatDate(value: string | null) {
  if (!value) return '확인 불가'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function getPlanLabel(planKey: string | null | undefined) {
  switch (planKey) {
    case 'premium_yearly':
      return '연간 멤버십'
    case 'premium_monthly':
      return '월간 멤버십'
    case 'premium':
      return '프리미엄 멤버십'
    default:
      return '무료 플랜'
  }
}

function getStoreLabel() {
  switch (getPlatform()) {
    case 'android':
      return 'Play Store'
    case 'ios':
      return 'App Store'
    default:
      return 'store'
  }
}

function getStoreManagementUrl() {
  switch (getPlatform()) {
    case 'android':
      return `https://play.google.com/store/account/subscriptions?package=${ANDROID_APP_ID}`
    case 'ios':
      return 'https://apps.apple.com/account/subscriptions'
    default:
      return null
  }
}

function PlanTile({
  option,
  selected,
  current,
  onClick,
}: {
  option: PlanOption
  selected: boolean
  current: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
        selected
          ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
          : 'border-[var(--border-card)] bg-[var(--bg-primary)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{option.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            {option.detail}
          </p>
        </div>
        {(current || option.highlight) && (
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
              current
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-emerald-500/15 text-emerald-300'
            }`}
          >
            {current ? 'CURRENT' : option.highlight}
          </span>
        )}
      </div>
      <p className="mt-3 text-base font-bold text-[var(--text-primary)]">{option.price}</p>
    </button>
  )
}

export function BillingManagementCard() {
  const pathname = usePathname()
  const { enabled: billingEnabled } = getBillingConfig()
  const native = isNative()
  const { user } = useAuth()
  const isPremium = usePremiumStore((s) => s.isPremium)
  const setPremiumEntitlement = usePremiumStore((s) => s.setPremiumEntitlement)
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>('yearly')
  const [loading, setLoading] = useState(false)
  const [managing, setManaging] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<BillingStatusPayload | null>(null)
  const [nativePackages, setNativePackages] = useState<PurchasesPackage[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (native) {
      setStatus({
        enabled: true,
        isPremium,
        entitlement: isPremium
          ? { planKey: 'premium', status: 'active', currentPeriodEnd: null, cancelAtPeriodEnd: false }
          : null,
      })
      return
    }

    if (!billingEnabled || !user) {
      setStatus(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setErrorMessage(null)

    const loadStatus = async () => {
      try {
        const response = await fetch('/api/billing/status', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('billing-status-failed')
        }

        const payload = (await response.json()) as BillingStatusPayload
        if (!cancelled) {
          setStatus(payload)
        }
      } catch (error) {
        console.warn('[billing] status fetch failed:', error)
        if (!cancelled) {
          setErrorMessage('멤버십 상태를 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadStatus()

    return () => {
      cancelled = true
    }
  }, [billingEnabled, native, isPremium, user])

  useEffect(() => {
    if (!native) return

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

    return () => {
      cancelled = true
    }
  }, [native])

  useEffect(() => {
    const planKey = status?.entitlement?.planKey
    if (planKey === 'premium_monthly') {
      setSelectedPlan('monthly')
    } else if (planKey === 'premium_yearly') {
      setSelectedPlan('yearly')
    }
  }, [status?.entitlement?.planKey])

  const currentPremium = native ? isPremium : status?.isPremium ?? false
  const planKey = status?.entitlement?.planKey ?? (currentPremium ? 'premium' : 'free')
  const currentPlanLabel = loading ? 'Checking membership' : getPlanLabel(planKey)
  const isReady = native ? currentPremium || nativePackages.length > 0 : billingEnabled
  const currentPlan = planKey === 'premium_monthly' ? 'monthly' : planKey === 'premium_yearly' ? 'yearly' : null

  const planOptions = useMemo(() => {
    if (native && nativePackages.length > 0) {
      const preferred = nativePackages
        .filter((pkg) => pkg.packageType === 'ANNUAL' || pkg.packageType === 'MONTHLY')
        .sort((a, b) => {
          const order = (pkg: PurchasesPackage) => (pkg.packageType === 'ANNUAL' ? 0 : 1)
          return order(a) - order(b)
        })

      const source = preferred.length > 0 ? preferred : nativePackages.slice(0, 2)

      return source.map((pkg) => {
        const yearly = pkg.packageType === 'ANNUAL'
        return {
          id: yearly ? 'yearly' : 'monthly',
          label: yearly ? 'YEARLY' : 'MONTHLY',
          detail:
            pkg.product.description || (yearly ? '스토어 결제로 연간 이용' : '스토어 결제로 월간 이용'),
          price: pkg.product.priceString,
          highlight: yearly ? 'BEST VALUE' : undefined,
        } satisfies PlanOption
      })
    }

    return [WEB_PLAN_OPTIONS.yearly, WEB_PLAN_OPTIONS.monthly]
  }, [native, nativePackages])

  const handlePortal = async () => {
    setManaging(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const payload = (await response.json().catch(() => null)) as { url?: string } | null

      if (!response.ok || !payload?.url) {
        throw new Error('billing-portal-failed')
      }

      window.location.assign(payload.url)
    } catch (error) {
      console.warn('[billing] portal launch failed:', error)
      setErrorMessage('멤버십 관리 페이지를 열지 못했습니다.')
      setManaging(false)
    }
  }

  const handleRestore = async () => {
    setRestoring(true)
    setErrorMessage(null)

    try {
      const { restorePurchases, isPremiumFromCustomerInfo } = await import('@/lib/nativeBilling')
      const customerInfo = await restorePurchases()
      const restored = isPremiumFromCustomerInfo(customerInfo)
      setPremiumEntitlement(restored)

      if (!restored) {
        setErrorMessage('복원할 구매 내역이 없습니다.')
      }
    } catch (error) {
      console.warn('[billing] restore failed:', error)
      setErrorMessage('구매 복원에 실패했습니다.')
    } finally {
      setRestoring(false)
    }
  }

  const handleNativePurchase = async (plan: BillingPlan) => {
    const pkg =
      nativePackages.find((entry) => (plan === 'yearly' ? entry.packageType === 'ANNUAL' : entry.packageType === 'MONTHLY')) ??
      nativePackages[0]

    if (!pkg) {
      setErrorMessage('멤버십 플랜을 아직 불러오는 중입니다.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const { purchasePackage, isPremiumFromCustomerInfo } = await import('@/lib/nativeBilling')
      const customerInfo = await purchasePackage(pkg.identifier)
      const nextPremium = isPremiumFromCustomerInfo(customerInfo)
      setPremiumEntitlement(nextPremium)
    } catch (error: unknown) {
      const purchaseError = error as { code?: string; userCancelled?: boolean }
      if (!purchaseError.userCancelled && purchaseError.code !== 'PURCHASE_CANCELLED') {
        console.warn('[billing] checkout failed:', error)
        setErrorMessage('스토어 결제를 시작하지 못했습니다.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleWebCheckout = async () => {
    if (!billingEnabled) return

    if (!user) {
      window.location.assign(`/login?next=${encodeURIComponent(pathname || '/profile')}`)
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan, returnPath: pathname || '/profile' }),
      })

      const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null

      if (response.status === 401) {
        window.location.assign(`/login?next=${encodeURIComponent(pathname || '/profile')}`)
        return
      }

      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? 'checkout-failed')
      }

      window.location.assign(payload.url)
    } catch (error) {
      console.warn('[billing] checkout start failed:', error)
      setErrorMessage('결제를 시작하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenStore = () => {
    const url = getStoreManagementUrl()
    if (!url) {
      setErrorMessage('이 기기에서는 스토어 관리 페이지를 열 수 없습니다.')
      return
    }

    window.location.assign(url)
  }

  const handlePrimaryAction = () => {
    if (currentPremium) {
      if (native) {
        handleOpenStore()
      } else {
        void handlePortal()
      }
      return
    }

    if (native) {
      void handleNativePurchase(selectedPlan)
      return
    }

    void handleWebCheckout()
  }

  const primaryLabel = (() => {
    if (!isReady) return 'CHECKOUT SOON'
    if (submitting) return 'CONNECTING...'
    if (managing) return 'OPENING...'
    if (currentPremium) return native ? `OPEN ${getStoreLabel().toUpperCase()}` : 'MANAGE MEMBERSHIP'
    if (!native && !user) return 'LOG IN TO SUBSCRIBE'
    return 'START MEMBERSHIP'
  })()

  return (
    <SurfaceCard className="p-6">
      <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
        MEMBERSHIP
      </p>

      <div className="space-y-4">
        <div className="rounded-2xl bg-[var(--bg-primary)] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)]">CURRENT STATUS</p>
              <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                {loading ? '멤버십 확인 중' : currentPremium ? '프리미엄 이용 중' : '무료 플랜'}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{currentPlanLabel}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                currentPremium
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              }`}
            >
              {currentPremium ? 'PRO' : 'FREE'}
            </span>
          </div>

          {!native && status?.entitlement?.currentPeriodEnd && (
            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              {status.entitlement.cancelAtPeriodEnd ? '이용 종료일' : '다음 결제일'}{' '}
              {formatDate(status.entitlement.currentPeriodEnd)}
            </p>
          )}

          {!native && !user && billingEnabled && (
            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              로그인하면 결제 상태와 프리미엄 권한을 계정 기준으로 안정적으로 관리할 수 있습니다.
            </p>
          )}

          {native && currentPremium && (
            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              멤버십 변경이나 해지는 {getStoreLabel()}에서 진행할 수 있습니다.
            </p>
          )}

          {!native && !billingEnabled && (
            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              결제 연동은 아직 준비 중입니다. 코드가 발급되면 멤버십 코드는 바로 사용할 수 있습니다.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              Plans
            </p>
            {currentPlan && (
              <p className="text-xs text-[var(--text-secondary)]">
                Current: {currentPlan === 'yearly' ? 'Yearly' : 'Monthly'}
              </p>
            )}
          </div>

          <div className="grid gap-3">
            {planOptions.map((option) => (
              <PlanTile
                key={option.id}
                option={option}
                selected={selectedPlan === option.id}
                current={currentPlan === option.id}
                onClick={() => setSelectedPlan(option.id)}
              />
            ))}
          </div>

          {currentPremium && (
            <p className="text-xs text-[var(--text-secondary)]">
              {native
                ? '플랜 변경은 기기 스토어 설정에서 진행됩니다.'
                : '멤버십 관리에서 결제 주기 변경, 해지, 결제 수단 수정까지 확인할 수 있습니다.'}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={!isReady || submitting || managing}
          className="w-full rounded-2xl bg-[var(--accent-primary)] py-3.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {primaryLabel}
        </button>

        <div className={`grid gap-2 ${native ? 'sm:grid-cols-2' : ''}`}>
          <Link
            href="/profile/redeem"
            className="rounded-2xl bg-[var(--bg-secondary)] px-4 py-3 text-center text-sm font-semibold text-[var(--text-primary)]"
          >
            ENTER CODE
          </Link>

          {native && (
            <button
              type="button"
              onClick={handleRestore}
              disabled={restoring}
              className="rounded-2xl bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {restoring ? 'RESTORING...' : 'RESTORE PURCHASE'}
            </button>
          )}
        </div>

        {errorMessage && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}
      </div>
    </SurfaceCard>
  )
}
