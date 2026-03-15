'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { type BillingPlan } from '@/lib/billing'
import {
  formatDiscountText,
  formatPrice,
  getMonthlyDiscountedPrice,
  getYearlyRenewalPrice,
  MONTHLY_BASE_PRICE,
  MONTHLY_REFERENCE_PRICE,
  YEARLY_BASE_PRICE,
  YEARLY_BASE_SAVINGS_PERCENT,
  YEARLY_REFERENCE_PRICE,
} from '@/lib/billingPricing'
import { isNative } from '@/lib/platform'
import { useAuth } from '@/hooks/useAuth'
import { useLocaleStore, type SupportedLocale } from '@/stores/useLocaleStore'
import { usePremiumStore, FREE_DAILY_VIEW_LIMIT } from '@/stores/usePremiumStore'
import { TIER_NAMES, useTierStore } from '@/stores/useTierStore'
import { ModalFeatureList, ModalHeader, ModalShell } from '@/components/ui/ModalShell'
import type { PurchasesPackage } from '@revenuecat/purchases-typescript-internal-esm'

type BillingLocale = 'ko' | 'ja'
type TranslationLocale = SupportedLocale

function toBillingLocale(locale: SupportedLocale): BillingLocale {
  return locale === 'ja' ? 'ja' : 'ko'
}

function toTranslationLocale(locale: SupportedLocale): TranslationLocale {
  return locale
}

