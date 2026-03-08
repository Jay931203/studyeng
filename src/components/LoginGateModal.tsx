'use client'

import { useAuth } from '@/hooks/useAuth'
import { ModalFeatureList, ModalHeader, ModalShell } from '@/components/ui/ModalShell'

interface LoginGateModalProps {
  isOpen: boolean
  onClose?: () => void
}

export function LoginGateModal({ isOpen, onClose }: LoginGateModalProps) {
  const { signInWithGoogle, signInWithKakao, authAvailable } = useAuth()
  const handleClose = onClose ?? (() => {})
  const getNextPath = () =>
    typeof window === 'undefined'
      ? '/shorts'
      : `${window.location.pathname}${window.location.search}` || '/shorts'

  if (!isOpen) return null

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} position="center">
      <ModalHeader
        eyebrow="이어보기"
        title="로그인하고 이어보기"
        description="게스트로는 여기까지입니다. 로그인하면 본 흐름과 저장 표현이 그대로 붙습니다."
        onClose={handleClose}
      />

      {!authAvailable && (
        <div className="mb-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-4 py-3 text-left">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">로그인 연결이 아직 비어 있습니다.</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            지금은 게스트 상태로 화면만 점검할 수 있습니다. Supabase 환경 변수를 연결하면 로그인 버튼이 활성화됩니다.
          </p>
        </div>
      )}

      <ModalFeatureList
        items={['저장 표현 유지', '이어보기 동기화', '개인화 추천 반영']}
      />

      <div className="space-y-3">
        <button
          onClick={() => signInWithGoogle(getNextPath())}
          disabled={!authAvailable}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-base font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google로 이어가기
        </button>

        <button
          onClick={() => signInWithKakao(getNextPath())}
          disabled={!authAvailable}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-3.5 text-base font-medium text-[#191919] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#191919" d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.01 4.36 6.36l-1.1 4.07c-.08.31.27.55.54.38l4.73-3.12c.48.05.97.08 1.47.08 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" />
          </svg>
          카카오로 이어가기
        </button>
      </div>

      <button
        onClick={handleClose}
        className="mt-3 w-full py-3 text-sm font-medium text-[var(--text-muted)]"
      >
        나중에
      </button>
    </ModalShell>
  )
}
