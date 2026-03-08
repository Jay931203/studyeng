'use client'

import { useEffect, useState } from 'react'
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
  if (!value) return '미확인'

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
        const response = await fetch('/api/billing/status', {
          cache: 'no-store',
        })

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
  }, [billingEnabled, user])

  const handlePortal = async () => {
    setManaging(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as { url?: string } | null
      if (!response.ok || !payload?.url) {
        throw new Error('billing-portal-failed')
      }

      window.location.assign(payload.url)
    } catch (error) {
      console.warn('[billing] portal launch failed:', error)
      setErrorMessage('구독 관리 페이지를 열지 못했습니다.')
      setManaging(false)
    }
  }

  return (
    <SurfaceCard className="p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[var(--text-primary)]">구독 상태</h2>
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
          프리미엄 권한은 서버 결제와 구독 상태 기준으로 관리됩니다.
        </p>
      </div>

      {!billingEnabled && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-amber-300">결제 비활성</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-100/80">
            운영 환경에서 billing 설정이 완료되면 이 카드가 실제 구독 상태를 표시합니다.
          </p>
        </div>
      )}

      {billingEnabled && !user && (
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-sky-300">로그인 필요</p>
          <p className="mt-1 text-xs leading-relaxed text-sky-100/80">
            구독 상태와 결제 관리는 로그인한 계정 기준으로만 확인할 수 있습니다.
          </p>
        </div>
      )}

      {billingEnabled && user && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)]">현재 권한</p>
            <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
              {loading ? '확인 중...' : status?.isPremium ? '프리미엄 활성' : '무료 플랜'}
            </p>
            {status?.entitlement?.currentPeriodEnd && (
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                다음 갱신 기준일 {formatDate(status.entitlement.currentPeriodEnd)}
              </p>
            )}
            {status?.entitlement?.cancelAtPeriodEnd && (
              <p className="mt-1 text-xs text-amber-300">기간 종료 후 자동 갱신이 중지됩니다.</p>
            )}
          </div>

          {status?.isPremium && (
            <button
              onClick={handlePortal}
              disabled={managing}
              className="w-full rounded-2xl bg-[var(--accent-primary)] py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {managing ? '구독 관리 연결 중...' : '구독 관리 열기'}
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
