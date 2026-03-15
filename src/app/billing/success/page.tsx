'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogoFull } from '@/components/Logo'
import { sanitizeAppPath } from '@/lib/navigation'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { getPersistedLocale, BILLING_SUCCESS_STRINGS } from '@/lib/i18n-error'

function BillingSuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const setPremiumEntitlement = usePremiumStore((state) => state.setPremiumEntitlement)
  const sessionId = useMemo(() => searchParams.get('session_id'), [searchParams])
  const nextPath = useMemo(() => sanitizeAppPath(searchParams.get('next'), '/profile'), [searchParams])
  const [status, setStatus] = useState<'syncing' | 'done' | 'error'>('syncing')
  const locale = getPersistedLocale()

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
          {status === 'error'
            ? BILLING_SUCCESS_STRINGS.titleError[locale]
            : BILLING_SUCCESS_STRINGS.titleSyncing[locale]}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          {status === 'syncing' && BILLING_SUCCESS_STRINGS.descSyncing[locale]}
          {status === 'done' && BILLING_SUCCESS_STRINGS.descDone[locale]}
          {status === 'error' && BILLING_SUCCESS_STRINGS.descError[locale]}
        </p>
        <div className="mt-6">
          <Link
            href={nextPath}
            className="inline-flex rounded-2xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-white"
          >
            {BILLING_SUCCESS_STRINGS.goToProfile[locale]}
          </Link>
        </div>
      </div>
    </div>
  )
}

function BillingSuccessFallback() {
  const locale = getPersistedLocale()
  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center shadow-2xl">
        <LogoFull className="mx-auto h-10 text-[var(--text-primary)]" />
        <h1 className="mt-6 text-2xl font-bold text-[var(--text-primary)]">
          {BILLING_SUCCESS_STRINGS.fallbackTitle[locale]}
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