const TRANSLATIONS = {
  ko: {
    yearlyPlan: '연간 플랜',
    monthlyPlan: '월간 플랜',
    yearlyDetail: '월간 12회 대비 기본 할인에 등급 혜택이 더해집니다.',
    monthlyDetail: '지금 바로 시작하기 좋은 월간 플랜입니다.',
    perYear: '/ 년',
    perMonth: '/ 월',
    recommend: '추천',
    tierYearlyFinal: '등급 기준 연간 최종가',
    tierMonthlyFinal: '등급 기준 월간 최종가',
    base: '기본',
    additionalDiscount: '추가 할인',
    phraseLimitReached: '무료 문장 저장 한도를 모두 사용했습니다.',
    trialRemaining: (days: number) =>
      `무료 체험 ${days}일 남았습니다. 이후 하루 ${FREE_DAILY_VIEW_LIMIT}개 제한이 적용됩니다.`,
    dailyLimitReached: `오늘 무료 영상 시청 한도(${FREE_DAILY_VIEW_LIMIT}개)를 모두 사용했습니다.`,
    title: '제한 없이 이어보기',
    descriptionTrial: '무료 체험 중 -- 업그레이드하면 체험 후에도 무제한으로 이용할 수 있습니다.',
    descriptionFull: '프리미엄으로 업그레이드하면 모든 기능을 제한 없이 이용할 수 있고, 현재 등급 혜택은 다음 결제 주기부터 반영됩니다.',
    featureUnlimitedVideos: '무제한 영상 시청',
    featureUnlimitedPhrases: '무제한 문장 저장',
    featureAllGames: '전체 복습 게임 이용',
    featureNoAds: '광고 없이 학습',
    yearlyNote: '연간은 기본가 자체가 더 저렴하고, 등급 혜택은 다음 연간 갱신 때 추가로 반영됩니다.',
    loginRequired: '로그인 후 결제',
    loginRequiredDetail: '결제 권한과 구독 상태는 계정 단위로 관리됩니다.',
    errorPayment: '결제에 실패했습니다. 다시 시도해 주세요.',
    errorCheckout: '결제 세션을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    connecting: '결제 연결 중...',
    loginAndSubscribe: '로그인 후 구독 시작',
    trialStart: '7일 무료 체험 후 구독',
    premiumStart: '프리미엄 시작',
    continueBrowsing: '계속 둘러보기',
  },
  ja: {
    yearlyPlan: '年間プラン',
    monthlyPlan: '月間プラン',
    yearlyDetail: '月間12回分と比べて基本割引にランク特典が加わります。',
    monthlyDetail: '今すぐ始められる月間プランです。',
    perYear: '/ 年',
    perMonth: '/ 月',
    recommend: 'おすすめ',
    tierYearlyFinal: 'ランク基準の年間最終価格',
    tierMonthlyFinal: 'ランク基準の月間最終価格',
    base: '基本',
    additionalDiscount: '追加割引',
    phraseLimitReached: '無料フレーズ保存の上限に達しました。',
    trialRemaining: (days: number) =>
      `無料体験残り${days}日。その後は1日${FREE_DAILY_VIEW_LIMIT}件の制限が適用されます。`,
    dailyLimitReached: `本日の無料動画視聴上限(${FREE_DAILY_VIEW_LIMIT}件)に達しました。`,
    title: '制限なく続ける',
    descriptionTrial: '無料体験中 -- アップグレードすると体験後も無制限で利用できます。',
    descriptionFull: 'プレミアムにアップグレードすると全機能を制限なく利用でき、現在のランク特典は次の決済サイクルから反映されます。',
    featureUnlimitedVideos: '動画無制限視聴',
    featureUnlimitedPhrases: 'フレーズ無制限保存',
    featureAllGames: '全復習ゲーム利用可能',
    featureNoAds: '広告なしで学習',
    yearlyNote: '年間プランは基本価格自体がお得で、ランク特典は次の年間更新時に追加反映されます。',
    loginRequired: 'ログイン後に決済',
    loginRequiredDetail: '決済権限とサブスクリプション状態はアカウント単位で管理されます。',
    errorPayment: '決済に失敗しました。もう一度お試しください。',
    errorCheckout: '決済セッションを開始できませんでした。しばらくしてからもう一度お試しください。',
    connecting: '決済接続中...',
    loginAndSubscribe: 'ログインして購読開始',
    trialStart: '7日間無料体験後に購読',
    premiumStart: 'プレミアム開始',
    continueBrowsing: '引き続き閲覧する',
  },
  'zh-TW': {
    yearlyPlan: '年費方案',
    monthlyPlan: '月費方案',
    yearlyDetail: '與月費12期相比，基本折扣再加上等級優惠。',
    monthlyDetail: '立即開始的月費方案。',
    perYear: '/ 年',
    perMonth: '/ 月',
    recommend: '推薦',
    tierYearlyFinal: '等級年費最終價',
    tierMonthlyFinal: '等級月費最終價',
    base: '基本',
    additionalDiscount: '額外折扣',
    phraseLimitReached: '已達免費句子儲存上限。',
    trialRemaining: (days: number) =>
      `免費試用剩餘 ${days} 天。之後每日限制 ${FREE_DAILY_VIEW_LIMIT} 部影片。`,
    dailyLimitReached: `今日免費影片觀看上限(${FREE_DAILY_VIEW_LIMIT}部)已用完。`,
    title: '無限暢看',
    descriptionTrial: '免費試用中 -- 升級後試用結束後仍可無限使用。',
    descriptionFull: '升級至 Premium 即可無限使用所有功能，目前等級優惠將於下個計費週期生效。',
    featureUnlimitedVideos: '無限觀看影片',
    featureUnlimitedPhrases: '無限儲存句子',
    featureAllGames: '所有複習遊戲',
    featureNoAds: '無廣告學習',
    yearlyNote: '年費方案基本價格更優惠，等級優惠將於下次年費續約時額外反映。',
    loginRequired: '登入後付款',
    loginRequiredDetail: '付款權限與訂閱狀態依帳號管理。',
    errorPayment: '付款失敗，請重新嘗試。',
    errorCheckout: '無法啟動付款，請稍後再試。',
    connecting: '連線付款中...',
    loginAndSubscribe: '登入後開始訂閱',
    trialStart: '7天免費試用後訂閱',
    premiumStart: '開始 Premium',
    continueBrowsing: '繼續瀏覽',
  },
  vi: {
    yearlyPlan: 'G\u00f3i h\u00e0ng n\u0103m',
    monthlyPlan: 'G\u00f3i h\u00e0ng th\u00e1ng',
    yearlyDetail: 'So v\u1edbi 12 k\u1ef3 h\u00e0ng th\u00e1ng, gi\u1ea3m gi\u00e1 c\u01a1 b\u1ea3n c\u1ed9ng th\u00eam \u01b0u \u0111\u00e3i h\u1ea1ng.',
    monthlyDetail: 'G\u00f3i h\u00e0ng th\u00e1ng \u0111\u1ec3 b\u1eaft \u0111\u1ea7u ngay.',
    perYear: '/ n\u0103m',
    perMonth: '/ th\u00e1ng',
    recommend: '\u0110\u1ec1 xu\u1ea5t',
    tierYearlyFinal: 'Gi\u00e1 cu\u1ed1i h\u00e0ng n\u0103m theo h\u1ea1ng',
    tierMonthlyFinal: 'Gi\u00e1 cu\u1ed1i h\u00e0ng th\u00e1ng theo h\u1ea1ng',
    base: 'C\u01a1 b\u1ea3n',
    additionalDiscount: 'Gi\u1ea3m th\u00eam',
    phraseLimitReached: 'B\u1ea1n \u0111\u00e3 d\u00f9ng h\u1ebft gi\u1edbi h\u1ea1n l\u01b0u c\u00e2u mi\u1ec5n ph\u00ed.',
    trialRemaining: (days: number) =>
      `C\u00f2n ${days} ng\u00e0y d\u00f9ng th\u1eed mi\u1ec5n ph\u00ed. Sau \u0111\u00f3 gi\u1edbi h\u1ea1n ${FREE_DAILY_VIEW_LIMIT} video/ng\u00e0y.`,
    dailyLimitReached: `B\u1ea1n \u0111\u00e3 d\u00f9ng h\u1ebft gi\u1edbi h\u1ea1n xem video mi\u1ec5n ph\u00ed h\u00f4m nay (${FREE_DAILY_VIEW_LIMIT} video).`,
    title: 'Xem kh\u00f4ng gi\u1edbi h\u1ea1n',
    descriptionTrial: '\u0110ang d\u00f9ng th\u1eed mi\u1ec5n ph\u00ed -- n\u00e2ng c\u1ea5p \u0111\u1ec3 ti\u1ebfp t\u1ee5c s\u1eed d\u1ee5ng kh\u00f4ng gi\u1edbi h\u1ea1n sau khi h\u1ebft h\u1ea1n.',
    descriptionFull: 'N\u00e2ng c\u1ea5p l\u00ean Premium \u0111\u1ec3 s\u1eed d\u1ee5ng t\u1ea5t c\u1ea3 t\u00ednh n\u0103ng kh\u00f4ng gi\u1edbi h\u1ea1n. \u01afu \u0111\u00e3i h\u1ea1ng hi\u1ec7n t\u1ea1i s\u1ebd \u0111\u01b0\u1ee3c \u00e1p d\u1ee5ng t\u1eeb chu k\u1ef3 thanh to\u00e1n ti\u1ebfp theo.',
    featureUnlimitedVideos: 'Xem video kh\u00f4ng gi\u1edbi h\u1ea1n',
    featureUnlimitedPhrases: 'L\u01b0u c\u00e2u kh\u00f4ng gi\u1edbi h\u1ea1n',
    featureAllGames: 'T\u1ea5t c\u1ea3 tr\u00f2 ch\u01a1i \u00f4n t\u1eadp',
    featureNoAds: 'H\u1ecdc kh\u00f4ng qu\u1ea3ng c\u00e1o',
    yearlyNote: 'G\u00f3i h\u00e0ng n\u0103m c\u00f3 gi\u00e1 c\u01a1 b\u1ea3n r\u1ebb h\u01a1n, \u01b0u \u0111\u00e3i h\u1ea1ng s\u1ebd \u0111\u01b0\u1ee3c c\u1ed9ng th\u00eam khi gia h\u1ea1n h\u00e0ng n\u0103m.',
    loginRequired: '\u0110\u0103ng nh\u1eadp \u0111\u1ec3 thanh to\u00e1n',
    loginRequiredDetail: 'Quy\u1ec1n thanh to\u00e1n v\u00e0 tr\u1ea1ng th\u00e1i \u0111\u0103ng k\u00fd \u0111\u01b0\u1ee3c qu\u1ea3n l\u00fd theo t\u00e0i kho\u1ea3n.',
    errorPayment: 'Thanh to\u00e1n th\u1ea5t b\u1ea1i. Vui l\u00f2ng th\u1eed l\u1ea1i.',
    errorCheckout: 'Kh\u00f4ng th\u1ec3 b\u1eaft \u0111\u1ea7u phi\u00ean thanh to\u00e1n. Vui l\u00f2ng th\u1eed l\u1ea1i sau.',
    connecting: '\u0110ang k\u1ebft n\u1ed1i thanh to\u00e1n...',
    loginAndSubscribe: '\u0110\u0103ng nh\u1eadp v\u00e0 b\u1eaft \u0111\u1ea7u \u0111\u0103ng k\u00fd',
    trialStart: '\u0110\u0103ng k\u00fd sau 7 ng\u00e0y d\u00f9ng th\u1eed mi\u1ec5n ph\u00ed',
    premiumStart: 'B\u1eaft \u0111\u1ea7u Premium',
    continueBrowsing: 'Ti\u1ebfp t\u1ee5c xem',
  },
} as const

