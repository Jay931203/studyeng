'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogoFull } from '@/components/Logo'
import { sanitizeAppPath } from '@/lib/navigation'
import { usePremiumStore } from '@/stores/usePremiumStore'

function BillingSuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setPremiumEntitlement = usePremiumStore((state) => state.setPremiumEntitlement)
  const sessionId = useMemo(() => searchParams.get('session_id'), [searchParams])
  const nextPath = useMemo(() => sanitizeAppPath(searchParams.get('next'), '/profile'), [searchParams])
  const [status, setStatus] = useState<'syncing' | 'done' | 'error'>('syncing')

  useEffect(() => {
    if (!sessionId) {
      setStatus('error')
      return
    }

    let cancelled = false

    const syncSession = async () => {
      try {
        const response = await fetch('/api/billing/sync-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })

        if (!response.ok) {
          throw new Error('billing-sync-failed')
        }

        const payload = (await response.json()) as { isPremium?: boolean }

        if (!cancelled) {
          setPremiumEntitlement(Boolean(payload.isPremium))
          setStatus('done')
          window.setTimeout(() => router.replace(nextPath), 1200)
        }
      } catch (error) {
        console.warn('[billing] success page sync failed:', error)
        if (!cancelled) {
          setStatus('error')
        }
      }
    }

    void syncSession()

    return () => {
      cancelled = true
    }
  }, [nextPath, router, sessionId, setPremiumEntitlement])

  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center shadow-2xl">
        <LogoFull className="mx-auto h-10 text-[var(--text-primary)]" />
        <h1 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
          {status === 'error' ? '결제 확인이 지연되고 있습니다' : '구독을 확인하고 있습니다'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          {status === 'syncing' &&
            '결제 완료 후 프리미엄 권한을 계정에 반영하는 중입니다.'}
          {status === 'done' &&
            '프리미엄 권한 반영이 끝났습니다. 잠시 후 프로필로 이동합니다.'}
          {status === 'error' &&
            '권한 반영이 늦어질 수 있습니다. 잠시 후 프로필에서 상태를 다시 확인해 주세요.'}
        </p>
        <div className="mt-6">
          <Link
            href={nextPath}
            className="inline-flex rounded-2xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-white"
          >
            프로필로 이동
          </Link>
        </div>
      </div>
    </div>
  )
}

function BillingSuccessFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center shadow-2xl">
        <LogoFull className="mx-auto h-10 text-[var(--text-primary)]" />
        <h1 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
          구독 상태를 확인하는 중입니다
        </h1>
      </div>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<BillingSuccessFallback />}>
      <BillingSuccessPageContent />
    </Suspense>
  )
}
