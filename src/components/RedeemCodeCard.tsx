'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePremiumStore } from '@/stores/usePremiumStore'
import { SurfaceCard } from '@/components/ui/AppPage'

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-code': '유효하지 않은 코드입니다.',
  'already-redeemed': '이미 사용된 코드입니다.',
  'code-expired': '만료된 코드입니다.',
  'unauthorized': '로그인이 필요합니다.',
  'redeem-failed': '코드 등록에 실패했습니다.',
  'entitlement-failed': '권한 부여에 실패했습니다.',
}

export function RedeemCodeCard() {
  const { user } = useAuth()
  const setPremiumEntitlement = usePremiumStore((s) => s.setPremiumEntitlement)
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
          message: ERROR_MESSAGES[errorKey] ?? '알 수 없는 오류가 발생했습니다.',
        })
        return
      }

      setPremiumEntitlement(true)
      setCode('')
      setResult({
        success: true,
        message: `프리미엄이 활성화되었습니다! (${payload.durationDays}일)`,
      })
    } catch {
      setResult({
        success: false,
        message: '네트워크 오류가 발생했습니다.',
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

      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
          placeholder="코드 입력"
          disabled={!user || submitting}
          className="flex-1 rounded-2xl bg-[var(--bg-primary)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
          maxLength={20}
        />
        <button
          onClick={handleRedeem}
          disabled={!user || !code.trim() || submitting}
          className="shrink-0 rounded-2xl bg-[var(--accent-primary)] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? '확인 중...' : '등록'}
        </button>
      </div>

      {!user && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          로그인 후 코드를 등록할 수 있습니다.
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
