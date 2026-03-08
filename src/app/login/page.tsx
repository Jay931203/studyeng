'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'

function LoginPageContent() {
  const { user, loading, signInWithGoogle, signInWithKakao } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = useMemo(() => searchParams.get('next') || '/explore', [searchParams])

  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath)
    }
  }, [loading, nextPath, router, user])

  return (
    <div className="flex h-dvh flex-col items-center justify-center bg-[var(--bg-primary)] px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-text)]">
          Sign in
        </p>
        <h1 className="mt-4 text-5xl font-black text-[var(--text-primary)]">StudyEng</h1>
        <p className="mt-4 text-base leading-relaxed text-[var(--text-secondary)]">
          로그인 후 한 번만 취향을 설정하면
          <br />
          바로 맞춤 홈과 쇼츠로 이어집니다.
        </p>

        <div className="mt-10 space-y-4">
          <button
            onClick={() => signInWithGoogle(nextPath)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-base font-medium text-black"
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
            Google로 시작하기
          </button>

          <button
            onClick={() => signInWithKakao(nextPath)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3.5 text-base font-medium text-[#191919]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#191919"
                d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.01 4.36 6.36l-1.1 4.07c-.08.31.27.55.54.38l4.73-3.12c.48.05.97.08 1.47.08 5.52 0 10-3.36 10-7.5S17.52 3 12 3z"
              />
            </svg>
            카카오로 시작하기
          </button>

          <button
            onClick={() => router.push('/explore')}
            className="w-full rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] py-3.5 text-base text-[var(--text-secondary)]"
          >
            둘러보기
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
  )
}

function LoginPageFallback() {
  return (
    <div className="flex h-dvh items-center justify-center bg-[var(--bg-primary)]">
      <div className="relative">
        <div className="h-8 w-8 rounded-full border-[1.5px] border-white/10" />
        <div className="absolute inset-0 h-8 w-8 animate-spin rounded-full border-[1.5px] border-transparent border-t-white/60" />
      </div>
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