type PremiumTranslations = typeof TRANSLATIONS[TranslationLocale]

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  trigger?: 'video-limit' | 'phrase-limit'
}

function getTriggerMessage(
  trigger: 'video-limit' | 'phrase-limit',
  trialDaysRemaining: number,
  inTrial: boolean,
  t: PremiumTranslations,
): string {
  if (trigger === 'phrase-limit') return t.phraseLimitReached
  if (inTrial && trialDaysRemaining > 0) {
    return t.trialRemaining(trialDaysRemaining)
  }
  return t.dailyLimitReached
}

function getPlanDetails(t: PremiumTranslations, locale: BillingLocale): Record<
  BillingPlan,
  { label: string; detail: string; price: string; comparePrice?: string; subdetail?: string; highlight?: boolean }
> {
  return {
    yearly: {
      label: t.yearlyPlan,
      detail: t.yearlyDetail,
      price: `${formatPrice(YEARLY_BASE_PRICE, locale)} ${t.perYear}`,
      comparePrice: formatPrice(YEARLY_REFERENCE_PRICE, locale),
      highlight: true,
    },
    monthly: {
      label: t.monthlyPlan,
      detail: t.monthlyDetail,
      price: `${formatPrice(MONTHLY_BASE_PRICE, locale)} ${t.perMonth}`,
      comparePrice: formatPrice(MONTHLY_REFERENCE_PRICE, locale),
    },
  }
}

