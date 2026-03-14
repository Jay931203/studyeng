'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { PurchasesPackage } from '@revenuecat/purchases-typescript-internal-esm'
import { getBillingConfig, type BillingPlan } from '@/lib/billing'
import { getPlatform, isNative } from '@/lib/platform'
import { useAuth } from '@/hooks/useAuth'
import { usePremiumStore } from '@/stores/usePremiumStore'
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
    label: 'YEARLY',
    detail: 'Best value for learners staying in the routine long term.',
    price: 'KRW 79,900 / year',
    highlight: 'BEST VALUE',
  },
  monthly: {
    id: 'monthly',
    label: 'MONTHLY',
    detail: 'Lower commitment if you want to start small.',
    price: 'KRW 9,900 / month',
  },
}

function formatDate(value: string | null) {
  if (!value) return 'Unavailable'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

function getPlanLabel(planKey: string | null | undefined) {
  switch (planKey) {
    case 'premium_yearly':
      return 'Premium Yearly'
    case 'premium_monthly':
      return 'Premium Monthly'
    case 'premium':
      return 'Premium'
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
          setErrorMessage('Could not load membership status.')
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
  const hasCodeAccess = currentPremium && entitlementSource === 'code'
  const planKey = status?.entitlement?.planKey ?? (currentPremium ? 'premium' : 'free')
  const currentPlanLabel = loading ? 'Checking membership...' : getPlanLabel(planKey)
  const currentStatusLabel = loading
    ? 'Checking membership...'
    : currentPremium
      ? 'Premium active'
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
          ? `Manage in ${getStoreLabel()}`
          : 'Manage in subscription portal'
        : hasCodeAccess
          ? 'Code access only'
          : user
            ? 'Ready to subscribe'
            : 'Log in to subscribe'
  const scheduleLabel =
    native && currentPremium
      ? 'Renewal'
      : !native && status?.entitlement?.currentPeriodEnd
        ? status.entitlement.cancelAtPeriodEnd
          ? 'Access ends'
          : 'Next billing'
        : 'Schedule'
  const scheduleValue =
    native && currentPremium
      ? `Check in ${getStoreLabel()}`
      : !native && status?.entitlement?.currentPeriodEnd
        ? formatDate(status.entitlement.currentPeriodEnd)
        : ''
  const paymentMethodLabel = hasBillingPaymentMethod
    ? native
      ? `${getStoreLabel()} billing`
      : status?.paymentMethod?.last4
        ? `${formatCardBrand(status.paymentMethod.brand)} •••• ${status.paymentMethod.last4}`
        : 'Payment method unavailable'
    : ''
  const paymentMethodDetail =
    !native &&
    hasBillingPaymentMethod &&
    status?.paymentMethod?.expMonth &&
    status?.paymentMethod?.expYear
      ? `Exp ${String(status.paymentMethod.expMonth).padStart(2, '0')}/${String(status.paymentMethod.expYear).slice(-2)}`
      : null
  const membershipSummaryItems = [
    ...(currentPremium
      ? [{ label: 'Plan', value: currentPlanLabel, detail: null as string | null }]
      : []),
    ...(hasBillingPaymentMethod
      ? [{ label: 'Payment', value: paymentMethodLabel, detail: paymentMethodDetail }]
      : []),
    ...(hasCodeAccess
      ? [
          {
            label: 'Access',
            value: 'Redeemed code',
            detail: 'Billing starts only when you subscribe.',
          },
        ]
      : []),
    { label: 'Manage', value: managementLabel, detail: null as string | null },
    { label: scheduleLabel, value: scheduleValue, detail: null as string | null },
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
          label: yearly ? 'YEARLY' : 'MONTHLY',
          detail:
            pkg.product.description ||
            (yearly
              ? `Subscribe yearly through ${getStoreLabel()}.`
              : `Subscribe monthly through ${getStoreLabel()}.`),
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
      setErrorMessage('Could not open the subscription portal.')
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
        setErrorMessage('No restorable purchase was found.')
      }
    } catch (error) {
      console.warn('[billing] restore failed:', error)
      setErrorMessage('Purchase restore failed.')
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
      setErrorMessage('Membership plans are still loading.')
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
        setErrorMessage('Could not start the store checkout.')
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
      setErrorMessage('Could not start checkout.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenStore = () => {
    const url = getStoreManagementUrl()
    if (!url) {
      setErrorMessage('This device cannot open the store subscription page.')
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
    if (!isReady) return 'BILLING SOON'
    if (submitting) return 'PROCESSING...'
    if (managing) return 'OPENING...'
    if (hasManagedSubscription) {
      return native ? `MANAGE IN ${getStoreLabel().toUpperCase()}` : 'MANAGE SUBSCRIPTION'
    }
    if (!user) return 'LOG IN TO SUBSCRIBE'
    return 'START SUBSCRIPTION'
  })()

  return (
    <SurfaceCard className="p-6">
      {!isDetail && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            SUBSCRIPTION
          </p>
          <Link
            href="/profile/membership"
            className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]"
          >
            DETAIL
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

              {!native && status?.entitlement?.currentPeriodEnd && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  {status.entitlement.cancelAtPeriodEnd ? 'Access ends' : 'Next billing'}{' '}
                  {formatDate(status.entitlement.currentPeriodEnd)}
                </p>
              )}

              {hasBillingPaymentMethod && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Payment {paymentMethodLabel}
                  {paymentMethodDetail ? ` · ${paymentMethodDetail}` : ''}
                </p>
              )}

              {!native && hasCodeAccess && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Premium is active from a redeemed code. Billing starts only when you subscribe.
                </p>
              )}

              {!native && !user && webBillingReady && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Log in to manage billing and attach premium access to your account.
                </p>
              )}

              {!native && billingEnabled && !webBillingReady && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Billing is still being finalized on the server.
                </p>
              )}

              {native && currentPremium && (
                <p className="mt-2 text-xs text-[var(--text-secondary)]">
                  Plan changes and billing management happen in {getStoreLabel()}.
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
                STATUS
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
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  OPTIONS
                </p>
                {currentPlan && (
                  <p className="text-xs text-[var(--text-secondary)]">
                    Current {currentPlan === 'yearly' ? 'Yearly' : 'Monthly'}
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
                    ? 'Your current access comes from a code. Start a subscription whenever you want billing to continue automatically.'
                    : native
                    ? `Change plans in ${getStoreLabel()}.`
                    : 'Billing cycle changes and payment method updates happen in the subscription portal.'}
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
                {restoring ? 'RESTORING...' : 'RESTORE PURCHASE'}
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
