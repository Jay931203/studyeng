'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { AdminIssuesList } from '@/components/AdminIssuesList'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStore } from '@/stores/useAdminStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import {
  useThemeStore,
  type ThemeAccent,
  type ThemeBackground,
} from '@/stores/useThemeStore'

const BACKGROUND_OPTIONS = [
  {
    id: 'dark' as const,
    label: '다크',
    description: '쇼츠와 플레이어를 어둡게 봅니다.',
    previewClass: 'border-white/10 bg-[#050505]',
  },
  {
    id: 'light' as const,
    label: '라이트',
    description: '쇼츠와 플레이어를 밝게 봅니다.',
    previewClass: 'border-slate-300 bg-[#f8fafc]',
  },
] satisfies Array<{
  id: ThemeBackground
  label: string
  description: string
  previewClass: string
}>

const COLOR_OPTIONS = [
  {
    id: 'violet' as const,
    label: '바이올렛',
    description: '강조색을 바이올렛 계열로 맞춥니다.',
    swatchClass: 'bg-violet-500',
  },
  {
    id: 'blue' as const,
    label: '블루',
    description: '강조색을 블루 계열로 맞춥니다.',
    swatchClass: 'bg-blue-500',
  },
] satisfies Array<{
  id: ThemeAccent
  label: string
  description: string
  swatchClass: string
}>

