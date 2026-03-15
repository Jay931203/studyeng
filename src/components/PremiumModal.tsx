'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { type BillingPlan } from '@/lib/billing'
import {
  formatDiscountText,
  formatPrice,
  formatWon,
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

function toBillingLocale(locale: SupportedLocale): BillingLocale {
  return locale === 'ja' ? 'ja' : 'ko'
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
} as const

interface PremiumModalProps {
  isOpen: boolean
  onClose: () => void
  trigger?: 'video-limit' | 'phrase-limit'
}

function getTriggerMessage(
  trigger: 'video-limit' | 'phrase-limit',
  trialDaysRemaining: number,
  inTrial: boolean,
  t: typeof TRANSLATIONS['ko'],
): string {
  if (trigger === 'phrase-limit') return t.phraseLimitReached
  if (inTrial && trialDaysRemaining > 0) {
    return t.trialRemaining(trialDaysRemaining)
  }
  return t.dailyLimitReached
}

function getPlanDetails(t: typeof TRANSLATIONS['ko'], locale: BillingLocale): Record<
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

function getPlanOptionDetail(plan: BillingPlan, tierName: string, t: typeof TRANSLATIONS['ko']) {
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
  const locale = toBillingLocale(useLocaleStore((s) => s.locale))
  const t = TRANSLATIONS[locale]
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
