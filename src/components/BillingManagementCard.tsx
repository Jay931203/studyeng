'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { PurchasesPackage } from '@revenuecat/purchases-typescript-internal-esm'
import { getBillingConfig, type BillingPlan } from '@/lib/billing'
import {
  formatPrice,
  MONTHLY_BASE_PRICE,
  YEARLY_BASE_PRICE,
} from '@/lib/billingPricing'
import { getBenefitStatusLine } from '@/lib/learningDashboard'
import { getPlatform, isNative } from '@/lib/platform'
import { useAuth } from '@/hooks/useAuth'
import { useLocaleStore, type SupportedLocale } from '@/stores/useLocaleStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { MONTHLY_ACTIVE_THRESHOLD, TIER_NAMES, useTierStore } from '@/stores/useTierStore'
import { syncBillingOnLogin } from '@/lib/supabase/billingSync'
import { SurfaceCard } from '@/components/ui/AppPage'
import { RedeemCodeSection } from './RedeemCodeCard'

type BillingLocale = 'ko' | 'ja' | 'zh-TW' | 'vi'

function toBillingLocale(locale: SupportedLocale): BillingLocale {
  const supported: BillingLocale[] = ['ko', 'ja', 'zh-TW', 'vi']
  return supported.includes(locale as BillingLocale) ? (locale as BillingLocale) : 'ko'
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
  'zh-TW': {
    yearly: '年繳',
    monthly: '月繳',
    free: 'FREE',
    recommend: '推薦',
    current: '目前',
    subscription: '訂閱',
    details: '查看詳情',
    statusLoading: '狀態確認中...',
    statusSection: '狀態',
    plan: '方案',
    paymentMethod: '付款方式',
    noPaymentMethod: '無付款方式',
    storeBilling: '付款',
    expiry: '到期',
    benefitsSection: '優惠',
    currentBenefits: '目前適用優惠',
    thisMonth: '本月',
    optionsSection: '選項',
    currentPlan: '目前',
    benefitApplied: '優惠已套用',
    perYear: '/ 年',
    perMonth: '/ 月',
    totalDiscount: '共',
    discountSuffix: '% 折扣',
    yearlyNote: '年繳最終價格一定低於月繳最終價格的 12 倍。',
    errorStatusFetch: '無法載入訂閱狀態。',
    errorPortal: '無法開啟訂閱管理頁面。',
    errorRestoreNotFound: '找不到可恢復的購買紀錄。',
    errorRestoreFailed: '購買恢復失敗。',
    errorPlanLoading: '訂閱方案載入中。',
    errorStorePurchase: '無法開始商店付款。',
    errorStoreManagement: '此裝置無法開啟商店訂閱管理頁面。',
    errorCheckout: '無法開始付款程序。',
    paymentReady: '付款準備中',
    processing: '處理中...',
    navigating: '前往中...',
    manageInStore: '管理',
    manageSubscription: '管理訂閱',
    loginAndSubscribe: '登入並訂閱',
    startSubscription: '開始訂閱',
    restoring: '恢復中...',
    restorePurchase: '恢復購買',
  },
  vi: {
    yearly: 'H\u00E0ng n\u0103m',
    monthly: 'H\u00E0ng th\u00E1ng',
    free: 'FREE',
    recommend: 'Khuy\u1EBFn d\u00F9ng',
    current: 'Hi\u1EC7n t\u1EA1i',
    subscription: 'G\u00F3i \u0111\u0103ng k\u00FD',
    details: 'Xem chi ti\u1EBFt',
    statusLoading: '\u0110ang ki\u1EC3m tra...',
    statusSection: 'Tr\u1EA1ng th\u00E1i',
    plan: 'G\u00F3i',
    paymentMethod: 'Ph\u01B0\u01A1ng th\u1EE9c thanh to\u00E1n',
    noPaymentMethod: 'Ch\u01B0a c\u00F3 ph\u01B0\u01A1ng th\u1EE9c thanh to\u00E1n',
    storeBilling: 'Thanh to\u00E1n',
    expiry: 'H\u1EBFt h\u1EA1n',
    benefitsSection: '\u01AFu \u0111\u00E3i',
    currentBenefits: '\u01AFu \u0111\u00E3i \u0111ang \u00E1p d\u1EE5ng',
    thisMonth: 'Th\u00E1ng n\u00E0y',
    optionsSection: 'T\u00F9y ch\u1ECDn',
    currentPlan: 'Hi\u1EC7n t\u1EA1i',
    benefitApplied: '\u0110\u00E3 \u00E1p d\u1EE5ng \u01B0u \u0111\u00E3i',
    perYear: '/ n\u0103m',
    perMonth: '/ th\u00E1ng',
    totalDiscount: 'T\u1ED5ng',
    discountSuffix: '% gi\u1EA3m gi\u00E1',
    yearlyNote: 'Gi\u00E1 cu\u1ED1i c\u00F9ng c\u1EE7a g\u00F3i h\u00E0ng n\u0103m lu\u00F4n th\u1EA5p h\u01A1n 12 l\u1EA7n gi\u00E1 cu\u1ED1i c\u00F9ng c\u1EE7a g\u00F3i h\u00E0ng th\u00E1ng.',
    errorStatusFetch: 'Kh\u00F4ng th\u1EC3 t\u1EA3i tr\u1EA1ng th\u00E1i \u0111\u0103ng k\u00FD.',
    errorPortal: 'Kh\u00F4ng th\u1EC3 m\u1EDF trang qu\u1EA3n l\u00FD \u0111\u0103ng k\u00FD.',
    errorRestoreNotFound: 'Kh\u00F4ng t\u00ECm th\u1EA5y l\u1ECBch s\u1EED mua h\u00E0ng \u0111\u1EC3 kh\u00F4i ph\u1EE5c.',
    errorRestoreFailed: 'Kh\u00F4i ph\u1EE5c mua h\u00E0ng th\u1EA5t b\u1EA1i.',
    errorPlanLoading: '\u0110ang t\u1EA3i g\u00F3i \u0111\u0103ng k\u00FD.',
    errorStorePurchase: 'Kh\u00F4ng th\u1EC3 b\u1EAFt \u0111\u1EA7u thanh to\u00E1n qua c\u1EEDa h\u00E0ng.',
    errorStoreManagement: 'Kh\u00F4ng th\u1EC3 m\u1EDF trang qu\u1EA3n l\u00FD \u0111\u0103ng k\u00FD c\u1EEDa h\u00E0ng tr\u00EAn thi\u1EBFt b\u1ECB n\u00E0y.',
    errorCheckout: 'Kh\u00F4ng th\u1EC3 b\u1EAFt \u0111\u1EA7u phi\u00EAn thanh to\u00E1n.',
    paymentReady: '\u0110ang chu\u1EA9n b\u1ECB thanh to\u00E1n',
    processing: '\u0110ang x\u1EED l\u00FD...',
    navigating: '\u0110ang chuy\u1EC3n...',
    manageInStore: 'Qu\u1EA3n l\u00FD',
    manageSubscription: 'Qu\u1EA3n l\u00FD \u0111\u0103ng k\u00FD',
    loginAndSubscribe: '\u0110\u0103ng nh\u1EADp v\u00E0 \u0111\u0103ng k\u00FD',
    startSubscription: 'B\u1EAFt \u0111\u1EA7u \u0111\u0103ng k\u00FD',
    restoring: '\u0110ang kh\u00F4i ph\u1EE5c...',
    restorePurchase: 'Kh\u00F4i ph\u1EE5c mua h\u00E0ng',
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
  price: string
  comparePrice?: string | null
  savingsText?: string | null
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
          {option.savingsText ? (
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">{option.savingsText}</p>
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
            {current ? currentLabel : option.highlight}
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
  const rawLocale = useLocaleStore((s) => s.locale)
  const locale = toBillingLocale(rawLocale)
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
        const { getOfferings } = await import('@/lib/nativeBilling')
        const offeringsPromise = getOfferings()
        if (user?.id) {
          await syncBillingOnLogin(user.id)
        }
        const offerings = await offeringsPromise

        if (cancelled) return

        const packages = offerings?.current?.availablePackages ?? []
        const nextPremium = usePremiumStore.getState().entitlementPremium

        setNativePackages(packages)
        updateNativeStatus(nextPremium, packages.length)
      } catch (error) {
        console.warn('[billing] failed to load native billing state:', error)
        if (!cancelled) {
          setNativePackages([])
          updateNativeStatus(usePremiumStore.getState().entitlementPremium, 0)
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
  }, [native, refreshKey, user?.id, updateNativeStatus])

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
  }, [billingEnabled, native, refreshKey, user, t.errorStatusFetch])

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

  const planOptions = useMemo<PlanOption[]>(() => {
    const tierName = TIER_NAMES[benefitSnapshot.benefitTier]
    const webPlanOptions = getWebPlanOptions(t)

    return [
      {
        ...webPlanOptions.yearly,
        detail: `${tierName} ${t.benefitApplied}`,
        comparePrice: null,
        price: `${formatPrice(YEARLY_BASE_PRICE, locale)} ${t.perYear}`,
        savingsText: null,
      },
      {
        ...webPlanOptions.monthly,
        detail: `${tierName} ${t.benefitApplied}`,
        comparePrice: null,
        price: `${formatPrice(MONTHLY_BASE_PRICE, locale)} ${t.perMonth}`,
        savingsText: null,
      },
    ]
  }, [benefitSnapshot.benefitTier, t, locale])

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
      if (user?.id) {
        await syncBillingOnLogin(user.id)
      }
      const mergedPremium = usePremiumStore.getState().entitlementPremium
      updateNativeStatus(mergedPremium)

      if (!mergedPremium) {
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
      if (user?.id) {
        await syncBillingOnLogin(user.id)
      }
      const mergedPremium = usePremiumStore.getState().entitlementPremium
      updateNativeStatus(mergedPremium)
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
                {getBenefitStatusLine(benefitSnapshot, rawLocale)}
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
                    {option.comparePrice ? (
                      <span className="text-[11px] text-[var(--text-muted)] line-through">
                        {option.comparePrice}
                      </span>
                    ) : null}
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      {option.price}
                    </span>
                  </div>
                  {option.savingsText ? (
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">{option.savingsText}</p>
                  ) : null}
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
                {getBenefitStatusLine(benefitSnapshot, rawLocale)}
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
