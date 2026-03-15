'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { PurchasesPackage } from '@revenuecat/purchases-typescript-internal-esm'
import { getBillingConfig, type BillingPlan } from '@/lib/billing'
import {
  formatDiscountText,
  formatWon,
  MONTHLY_BASE_PRICE,
  YEARLY_REFERENCE_PRICE,
  getMonthlyDiscountedPrice,
  getYearlyRenewalPrice,
} from '@/lib/billingPricing'
import { getBenefitStatusLine } from '@/lib/learningDashboard'
import { getPlatform, isNative } from '@/lib/platform'
import { useAuth } from '@/hooks/useAuth'
import { usePremiumStore } from '@/stores/usePremiumStore'
import {
  MONTHLY_ACTIVE_THRESHOLD,
  TIER_NAMES,
  YEARLY_BASE_SAVINGS_PERCENT,
  useTierStore,
} from '@/stores/useTierStore'
import { SurfaceCard } from '@/components/ui/AppPage'
import { RedeemCodeSection } from './RedeemCodeCard'

interface BillingStatusPayload {
  enabled: boolean
  isPremium: boolean
  paymentMethod: {
    brand: string | null
    last4: string | null
    expMonth: number | null
    expYear: number | null
  } | null
  entitlement: {
    planKey: string
    status: string
    source: string
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
  } | null
}

interface PlanOption {
  id: BillingPlan
  label: string
  detail: string
  price: string
  comparePrice?: string
  subdetail?: string
  highlight?: string
}

interface BillingManagementCardProps {
  mode?: 'summary' | 'detail'
  refreshKey?: number
}

const ANDROID_APP_ID = 'com.studyeng.app'

const WEB_PLAN_OPTIONS: Record<BillingPlan, PlanOption> = {
  yearly: {
    id: 'yearly',
    label: '연간',
    detail: '월간 12회 대비 기본 할인에 등급 혜택이 더해집니다.',
    price: '79,900원 / 년',
    comparePrice: '118,800원',
    highlight: '추천',
  },
  monthly: {
    id: 'monthly',
    label: '월간',
    detail: '지금 바로 시작하기 좋은 월간 플랜입니다.',
    price: '9,900원 / 월',
  },
}

