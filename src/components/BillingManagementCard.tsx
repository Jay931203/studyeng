'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { PurchasesPackage } from '@revenuecat/purchases-typescript-internal-esm'
import { getBillingConfig, type BillingPlan } from '@/lib/billing'
import {
  formatPrice,
  getMonthlyDiscountedPrice,
  getSavingsPercent,
  getYearlyRenewalPrice,
  MONTHLY_REFERENCE_PRICE,
  YEARLY_REFERENCE_PRICE,
} from '@/lib/billingPricing'
import { getBenefitStatusLine } from '@/lib/learningDashboard'
import { getPlatform, isNative } from '@/lib/platform'
import { useAuth } from '@/hooks/useAuth'
import { useLocaleStore, type SupportedLocale } from '@/stores/useLocaleStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { MONTHLY_ACTIVE_THRESHOLD, TIER_NAMES, useTierStore } from '@/stores/useTierStore'
import { SurfaceCard } from '@/components/ui/AppPage'
import { RedeemCodeSection } from './RedeemCodeCard'

type BillingLocale = 'ko' | 'ja'

function toBillingLocale(locale: SupportedLocale): BillingLocale {
  return locale === 'ja' ? 'ja' : 'ko'
}

const TRANSLATIONS = {
  ko: {
    yearly: '연간',
    monthly: '월간',
    free: 'FREE',
    recommend: '추천',
    current: '현재',
    subscription: '구독',
    details: '상세보기',
    statusLoading: '상태 확인 중...',
    statusSection: '상태',
    plan: '플랜',
    paymentMethod: '결제 수단',
    noPaymentMethod: '결제 수단 없음',
    storeBilling: '결제',
    expiry: '만료',
    benefitsSection: '혜택',
    currentBenefits: '현재 적용 혜택',
    thisMonth: '이번 달',
    optionsSection: '옵션',
    currentPlan: '현재',
    benefitApplied: '혜택 적용',
    perYear: '/ 년',
    perMonth: '/ 월',
    totalDiscount: '총',
    discountSuffix: '% 할인',
    yearlyNote: '연간 최종가는 항상 월간 최종가 12회보다 낮게 맞춰집니다.',
    errorStatusFetch: '구독 상태를 불러오지 못했습니다.',
    errorPortal: '구독 관리 페이지를 열지 못했습니다.',
    errorRestoreNotFound: '복원할 구매 내역을 찾지 못했습니다.',
    errorRestoreFailed: '구매 복원에 실패했습니다.',
    errorPlanLoading: '구독 플랜을 불러오는 중입니다.',
    errorStorePurchase: '스토어 결제를 시작하지 못했습니다.',
    errorStoreManagement: '이 기기에서는 스토어 구독 관리 페이지를 열 수 없습니다.',
    errorCheckout: '결제 세션을 시작하지 못했습니다.',
    paymentReady: '결제 준비 중',
    processing: '처리 중...',
    navigating: '이동 중...',
    manageInStore: '에서 관리',
    manageSubscription: '구독 관리',
    loginAndSubscribe: '로그인하고 구독',
    startSubscription: '구독 시작',
    restoring: '복원 중...',
    restorePurchase: '구매 복원',
  },
  ja: {
    yearly: '年間',
    monthly: '月間',
    free: 'FREE',
    recommend: 'おすすめ',
    current: '現在',
    subscription: 'サブスクリプション',
    details: '詳細を見る',
    statusLoading: '状態確認中...',
    statusSection: 'ステータス',
    plan: 'プラン',
    paymentMethod: '支払い方法',
    noPaymentMethod: '支払い方法なし',
    storeBilling: '決済',
    expiry: '有効期限',
    benefitsSection: '特典',
    currentBenefits: '現在適用中の特典',
    thisMonth: '今月',
    optionsSection: 'オプション',
    currentPlan: '現在',
    benefitApplied: '特典適用',
    perYear: '/ 年',
    perMonth: '/ 月',
    totalDiscount: '合計',
    discountSuffix: '% 割引',
    yearlyNote: '年間の最終価格は、月間の最終価格12回分より必ず低く設定されます。',
    errorStatusFetch: 'サブスクリプション状態を読み込めませんでした。',
    errorPortal: 'サブスクリプション管理ページを開けませんでした。',
    errorRestoreNotFound: '復元可能な購入履歴が見つかりませんでした。',
    errorRestoreFailed: '購入の復元に失敗しました。',
    errorPlanLoading: 'サブスクリプションプランを読み込み中です。',
    errorStorePurchase: 'ストア決済を開始できませんでした。',
    errorStoreManagement: 'このデバイスではストアのサブスクリプション管理ページを開けません。',
    errorCheckout: '決済セッションを開始できませんでした。',
    paymentReady: '決済準備中',
    processing: '処理中...',
    navigating: '移動中...',
    manageInStore: 'で管理',
    manageSubscription: 'サブスクリプション管理',
    loginAndSubscribe: 'ログインして購読',
    startSubscription: '購読開始',
    restoring: '復元中...',
    restorePurchase: '購入を復元',
  },
} as const

