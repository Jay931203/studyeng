'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo } from 'react'
import { Logo, LogoFull } from '@/components/Logo'
import { useAuth } from '@/hooks/useAuth'
import { getGuestContinuePath, sanitizeAppPath } from '@/lib/navigation'

function FeatureRow({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-card)]/85 p-4 shadow-[var(--card-shadow)]">
      <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  )
}

function FlowNote() {
  return (
      <div className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card)]/88 p-5 shadow-[var(--card-shadow)]">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--accent-glow)] px-3 py-1 text-xs font-medium text-[var(--accent-text)]">
            쇼츠
          </span>
          <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            자막
          </span>
          <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
            저장
          </span>
        </div>
        <p className="mt-4 text-xl font-bold text-[var(--text-primary)]">
          쇼츠에서 보고, 자막에서 멈추고, 필요한 표현만 남겨두세요.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
          계정을 연결하면 이어보기와 저장 표현, 다시 볼 흐름이 끊기지 않게 묶입니다.
        </p>
      </div>
  )
}

function LoginPageContent() {
  const { user, loading, authAvailable, signInWithGoogle, signInWithKakao } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = useMemo(
    () => sanitizeAppPath(searchParams.get('next'), '/explore'),
    [searchParams],
  )
  const guestContinuePath = useMemo(() => getGuestContinuePath(nextPath), [nextPath])

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath)
    }
  }, [loading, nextPath, router, user])

  return (
    <div className="min-h-dvh px-6 py-10 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-text)]">
            Shortee
          </p>
          <Logo className="mt-4 h-12 text-[var(--text-primary)]" />
          <h1 className="mt-6 text-4xl font-bold leading-tight text-[var(--text-primary)]">
            짧은 장면을 넘기다 보면
            <br />
            귀가 먼저 익숙해집니다
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--text-secondary)]">
            로그인하면 본 장면, 저장 표현, 이어보기가 한 계정에 정리되어 다시 들어와도 흐름이 이어집니다.
          </p>

          <div className="mt-8 max-w-xl">
            <FlowNote />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <FeatureRow
              title="이어보기"
              description="보던 흐름이 그대로 이어집니다."
            />
            <FeatureRow
              title="저장 표현"
              description="남겨둔 문장을 다시 꺼낼 수 있습니다."
            />
            <FeatureRow
              title="반응형 추천"
              description="넘긴 장면들이 다음 피드에 바로 반영됩니다."
            />
            <FeatureRow
              title="가볍게 시작"
              description="둘러본 뒤 필요할 때 연결해도 됩니다."
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)]/92 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
            계정 연결
          </p>
          <h2 className="mt-3 text-3xl font-bold text-[var(--text-primary)]">
            로그인하고 이어서 보기
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            한 번 로그인하면 오늘 장면과 저장 표현, 이어보기가 같은 흐름으로 붙습니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--accent-glow)] px-3 py-1 text-xs font-medium text-[var(--accent-text)]">
              이어보기 동기화
            </span>
            <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              저장 표현 유지
            </span>
            <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
              추천 반영
            </span>
          </div>

          {!authAvailable && (
            <div className="mt-5 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                로그인 연결이 아직 비어 있습니다.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                지금은 둘러보기만 가능합니다. Supabase 환경 변수를 연결하면 로그인 버튼이 활성화됩니다.
              </p>
            </div>
          )}

          <div className="mt-8 space-y-4">
            <button
              onClick={() => signInWithGoogle(nextPath)}
              disabled={!authAvailable}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-base font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 이어가기
            </button>

            <button
              onClick={() => signInWithKakao(nextPath)}
              disabled={!authAvailable}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FEE500] py-4 text-base font-medium text-[#191919] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#191919"
                  d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.01 4.36 6.36l-1.1 4.07c-.08.31.27.55.54.38l4.73-3.12c.48.05.97.08 1.47.08 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"
                />
              </svg>
              카카오로 이어가기
            </button>

            <button
              onClick={() => router.push(guestContinuePath)}
              className="w-full rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] py-4 text-base text-[var(--text-secondary)]"
            >
              먼저 둘러보기
            </button>
          </div>

          <p className="mt-8 text-xs leading-relaxed text-[var(--text-muted)]">
            계속하면{' '}
            <Link href="/terms" className="text-[var(--text-secondary)] underline underline-offset-2">
              이용약관
            </Link>
            {' '}및{' '}
            <Link href="/privacy" className="text-[var(--text-secondary)] underline underline-offset-2">
              개인정보처리방침
            </Link>
            에 동의한 것으로 간주됩니다.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

function LoginPageFallback() {
  return (
    <div className="flex h-dvh items-center justify-center bg-[var(--bg-primary)]">
      <LogoFull className="h-12 animate-fade-in text-[var(--text-primary)]" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  )
}
