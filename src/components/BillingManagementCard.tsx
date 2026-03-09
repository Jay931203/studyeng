'use client'

import { useEffect, useState } from 'react'
import { isBillingEnabled } from '@/lib/billing'
import { isNative } from '@/lib/platform'
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

function formatDate(value: string | null) {
  if (!value) return 'Unavailable'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value))
}

export function BillingManagementCard() {
  const { user } = useAuth()
  const billingEnabled = isBillingEnabled()
  const native = isNative()
  const isPremium = usePremiumStore((s) => s.isPremium)
  const setPremiumEntitlement = usePremiumStore((s) => s.setPremiumEntitlement)
  const [loading, setLoading] = useState(false)
  const [managing, setManaging] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [status, setStatus] = useState<BillingStatusPayload | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (native) {
      // On native, premium status comes from RevenueCat via the store
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
          setErrorMessage('Failed to load subscription status.')
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
      setErrorMessage('Failed to open subscription management.')
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

  const isEnabled = native || billingEnabled
  const currentPremium = native ? isPremium : status?.isPremium
  const planLabel = loading ? 'CHECKING' : currentPremium ? 'PRO' : 'FREE'

  return (
    <SurfaceCard className="p-6">
      <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
        SUBSCRIPTION
      </p>

      <div className="mb-3 flex items-center gap-3 rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
        <p className="shrink-0 text-xs font-semibold text-[var(--text-muted)]">PLAN</p>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{planLabel}</p>
      </div>

      {!isEnabled && (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">결제 비활성</p>
        </div>
      )}

      {isEnabled && !native && !user && (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-sky-300">Login required</p>
        </div>
      )}

      {isEnabled && (native || user) && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)]">STATUS</p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {loading ? 'Checking' : currentPremium ? 'Premium active' : 'Free plan'}
            </p>
            {!native && status?.entitlement?.currentPeriodEnd && (
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                Renews {formatDate(status.entitlement.currentPeriodEnd)}
              </p>
            )}
            {!native && status?.entitlement?.cancelAtPeriodEnd && (
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Cancels at period end</p>
            )}
          </div>

          {/* Web: Stripe portal for managing subscription */}
          {!native && currentPremium && (
            <button
              onClick={handlePortal}
              disabled={managing}
              className="w-full rounded-2xl bg-[var(--accent-primary)] py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {managing ? 'Connecting...' : 'Manage subscription'}
            </button>
          )}

          {/* Native: Restore purchases button */}
          {native && !currentPremium && (
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="w-full rounded-2xl bg-[var(--bg-secondary)] py-3 text-sm font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {restoring ? '복원 중...' : '구매 복원'}
            </button>
          )}

          {/* Native: Guide to manage via store */}
          {native && currentPremium && (
            <div className="rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
              <p className="text-xs text-[var(--text-secondary)]">
                구독 관리는 기기의 앱스토어 설정에서 변경할 수 있습니다.
              </p>
            </div>
          )}
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
