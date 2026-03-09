'use client'

import { useEffect, useMemo, useState } from 'react'
import { isBillingEnabled } from '@/lib/billing'
import { useAuth } from '@/hooks/useAuth'
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
  const [loading, setLoading] = useState(false)
  const [managing, setManaging] = useState(false)
  const [status, setStatus] = useState<BillingStatusPayload | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
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
  }, [billingEnabled, user])

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

  const planLabel = useMemo(() => {
    if (loading) return 'CHECKING'
    return status?.isPremium ? 'PRO' : 'FREE'
  }, [loading, status?.isPremium])

  return (
    <SurfaceCard className="p-6">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
        SUBSCRIPTION
      </p>

      <div className="mb-3 rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
        <p className="text-xs text-[var(--text-muted)]">PLAN</p>
        <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">{planLabel}</p>
      </div>

      {!billingEnabled && (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-4 py-3">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">Billing disabled</p>
        </div>
      )}

      {billingEnabled && !user && (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-sky-300">Login required</p>
        </div>
      )}

      {billingEnabled && user && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)]">STATUS</p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {loading ? 'Checking' : status?.isPremium ? 'Premium active' : 'Free plan'}
            </p>
            {status?.entitlement?.currentPeriodEnd && (
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                Renews {formatDate(status.entitlement.currentPeriodEnd)}
              </p>
            )}
            {status?.entitlement?.cancelAtPeriodEnd && (
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Cancels at period end</p>
            )}
          </div>

          {status?.isPremium && (
            <button
              onClick={handlePortal}
              disabled={managing}
              className="w-full rounded-2xl bg-[var(--accent-primary)] py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {managing ? 'Connecting...' : 'Manage subscription'}
            </button>
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