type BillingTranslations = typeof TRANSLATIONS[BillingLocale]

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
  comparePrice: string
  price: string
  savingsText: string
  highlight?: string
}

interface BillingManagementCardProps {
  mode?: 'summary' | 'detail'
  refreshKey?: number
}

const ANDROID_APP_ID = 'com.studyeng.app'

function getWebPlanOptions(t: BillingTranslations): Record<BillingPlan, Omit<PlanOption, 'detail' | 'comparePrice' | 'price' | 'savingsText'>> {
  return {
    yearly: {
      id: 'yearly',
      label: t.yearly,
      highlight: t.recommend,
    },
    monthly: {
      id: 'monthly',
      label: t.monthly,
    },
  }
}

function getPlanLabel(planKey: string | null | undefined, t: BillingTranslations) {
  switch (planKey) {
    case 'premium_yearly':
      return t.yearly
    case 'premium_monthly':
      return t.monthly
    default:
      return t.free
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
  currentLabel,
  onClick,
}: {
  option: PlanOption
  selected: boolean
  current: boolean
  currentLabel: string
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
          <p className="mt-1 text-[11px] text-[var(--text-muted)]">{option.savingsText}</p>
        </div>
        {(current || option.highlight) && (
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
              current
                ? 'bg-[var(--accent-primary)] text-white'
                : 'bg-emerald-500/15 text-emerald-300'
            }`}
          >
            {current ? currentLabel : option.highlight}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-xs text-[var(--text-muted)] line-through">{option.comparePrice}</span>
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
  const locale = toBillingLocale(useLocaleStore((s) => s.locale))
  const t = TRANSLATIONS[locale]
  const entitlementPremium = usePremiumStore((state) => state.entitlementPremium)
  const setPremiumEntitlement = usePremiumStore((state) => state.setPremiumEntitlement)
  const getBenefitSnapshot = useTierStore((state) => state.getBenefitSnapshot)
  const benefitSnapshot = getBenefitSnapshot()
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
    [nativePackages.length],
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
          setErrorMessage(t.errorStatusFetch)
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
  const entitlementSource = native ? (currentPremium ? 'revenuecat' : 'free') : status?.entitlement?.source ?? 'free'
  const webBillingReady = status?.enabled ?? false
  const hasManagedSubscription =
    native ? currentPremium : currentPremium && entitlementSource === 'stripe'
  const hasBillingPaymentMethod =
    native ? currentPremium : currentPremium && entitlementSource === 'stripe'
  const planKey = status?.entitlement?.planKey ?? (currentPremium ? 'premium' : 'free')
  const currentPlanLabel = loading ? t.statusLoading : getPlanLabel(planKey, t)
  const currentStatusLabel = loading ? t.statusLoading : currentPremium ? 'Premium active' : t.free
  const isReady = native ? currentPremium || nativePackages.length > 0 : webBillingReady
  const currentPlan =
    planKey === 'premium_monthly' ? 'monthly' : planKey === 'premium_yearly' ? 'yearly' : null
  const shouldShowPlanLabel = currentPremium && currentPlanLabel !== currentStatusLabel

  const paymentMethodLabel = hasBillingPaymentMethod
    ? native
      ? `${getStoreLabel()} ${t.storeBilling}`
      : status?.paymentMethod?.last4
        ? `${formatCardBrand(status.paymentMethod.brand)} •••• ${status.paymentMethod.last4}`
        : t.noPaymentMethod
    : ''

  const paymentMethodDetail =
    !native &&
    hasBillingPaymentMethod &&
    status?.paymentMethod?.expMonth &&
    status?.paymentMethod?.expYear
      ? `${t.expiry} ${String(status.paymentMethod.expMonth).padStart(2, '0')}/${String(status.paymentMethod.expYear).slice(-2)}`
      : null

  const monthlyPrice = getMonthlyDiscountedPrice(benefitSnapshot.monthlyDiscount)
  const yearlyPrice = getYearlyRenewalPrice(
    benefitSnapshot.yearlyRenewalDiscount,
    benefitSnapshot.monthlyDiscount,
  )
  const planOptions = useMemo<PlanOption[]>(() => {
    const tierName = TIER_NAMES[benefitSnapshot.benefitTier]
    const monthlySavings = getSavingsPercent(MONTHLY_REFERENCE_PRICE, monthlyPrice)
    const yearlySavings = getSavingsPercent(YEARLY_REFERENCE_PRICE, yearlyPrice)
    const webPlanOptions = getWebPlanOptions(t)

    return [
      {
        ...webPlanOptions.yearly,
        detail: `${tierName} ${t.benefitApplied}`,
        comparePrice: formatPrice(YEARLY_REFERENCE_PRICE, locale),
        price: `${formatPrice(yearlyPrice, locale)} ${t.perYear}`,
        savingsText: `${t.totalDiscount} ${yearlySavings}${t.discountSuffix}`,
      },
      {
        ...webPlanOptions.monthly,
        detail: `${tierName} ${t.benefitApplied}`,
        comparePrice: formatPrice(MONTHLY_REFERENCE_PRICE, locale),
        price: `${formatPrice(monthlyPrice, locale)} ${t.perMonth}`,
        savingsText: `${t.totalDiscount} ${monthlySavings}${t.discountSuffix}`,
      },
    ]
  }, [benefitSnapshot.benefitTier, monthlyPrice, yearlyPrice, t, locale])

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
      setErrorMessage(t.errorPortal)
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
        setErrorMessage(t.errorRestoreNotFound)
      }
    } catch (error) {
      console.warn('[billing] restore failed:', error)
      setErrorMessage(t.errorRestoreFailed)
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
      setErrorMessage(t.errorPlanLoading)
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
        setErrorMessage(t.errorStorePurchase)
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
      setErrorMessage(t.errorCheckout)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenStore = () => {
    const url = getStoreManagementUrl()
    if (!url) {
      setErrorMessage(t.errorStoreManagement)
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
    if (!isReady) return t.paymentReady
    if (submitting) return t.processing
    if (managing) return t.navigating
    if (hasManagedSubscription) {
      return native ? `${getStoreLabel()}${t.manageInStore}` : t.manageSubscription
    }
    if (!user) return t.loginAndSubscribe
    return t.startSubscription
  })()

  return (
    <SurfaceCard className="p-6">
      {!isDetail && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            {t.subscription}
          </p>
          <Link
            href="/profile/membership"
            className="shrink-0 text-[11px] font-medium text-[var(--text-muted)]"
          >
            {t.details}
          </Link>
        </div>
      )}

      {!isDetail && (
        <div className="space-y-3">
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
            </div>
            {currentPremium && (
              <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                PRO
              </span>
            )}
          </div>

          {!currentPremium && (
            <div className="grid gap-3 sm:grid-cols-2">
              {planOptions.map((option) => (
                <div
                  key={option.id}
                  className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-3"
                >
                  <p className="text-[11px] text-[var(--text-secondary)]">{option.label}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[11px] text-[var(--text-muted)] line-through">{option.comparePrice}</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{option.price}</span>
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">{option.savingsText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isDetail && (
        <div className="space-y-5">
          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              {t.statusSection}
            </p>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{currentStatusLabel}</p>
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

            <div className="divide-y divide-[var(--border-card)]/40">
              {currentPremium && (
                <SummaryRow label={t.plan} value={currentPlanLabel} />
              )}
              {hasBillingPaymentMethod && (
                <SummaryRow
                  label={t.paymentMethod}
                  value={paymentMethodLabel}
                  detail={paymentMethodDetail}
                />
              )}
            </div>
          </section>

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              {t.benefitsSection}
            </p>
            <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]/30 px-4 py-3">
              <p className="text-[11px] text-[var(--text-secondary)]">{t.currentBenefits}</p>
              <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                {TIER_NAMES[benefitSnapshot.benefitTier]}
              </p>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                {getBenefitStatusLine(benefitSnapshot)}
              </p>
              <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                {t.thisMonth} {benefitSnapshot.currentMonthXp.toLocaleString()} / {MONTHLY_ACTIVE_THRESHOLD} XP
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                {t.optionsSection}
              </p>
              {currentPlan && (
                <p className="text-xs text-[var(--text-secondary)]">{t.currentPlan} {currentPlanLabel}</p>
              )}
            </div>

            <div className="grid gap-3">
              {planOptions.map((option) => (
                <PlanTile
                  key={option.id}
                  option={option}
                  selected={selectedPlan === option.id}
                  current={currentPlan === option.id}
                  currentLabel={t.current}
                  onClick={() => setSelectedPlan(option.id)}
                />
              ))}
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              {t.yearlyNote}
            </p>
          </section>

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
              {restoring ? t.restoring : t.restorePurchase}
            </button>
          )}

          <RedeemCodeSection />
        </div>
      )}

      {errorMessage && (
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}
    </SurfaceCard>
  )
}

function SummaryRow({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string | null
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <div className="text-right">
        <span className="text-sm font-medium text-[var(--text-primary)]">{value}</span>
        {detail ? <p className="text-[10px] text-[var(--text-secondary)]">{detail}</p> : null}
      </div>
    </div>
  )
}