function formatDate(value: string | null) {
  if (!value) return '없음'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function getPlanLabel(planKey: string | null | undefined) {
  switch (planKey) {
    case 'premium_yearly':
      return '프리미엄 연간'
    case 'premium_monthly':
      return '프리미엄 월간'
    case 'premium':
      return '프리미엄'
    default:
      return 'FREE'
  }
}

function getStoreLabel() {
  switch (getPlatform()) {
    case 'android':
      return 'Play Store'
    case 'ios':
      return 'App Store'
    default:
      return 'Store'
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

function getPlanBenefitDetail(plan: BillingPlan, tierName: string) {
  if (plan === 'yearly') {
    return `${tierName} 등급 기준 연간 최종가`
  }

  return `${tierName} 등급 기준 월간 최종가`
}

function formatCardBrand(brand: string | null | undefined) {
  if (!brand) return 'CARD'

  switch (brand) {
    case 'amex':
      return 'AMEX'
    case 'mastercard':
      return 'MASTERCARD'
    default:
      return brand.replace(/_/g, ' ').toUpperCase()
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
          : 'border-[var(--border-card)] bg-[var(--bg-secondary)]/30'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">{option.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            {option.detail}
          </p>
          {option.subdetail ? (
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">{option.subdetail}</p>
          ) : null}
        </div>
        {(current || option.highlight) && (
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
              current
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-emerald-500/15 text-emerald-300'
            }`}
          >
            {current ? '현재' : option.highlight}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        {option.comparePrice ? (
          <span className="text-xs text-[var(--text-muted)] line-through">{option.comparePrice}</span>
        ) : null}
        <p className="text-base font-bold text-[var(--text-primary)]">{option.price}</p>
      </div>
    </button>
  )
}

export function BillingManagementCard({
  mode = 'summary',
  refreshKey = 0,
}: BillingManagementCardProps) {
  const pathname = usePathname()
  const { enabled: billingEnabled } = getBillingConfig()
  const native = isNative()
  const isDetail = mode === 'detail'
  const { user } = useAuth()
  const entitlementPremium = usePremiumStore((state) => state.entitlementPremium)
  const setPremiumEntitlement = usePremiumStore((state) => state.setPremiumEntitlement)
  const getBenefitSnapshot = useTierStore((state) => state.getBenefitSnapshot)
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>('yearly')
  const [loading, setLoading] = useState(false)
  const [managing, setManaging] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<BillingStatusPayload | null>(null)
  const [nativePackages, setNativePackages] = useState<PurchasesPackage[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const updateNativeStatus = useCallback(
    (nextPremium: boolean, packageCount = nativePackages.length) => {
      setStatus({
        enabled: nextPremium || packageCount > 0,
        isPremium: nextPremium,
        paymentMethod: null,
        entitlement: nextPremium
          ? {
              planKey: 'premium',
              status: 'active',
              source: 'revenuecat',
              currentPeriodEnd: null,
              cancelAtPeriodEnd: false,
            }
          : null,
      })
    },
    [nativePackages.length]
  )

  useEffect(() => {
    if (!native) return

    let cancelled = false
    setLoading(true)
    setErrorMessage(null)

    const loadNativeStatus = async () => {
      try {
        const { getCustomerInfo, getOfferings, isPremiumFromCustomerInfo } = await import(
          '@/lib/nativeBilling'
        )
        const [customerInfo, offerings] = await Promise.all([getCustomerInfo(), getOfferings()])

        if (cancelled) return

        const nextPremium = isPremiumFromCustomerInfo(customerInfo)
        const packages = offerings?.current?.availablePackages ?? []

        setPremiumEntitlement(nextPremium)
        setNativePackages(packages)
        updateNativeStatus(nextPremium, packages.length)
      } catch (error) {
        console.warn('[billing] failed to load native billing state:', error)
        if (!cancelled) {
          setNativePackages([])
          updateNativeStatus(false, 0)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadNativeStatus()

    return () => {
      cancelled = true
    }
  }, [native, refreshKey, setPremiumEntitlement, updateNativeStatus])

  useEffect(() => {
    if (native) return

    if (!billingEnabled) {
      setLoading(false)
      setErrorMessage(null)
      setStatus({
        enabled: false,
        isPremium: false,
        paymentMethod: null,
        entitlement: null,
      })
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
          setErrorMessage('구독 상태를 불러오지 못했습니다.')
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
  }, [billingEnabled, native, refreshKey, user])

  useEffect(() => {
    const planKey = status?.entitlement?.planKey
    if (planKey === 'premium_monthly') {
      setSelectedPlan('monthly')
    } else if (planKey === 'premium_yearly') {
      setSelectedPlan('yearly')
    }
  }, [status?.entitlement?.planKey])

  const currentPremium = native ? entitlementPremium : status?.isPremium ?? false
  const benefitSnapshot = getBenefitSnapshot()
  const entitlementSource = native ? (currentPremium ? 'revenuecat' : 'free') : status?.entitlement?.source ?? 'free'
  const webBillingReady = status?.enabled ?? false
  const hasManagedSubscription =
    native ? currentPremium : currentPremium && entitlementSource === 'stripe'
  const hasBillingPaymentMethod =
    native ? currentPremium : currentPremium && entitlementSource === 'stripe'
  const hasCodeAccess = currentPremium && entitlementSource === 'code'
  const planKey = status?.entitlement?.planKey ?? (currentPremium ? 'premium' : 'free')
  const currentPlanLabel = loading ? '상태 확인 중...' : getPlanLabel(planKey)
  const currentStatusLabel = loading
    ? '상태 확인 중...'
    : currentPremium
      ? '프리미엄 사용 중'
      : 'FREE'
  const isReady = native ? currentPremium || nativePackages.length > 0 : webBillingReady
  const currentPlan =
    planKey === 'premium_monthly' ? 'monthly' : planKey === 'premium_yearly' ? 'yearly' : null
  const shouldShowPlanLabel = currentPremium && currentPlanLabel !== currentStatusLabel
  const managementLabel =
    !native && !webBillingReady
      ? ''
      : hasManagedSubscription
        ? native
          ? `${getStoreLabel()}에서 관리`
          : '구독 포털에서 관리'
        : hasCodeAccess
          ? '코드로 이용 중'
          : user
            ? '구독 가능'
            : '로그인 후 구독 가능'
  const scheduleLabel =
    native && currentPremium
      ? '갱신'
      : !native && status?.entitlement?.currentPeriodEnd
        ? status.entitlement.cancelAtPeriodEnd
          ? '이용 종료'
          : '다음 결제'
        : '일정'
  const scheduleValue =
    native && currentPremium
      ? `${getStoreLabel()}에서 확인`
      : !native && status?.entitlement?.currentPeriodEnd
        ? formatDate(status.entitlement.currentPeriodEnd)
        : ''
  const paymentMethodLabel = hasBillingPaymentMethod
    ? native
      ? `${getStoreLabel()} 결제`
      : status?.paymentMethod?.last4
        ? `${formatCardBrand(status.paymentMethod.brand)} •••• ${status.paymentMethod.last4}`
        : '결제 수단 없음'
    : ''
  const paymentMethodDetail =
    !native &&
    hasBillingPaymentMethod &&
    status?.paymentMethod?.expMonth &&
    status?.paymentMethod?.expYear
      ? `만료 ${String(status.paymentMethod.expMonth).padStart(2, '0')}/${String(status.paymentMethod.expYear).slice(-2)}`
      : null
  const benefitItems = [
    {
      label: '이번 달 활동',
      value: `${benefitSnapshot.currentMonthXp.toLocaleString()} / ${MONTHLY_ACTIVE_THRESHOLD} XP`,
      detail: '300 XP를 채우면 현재 잠금 등급 혜택을 유지하거나 복구할 수 있습니다.',
    },
  ]
  const membershipSummaryItems = [
    ...(currentPremium
      ? [{ label: '플랜', value: currentPlanLabel, detail: null as string | null }]
      : []),
    ...(hasBillingPaymentMethod
      ? [{ label: '결제 수단', value: paymentMethodLabel, detail: paymentMethodDetail }]
      : []),
    ...(hasCodeAccess
      ? [
          {
            label: '이용 방식',
            value: '코드 이용 중',
            detail: '자동 결제는 구독을 시작한 뒤에만 이어집니다.',
          },
        ]
      : []),
    { label: '관리', value: managementLabel || '없음', detail: null as string | null },
    { label: scheduleLabel, value: scheduleValue || '없음', detail: null as string | null },
  ]

  const planOptions = useMemo(() => {
    if (native && nativePackages.length > 0) {
      const preferred = nativePackages
        .filter((pkg) => pkg.packageType === 'ANNUAL' || pkg.packageType === 'MONTHLY')
        .sort((left, right) => {
          const order = (pkg: PurchasesPackage) => (pkg.packageType === 'ANNUAL' ? 0 : 1)
          return order(left) - order(right)
        })

      const source = preferred.length > 0 ? preferred : nativePackages.slice(0, 2)

      return source.map((pkg) => {
        const yearly = pkg.packageType === 'ANNUAL'
        return {
          id: yearly ? 'yearly' : 'monthly',
          label: yearly ? '연간' : '월간',
          detail: getPlanBenefitDetail(
            yearly ? 'yearly' : 'monthly',
            TIER_NAMES[benefitSnapshot.benefitTier],
          ),
          price: yearly
            ? `${formatWon(getYearlyRenewalPrice(benefitSnapshot.yearlyRenewalDiscount))} / 년`
            : `${formatWon(getMonthlyDiscountedPrice(benefitSnapshot.monthlyDiscount))} / 월`,
          comparePrice: yearly ? formatWon(YEARLY_REFERENCE_PRICE) : formatWon(MONTHLY_BASE_PRICE),
          subdetail: yearly
            ? `기본 ${YEARLY_BASE_SAVINGS_PERCENT}% + ${formatDiscountText(`${TIER_NAMES[benefitSnapshot.benefitTier]} 추가 할인`, benefitSnapshot.yearlyRenewalDiscount)}`
            : formatDiscountText(`${TIER_NAMES[benefitSnapshot.benefitTier]} 추가 할인`, benefitSnapshot.monthlyDiscount),
          highlight: yearly ? '추천' : undefined,
        } satisfies PlanOption
      })
    }

    return [
      {
        ...WEB_PLAN_OPTIONS.yearly,
        detail: getPlanBenefitDetail(
          'yearly',
          TIER_NAMES[benefitSnapshot.benefitTier],
        ),
        price: `${formatWon(getYearlyRenewalPrice(benefitSnapshot.yearlyRenewalDiscount))} / 년`,
        comparePrice: formatWon(YEARLY_REFERENCE_PRICE),
        subdetail: `기본 ${YEARLY_BASE_SAVINGS_PERCENT}% + ${formatDiscountText(`${TIER_NAMES[benefitSnapshot.benefitTier]} 추가 할인`, benefitSnapshot.yearlyRenewalDiscount)}`,
      },
      {
        ...WEB_PLAN_OPTIONS.monthly,
        detail: getPlanBenefitDetail(
          'monthly',
          TIER_NAMES[benefitSnapshot.benefitTier],
        ),
        price: `${formatWon(getMonthlyDiscountedPrice(benefitSnapshot.monthlyDiscount))} / 월`,
        comparePrice: formatWon(MONTHLY_BASE_PRICE),
        subdetail: formatDiscountText(`${TIER_NAMES[benefitSnapshot.benefitTier]} 추가 할인`, benefitSnapshot.monthlyDiscount),
      },
    ]
  }, [
    benefitSnapshot.benefitTier,
    benefitSnapshot.monthlyDiscount,
    benefitSnapshot.yearlyRenewalDiscount,
    native,
    nativePackages,
  ])

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
      setErrorMessage('구독 포털을 열지 못했습니다.')
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
      updateNativeStatus(restored)

      if (!restored) {
        setErrorMessage('복원할 구매 내역을 찾지 못했습니다.')
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
      nativePackages.find((entry) =>
        plan === 'yearly' ? entry.packageType === 'ANNUAL' : entry.packageType === 'MONTHLY',
      ) ?? nativePackages[0]

    if (!pkg) {
      setErrorMessage('구독 플랜을 불러오는 중입니다.')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const { purchasePackage, isPremiumFromCustomerInfo } = await import('@/lib/nativeBilling')
      const customerInfo = await purchasePackage(pkg.identifier)
      const nextPremium = isPremiumFromCustomerInfo(customerInfo)
      setPremiumEntitlement(nextPremium)
      updateNativeStatus(nextPremium)
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
    if (!webBillingReady) return

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

      const payload = (await response.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null

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
      setErrorMessage('결제 세션을 시작하지 못했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenStore = () => {
    const url = getStoreManagementUrl()
    if (!url) {
      setErrorMessage('이 기기에서는 스토어 구독 관리 페이지를 열 수 없습니다.')
      return
    }

    window.location.assign(url)
  }

  const handlePrimaryAction = () => {
    if (hasManagedSubscription) {
      if (native) {
        handleOpenStore()
      } else {
        void handlePortal()
      }
      return
    }

    if (!user) {
      window.location.assign(`/login?next=${encodeURIComponent(pathname || '/profile')}`)
      return
    }

    if (native) {
      void handleNativePurchase(selectedPlan)
      return
    }

    void handleWebCheckout()
  }

  const primaryLabel = (() => {
    if (!isReady) return '결제 준비 중'
    if (submitting) return '처리 중...'
    if (managing) return '열어보는 중...'
    if (hasManagedSubscription) {
      return native ? `${getStoreLabel()}에서 관리` : '구독 관리'
    }
    if (!user) return '로그인 후 구독'
    return '구독 시작'
  })()

  return (
    <SurfaceCard className="p-6">
      {!isDetail && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            구독
          </p>
          <Link
            href="/profile/membership"
            className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
          >
            상세보기
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {!isDetail && (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                {currentStatusLabel}
              </p>
              {shouldShowPlanLabel && (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{currentPlanLabel}</p>
              )}

              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                {getBenefitStatusLine(benefitSnapshot)}
              </p>

              {!native && status?.entitlement?.currentPeriodEnd && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  {status.entitlement.cancelAtPeriodEnd ? '이용 종료' : '다음 결제'}{' '}
                  {formatDate(status.entitlement.currentPeriodEnd)}
                </p>
              )}

              {hasBillingPaymentMethod && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  결제 수단 {paymentMethodLabel}
                  {paymentMethodDetail ? ` · ${paymentMethodDetail}` : ''}
                </p>
              )}

              {!native && hasCodeAccess && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  코드로 프리미엄을 사용 중입니다. 자동 결제는 구독을 시작한 뒤에만 이어집니다.
                </p>
              )}

              {!native && !user && webBillingReady && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  로그인하면 구독 상태와 프리미엄 이용 권한을 계정에 연결할 수 있습니다.
                </p>
              )}

              {!native && billingEnabled && !webBillingReady && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  서버 쪽 결제 설정이 아직 마무리 중입니다.
                </p>
              )}

              {native && currentPremium && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  플랜 변경과 결제 관리는 {getStoreLabel()}에서 진행됩니다.
                </p>
              )}
            </div>
            {currentPremium && (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                PRO
              </span>
            )}
          </div>
        )}

        {isDetail && (
          <>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                상태
              </p>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">
                    {currentStatusLabel}
                  </p>
                  {shouldShowPlanLabel && (
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{currentPlanLabel}</p>
                  )}
                </div>
                {currentPremium && (
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    PRO
                  </span>
                )}
              </div>
            </div>

            <div className="divide-y divide-[var(--border-card)]/40">
              {membershipSummaryItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
                  <div className="text-right">
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {item.value}
                    </span>
                    {item.detail && (
                      <p className="text-[10px] text-[var(--text-secondary)]">{item.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                혜택
              </p>
              <div className="rounded-2xl border border-[var(--accent-primary)] bg-[var(--accent-glow)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
                      현재 혜택
                    </p>
                    <p className="mt-1 text-base font-semibold text-[var(--accent-primary)]">
                      {TIER_NAMES[benefitSnapshot.benefitTier]}
                    </p>
                  </div>
                  {benefitSnapshot.benefitTier < benefitSnapshot.unlockedTier ? (
                    <span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text-secondary)]">
                      잠금 등급 {TIER_NAMES[benefitSnapshot.unlockedTier]}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  {getBenefitStatusLine(benefitSnapshot)}
                </p>
              </div>
              <div className="divide-y divide-[var(--border-card)]/40">
                {benefitItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {item.value}
                      </span>
                      {item.detail ? (
                        <p className="text-[10px] text-[var(--text-secondary)]">{item.detail}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-[var(--text-secondary)]">
                완료된 월 기준으로 {MONTHLY_ACTIVE_THRESHOLD} XP 미만이 2개월 연속 이어지면 적용 혜택이 1단계 낮아집니다.
                이번 달 {MONTHLY_ACTIVE_THRESHOLD} XP를 채우면 잠금 등급 혜택으로 바로 복구할 수 있습니다.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  옵션
                </p>
                {currentPlan && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    현재 {currentPlan === 'yearly' ? '연간' : '월간'}
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

              {(hasManagedSubscription || hasCodeAccess) && (
                <p className="text-xs text-[var(--text-secondary)]">
                  {hasCodeAccess
                    ? '지금은 코드로 이용 중입니다. 자동 결제로 이어가고 싶을 때만 구독을 시작하면 됩니다.'
                    : native
                    ? `${getStoreLabel()}에서 플랜을 변경할 수 있습니다.`
                    : '결제 주기 변경과 결제 수단 수정은 구독 포털에서 진행됩니다.'}
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

            {native && (
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring}
                className="w-full rounded-2xl bg-[var(--bg-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {restoring ? '복원 중...' : '구매 복원'}
              </button>
            )}

            <RedeemCodeSection />
          </>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </div>
        )}
      </div>
    </SurfaceCard>
  )
}
