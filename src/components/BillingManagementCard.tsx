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
    detail: 'Best value for regular learners',
    price: 'KRW 79,900 / year',
    highlight: 'BEST VALUE',
  },
  monthly: {
    id: 'monthly',
    label: 'MONTHLY',
    detail: 'Flexible month-to-month access',
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
      return 'Yearly membership'
    case 'premium_monthly':
      return 'Monthly membership'
    case 'premium':
      return 'Premium membership'
    default:
      return 'Free plan'
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
          setErrorMessage('Failed to load membership status.')
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
          detail: pkg.product.description || (yearly ? 'Annual access via store billing' : 'Monthly access via store billing'),
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
      setErrorMessage('Failed to open membership management.')
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
        setErrorMessage('No purchases were found to restore.')
      }
    } catch (error) {
      console.warn('[billing] restore failed:', error)
      setErrorMessage('Failed to restore purchases.')
    } finally {
      setRestoring(false)
    }
  }

  const handleNativePurchase = async (plan: BillingPlan) => {
    const pkg =
      nativePackages.find((entry) => (plan === 'yearly' ? entry.packageType === 'ANNUAL' : entry.packageType === 'MONTHLY')) ??
      nativePackages[0]

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
    } catch (error: unknown) {
      const purchaseError = error as { code?: string; userCancelled?: boolean }
      if (!purchaseError.userCancelled && purchaseError.code !== 'PURCHASE_CANCELLED') {
        console.warn('[billing] checkout failed:', error)
        setErrorMessage('Failed to start the store purchase flow.')
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
      setErrorMessage('Failed to start checkout.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenStore = () => {
    const url = getStoreManagementUrl()
    if (!url) {
      setErrorMessage('Store management is unavailable on this device.')
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
                {loading ? 'Checking membership' : currentPremium ? 'Premium active' : 'Free plan'}
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
              {status.entitlement.cancelAtPeriodEnd ? 'Access ends' : 'Renews'} {formatDate(status.entitlement.currentPeriodEnd)}
            </p>
          )}

          {!native && !user && billingEnabled && (
            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              Log in to keep billing, status, and premium access synced to your account.
            </p>
          )}

          {native && currentPremium && (
            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              Change or cancel your membership in the {getStoreLabel()}.
            </p>
          )}

          {!native && !billingEnabled && (
            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              Checkout is being configured. Membership codes still work as soon as they are issued.
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
                ? 'Plan changes are handled in the store settings for your device.'
                : 'Use Manage membership to change billing cycle, cancel, or update payment details.'}
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
