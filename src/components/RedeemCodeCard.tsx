'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { SurfaceCard } from '@/components/ui/AppPage'

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-code': 'This code is not valid.',
  'already-redeemed': 'This code has already been used.',
  'code-expired': 'This code has expired.',
  unauthorized: 'Log in before redeeming a code.',
  'redeem-failed': 'Could not redeem the code.',
  'entitlement-failed': 'Could not apply premium access.',
}

export function RedeemCodeCard({ onRedeemed }: { onRedeemed?: () => void }) {
  const { user } = useAuth()
  const setPremiumEntitlement = usePremiumStore((state) => state.setPremiumEntitlement)
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleRedeem = async () => {
    const trimmed = code.trim()
    if (!trimmed) return

    setSubmitting(true)
    setResult(null)

    try {
      const response = await fetch('/api/billing/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      })

      const payload = (await response.json().catch(() => null)) as {
        success?: boolean
        error?: string
        durationDays?: number
      } | null

      if (!response.ok || !payload?.success) {
        const errorKey = payload?.error ?? 'redeem-failed'
        setResult({
          success: false,
          message: ERROR_MESSAGES[errorKey] ?? 'An unknown error occurred.',
        })
        return
      }

      setPremiumEntitlement(true)
      setCode('')
      setResult({
        success: true,
        message: `Premium is active now. (${payload.durationDays} days)`,
      })
      onRedeemed?.()
    } catch {
      setResult({
        success: false,
        message: 'A network error occurred.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SurfaceCard className="p-6">
      <p className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
        REDEEM CODE
      </p>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          onKeyDown={(event) => event.key === 'Enter' && handleRedeem()}
          placeholder="Enter code"
          disabled={!user || submitting}
          className="min-w-0 flex-1 rounded-2xl bg-[var(--bg-primary)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
          maxLength={20}
        />
        <button
          onClick={handleRedeem}
          disabled={!user || !code.trim() || submitting}
          className="w-full shrink-0 rounded-2xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {submitting ? 'APPLYING...' : 'APPLY'}
        </button>
      </div>

      {!user && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Log in before redeeming a membership code.
        </p>
      )}

      {result && (
        <div
          className={`mt-3 rounded-2xl px-4 py-3 text-sm ${
            result.success
              ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              : 'border border-red-500/20 bg-red-500/10 text-red-200'
          }`}
        >
          {result.message}
        </div>
      )}
    </SurfaceCard>
  )
}
