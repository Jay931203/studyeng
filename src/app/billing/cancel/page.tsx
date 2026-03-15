'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'
import { sanitizeAppPath } from '@/lib/navigation'
import { getPersistedLocale, BILLING_CANCEL_STRINGS } from '@/lib/i18n-error'

function BillingCancelContent() {
  const searchParams = useSearchParams()
  const nextPath = useMemo(
    () => sanitizeAppPath(searchParams.get('next'), '/profile'),
    [searchParams],
  )
  const locale = getPersistedLocale()

  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] p-8 text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          {BILLING_CANCEL_STRINGS.title[locale]}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          {BILLING_CANCEL_STRINGS.description[locale]}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href={nextPath}
            className="rounded-2xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-white"
          >
            {BILLING_CANCEL_STRINGS.goBack[locale]}
          </Link>
          <Link
            href="/shorts"
            className="rounded-2xl bg-[var(--bg-secondary)] px-5 py-3 text-sm font-medium text-[var(--text-primary)]"
          >
            {BILLING_CANCEL_STRINGS.continueWatching[locale]}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function BillingCancelPage() {
  return (
    <Suspense fallback={null}>
      <BillingCancelContent />
    </Suspense>
  )
}