function SectionTitle({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { user, loading, signInWithGoogle, signInWithKakao, signOut } = useAuth()
  const backgroundTheme = useThemeStore((state) => state.backgroundTheme)
  const colorTheme = useThemeStore((state) => state.colorTheme)
  const setBackgroundTheme = useThemeStore((state) => state.setBackgroundTheme)
  const setColorTheme = useThemeStore((state) => state.setColorTheme)
  const {
    adminEmail,
    adminEnabled,
    clearFlags,
    exportReportBundle,
    flaggedSubtitles,
    isAdmin,
    isAdminActive,
    issues,
    setAdminEnabled,
  } = useAdminStore()

  const isPremium = usePremiumStore((state) => state.isPremium)
  const setPremium = usePremiumStore((state) => state.setPremium)
  const isAdminOwner = isAdmin && user?.email === adminEmail
  const unresolvedCount = issues.filter((issue) => !issue.resolved).length
  const profileName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split('@')[0] ??
    'Shortee'

  const copyBundle = async () => {
    const json = exportReportBundle()

    try {
      await navigator.clipboard.writeText(json)
      window.alert('리포트 번들을 복사했습니다.')
    } catch {
      window.prompt('리포트 번들 JSON', json)
    }
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-text)]">
            Settings
          </p>
          <h1 className="mt-2 text-2xl font-black text-[var(--text-primary)]">설정</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            테마, 계정, 관리 기능과 정책 링크를 여기에서 정리합니다.
          </p>
        </div>

        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-[30px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]"
        >
          <SectionTitle
            title="계정"
            description="로그인 상태와 기본 계정 작업을 확인합니다."
          />
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-2xl font-bold text-white">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={profileName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{profileName.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-[var(--text-primary)]">
                {profileName}
              </p>
              <p className="truncate text-sm text-[var(--text-secondary)]">
                {user?.email ?? '로그인하면 계정 동기화와 기록 보관이 활성화됩니다.'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            {loading ? null : user ? (
              <button
                onClick={signOut}
                className="w-full rounded-2xl bg-[var(--bg-secondary)] py-3 text-sm font-medium text-[var(--text-primary)]"
              >
                로그아웃
              </button>
            ) : (
              <div className="grid gap-3">
                <button
                  onClick={() => signInWithGoogle('/profile')}
                  className="w-full rounded-2xl bg-white py-3 text-sm font-medium text-black"
                >
                  Google로 로그인
                </button>
                <button
                  onClick={() => signInWithKakao('/profile')}
                  className="w-full rounded-2xl bg-[#FEE500] py-3 text-sm font-medium text-[#191919]"
                >
                  Kakao로 로그인
                </button>
              </div>
            )}
          </div>
        </motion.section>

        <section className="mb-4 rounded-[30px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
          <SectionTitle
            title="테마"
            description="배경 톤과 강조색을 분리해서 고를 수 있습니다."
          />

          <div className="mb-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              배경 테마
            </p>
            <div className="grid grid-cols-2 gap-3">
              {BACKGROUND_OPTIONS.map((option) => {
                const selected = backgroundTheme === option.id

                return (
                  <button
                    key={option.id}
                    onClick={() => setBackgroundTheme(option.id)}
                    className={`rounded-2xl border p-3 text-left ${
                      selected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                        : 'border-[var(--border-card)] bg-[var(--bg-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-2xl border ${option.previewClass}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {option.label}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
              색상 테마
            </p>
            <div className="grid grid-cols-2 gap-3">
              {COLOR_OPTIONS.map((option) => {
                const selected = colorTheme === option.id

                return (
                  <button
                    key={option.id}
                    onClick={() => setColorTheme(option.id)}
                    className={`rounded-2xl border p-3 text-left ${
                      selected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                        : 'border-[var(--border-card)] bg-[var(--bg-primary)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--border-card)] bg-[var(--bg-secondary)]">
                        <div className={`h-5 w-5 rounded-full ${option.swatchClass}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {option.label}
                        </p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {isAdminOwner && (
          <section className="mb-4 rounded-[30px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
            <SectionTitle
              title="관리자 설정"
              description="리포트 수집과 검수 도구를 제어합니다."
            />

            <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">관리자 모드</p>
                <p className="text-xs text-[var(--text-muted)]">
                  리포트 확인과 플래그 정리에 사용합니다.
                </p>
              </div>
              <button
                onClick={() => setAdminEnabled(!adminEnabled)}
                className={`relative h-6 w-11 rounded-full ${
                  adminEnabled ? 'bg-red-500' : 'bg-[var(--bg-secondary)]'
                }`}
                role="switch"
                aria-checked={adminEnabled}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    adminEnabled ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">프리미엄 모드</p>
                <p className="text-xs text-[var(--text-muted)]">
                  프리미엄 기능 잠금을 해제합니다.
                </p>
              </div>
              <button
                onClick={() => setPremium(!isPremium)}
                className={`relative h-6 w-11 rounded-full ${
                  isPremium ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)]'
                }`}
                role="switch"
                aria-checked={isPremium}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    isPremium ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          </section>
        )}

        {isAdminActive() && (
          <section className="mb-4 rounded-[30px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
            <SectionTitle
              title="Report Bundle"
              description="미해결 이슈와 플래그 데이터를 복사하거나 비울 수 있습니다."
            />

            <div className="rounded-2xl bg-[var(--bg-primary)] p-4">
              <p className="text-sm font-semibold text-red-400">
                미해결 {unresolvedCount}건, 플래그 {flaggedSubtitles.length}건
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={copyBundle}
                  className="flex-1 rounded-xl bg-red-500/10 py-2 text-xs font-medium text-red-400"
                >
                  리포트 번들 복사
                </button>
                <button
                  onClick={clearFlags}
                  disabled={flaggedSubtitles.length === 0}
                  className="rounded-xl bg-[var(--bg-secondary)] px-4 py-2 text-xs text-[var(--text-muted)] disabled:opacity-30"
                >
                  플래그 비우기
                </button>
              </div>
            </div>
          </section>
        )}

        <AdminIssuesList />

        <section className="mb-4 overflow-hidden rounded-[30px] border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
          <Link
            href="/terms"
            className="flex items-center justify-between border-b border-[var(--border-card)] px-5 py-4 text-sm text-[var(--text-secondary)]"
          >
            <span>이용약관</span>
            <span aria-hidden>›</span>
          </Link>
          <Link
            href="/privacy"
            className="flex items-center justify-between px-5 py-4 text-sm text-[var(--text-secondary)]"
          >
            <span>개인정보처리방침</span>
            <span aria-hidden>›</span>
          </Link>
        </section>
      </div>
    </div>
  )
}