function getPlanOptionDetail(plan: BillingPlan, tierName: string, t: PremiumTranslations) {
  if (plan === 'yearly') {
    return `${tierName} ${t.tierYearlyFinal}`
  }

  return `${tierName} ${t.tierMonthlyFinal}`
}

export function PremiumModal({
  isOpen,
  onClose,
  trigger = 'video-limit',
}: PremiumModalProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const setPremiumEntitlement = usePremiumStore((s) => s.setPremiumEntitlement)
  const getBenefitSnapshot = useTierStore((state) => state.getBenefitSnapshot)
  const isInTrialFn = usePremiumStore((s) => s.isInTrial as (() => boolean) | undefined)
  const getTrialDaysRemainingFn = usePremiumStore((s) => s.getTrialDaysRemaining as (() => number) | undefined)
  const inTrial = isInTrialFn ? isInTrialFn() : false
  const trialDaysRemaining = getTrialDaysRemainingFn ? getTrialDaysRemainingFn() : 0
  const rawLocale = useLocaleStore((s) => s.locale)
  const locale = toBillingLocale(rawLocale)
  const tLocale = toTranslationLocale(rawLocale)
  const t = TRANSLATIONS[tLocale]
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>('yearly')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [nativePackages, setNativePackages] = useState<PurchasesPackage[]>([])
  const native = isNative()
  const benefitSnapshot = getBenefitSnapshot()
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
        const { getCustomerInfo, getOfferings, isPremiumFromCustomerInfo } = await import(
          '@/lib/nativeBilling'
        )
        const [customerInfo, offerings] = await Promise.all([getCustomerInfo(), getOfferings()])

        if (!cancelled) {
          setPremiumEntitlement(isPremiumFromCustomerInfo(customerInfo))
          setNativePackages(offerings?.current?.availablePackages ?? [])
        }
      } catch (error) {
        console.warn('[billing] failed to load native offerings:', error)
      }
    }

    void loadOfferings()
    return () => { cancelled = true }
  }, [isOpen, native, setPremiumEntitlement])

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
        setErrorMessage(t.errorPayment)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleWebCheckout = async () => {
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
      setErrorMessage(t.errorCheckout)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckout = () => {
    if (!user) {
      window.location.assign(`/login?next=${encodeURIComponent(nextPath || '/profile')}`)
      return
    }

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

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} position="bottom">
      <div className="mb-2 text-center text-sm text-[var(--text-muted)]">
        {getTriggerMessage(trigger, trialDaysRemaining, inTrial, t)}
      </div>
      <ModalHeader
        eyebrow="Premium"
        title={t.title}
        description={
          inTrial && trialDaysRemaining > 0
            ? t.descriptionTrial
            : t.descriptionFull
        }
        onClose={onClose}
      />

      <ModalFeatureList
        items={[
          t.featureUnlimitedVideos,
          t.featureUnlimitedPhrases,
          t.featureAllGames,
          t.featureNoAds,
        ]}
      />

      <p className="mb-4 text-center text-xs text-[var(--text-secondary)]">
        {t.yearlyNote}
      </p>

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
                        {isYearly ? t.yearlyPlan : t.monthlyPlan}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        {getPlanOptionDetail(
                          isYearly ? 'yearly' : 'monthly',
                          TIER_NAMES[benefitSnapshot.benefitTier],
                          t,
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        {isYearly
                          ? `${t.base} ${YEARLY_BASE_SAVINGS_PERCENT}% + ${formatDiscountText(t.additionalDiscount, benefitSnapshot.yearlyRenewalDiscount, locale)}`
                          : formatDiscountText(t.additionalDiscount, benefitSnapshot.monthlyDiscount, locale)}
                      </p>
                    </div>
                    {isYearly && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                        {t.recommend}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-xs text-[var(--text-muted)] line-through">
                      {isYearly
                        ? formatPrice(YEARLY_REFERENCE_PRICE, locale)
                        : formatPrice(MONTHLY_REFERENCE_PRICE, locale)}
                    </span>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {isYearly
                        ? `${formatPrice(getYearlyRenewalPrice(benefitSnapshot.yearlyRenewalDiscount, benefitSnapshot.monthlyDiscount), locale)} ${t.perYear}`
                        : `${formatPrice(getMonthlyDiscountedPrice(benefitSnapshot.monthlyDiscount), locale)} ${t.perMonth}`}
                    </p>
                  </div>
                </button>
              )
            })
          : (['yearly', 'monthly'] as BillingPlan[]).map((plan) => {
              const planDetails = getPlanDetails(t, locale)
              const details = planDetails[plan]
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
                        {getPlanOptionDetail(
                          plan,
                          TIER_NAMES[benefitSnapshot.benefitTier],
                          t,
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                        {plan === 'yearly'
                          ? `${t.base} ${YEARLY_BASE_SAVINGS_PERCENT}% + ${formatDiscountText(`${TIER_NAMES[benefitSnapshot.benefitTier]} ${t.additionalDiscount}`, benefitSnapshot.yearlyRenewalDiscount, locale)}`
                          : formatDiscountText(`${TIER_NAMES[benefitSnapshot.benefitTier]} ${t.additionalDiscount}`, benefitSnapshot.monthlyDiscount, locale)}
                      </p>
                    </div>
                    {details.highlight && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-semibold text-emerald-300">
                        {t.recommend}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    {details.comparePrice ? (
                      <span className="text-xs text-[var(--text-muted)] line-through">{details.comparePrice}</span>
                    ) : null}
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {plan === 'yearly'
                        ? `${formatPrice(getYearlyRenewalPrice(benefitSnapshot.yearlyRenewalDiscount, benefitSnapshot.monthlyDiscount), locale)} ${t.perYear}`
                        : `${formatPrice(getMonthlyDiscountedPrice(benefitSnapshot.monthlyDiscount), locale)} ${t.perMonth}`}
                    </p>
                  </div>
                </button>
              )
            })}
      </div>

      {!native && !user && (
        <div className="mb-4 rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-sky-300">{t.loginRequired}</p>
          <p className="mt-1 text-xs leading-relaxed text-sky-100/80">
            {t.loginRequiredDetail}
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
        disabled={submitting}
        className="w-full rounded-2xl bg-[var(--accent-primary)] py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? t.connecting
          : !native && !user
            ? t.loginAndSubscribe
            : inTrial
              ? t.trialStart
              : t.premiumStart}
      </button>
      <button
        onClick={onClose}
        className="mt-2 w-full py-3 text-sm font-medium text-[var(--text-muted)]"
      >
        {t.continueBrowsing}
      </button>
    </ModalShell>
  )
}
