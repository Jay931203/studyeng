'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { AdminIssuesList } from '@/components/AdminIssuesList'
import { StreakDisplay } from '@/components/StreakDisplay'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStore } from '@/stores/useAdminStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { usePremiumStore } from '@/stores/usePremiumStore'
import {
  useThemeStore,
  type ThemeAccent,
  type ThemeBackground,
} from '@/stores/useThemeStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

const BACKGROUND_OPTIONS = [
  {
    id: 'dark' as const,
    label: '다크',
    description: '콘트라스트가 강한 몰입형 학습 화면입니다.',
    previewClass: 'border-white/10 bg-[#050505]',
  },
  {
    id: 'light' as const,
    label: '라이트',
    description: '밝은 배경에서 정보 구조를 또렷하게 보여줍니다.',
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
    id: 'teal' as const,
    label: '제이드',
    description: 'Shortee 기본 포인트 색상입니다.',
    swatchClass: 'bg-teal-500',
  },
  {
    id: 'blue' as const,
    label: '블루',
    description: '차분하고 선명한 대체 색상입니다.',
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
      <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
          {description}
        </p>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { user, loading, authAvailable, signInWithGoogle, signInWithKakao, signOut } = useAuth()
  const backgroundTheme = useThemeStore((state) => state.backgroundTheme)
  const colorTheme = useThemeStore((state) => state.colorTheme)
  const setBackgroundTheme = useThemeStore((state) => state.setBackgroundTheme)
  const setColorTheme = useThemeStore((state) => state.setColorTheme)
  const {
    adminEnabled,
    clearFlags,
    exportReportBundle,
    flaggedSubtitles,
    isAdmin,
    isAdminActive,
    issues,
    setAdminEnabled,
  } = useAdminStore()

  const streakDays = useUserStore((state) => state.streakDays)
  const phraseCount = usePhraseStore((state) => state.phrases.length)
  const totalWatched = useWatchHistoryStore((state) => state.watchedVideoIds.length)
  const totalViews = useWatchHistoryStore((state) =>
    Object.values(state.viewCounts).reduce((sum, count) => sum + count, 0),
  )
  const isPremium = usePremiumStore((state) => state.isPremium)
  const setPremium = usePremiumStore((state) => state.setPremium)
  const unresolvedCount = issues.filter((issue) => !issue.resolved).length
  const profileName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split('@')[0] ??
    'Shortee 사용자'

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
    <div className="h-full overflow-y-auto pb-24 pt-6 lg:pb-10 lg:pt-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-text)]">
              Me
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--text-primary)]">나</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              계정, 앱 톤, 현재 루프를 한곳에 모았습니다.
            </p>
          </div>
        </div>

        {!authAvailable && (
          <section className="mb-6 rounded-[28px] border border-amber-500/20 bg-amber-500/10 px-5 py-4">
            <p className="text-sm font-semibold text-amber-300">
              로그인 연결이 아직 비어 있습니다.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-100/80">
              지금은 로컬 상태만 점검할 수 있습니다. Supabase 환경 변수를 연결하면 계정 동기화가 켜집니다.
            </p>
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]"
            >
              <SectionTitle
                title="계정"
                description="로그인 상태와 기본 계정 작업을 관리합니다."
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
                  <p className="truncate text-xl font-bold text-[var(--text-primary)]">
                    {profileName}
                  </p>
                  <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
                    {user?.email ?? '로그인하면 이어보기와 저장 표현이 함께 보관됩니다.'}
                  </p>
                </div>
              </div>

              <div className="mt-5">
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
                      disabled={!authAvailable}
                      className="w-full rounded-2xl bg-white py-3 text-sm font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Google로 이어가기
                    </button>
                    <button
                      onClick={() => signInWithKakao('/profile')}
                      disabled={!authAvailable}
                      className="w-full rounded-2xl bg-[#FEE500] py-3 text-sm font-medium text-[#191919] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Kakao로 이어가기
                    </button>
                  </div>
                )}
              </div>
            </motion.section>

            <section className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
              <SectionTitle
                title="앱 톤"
                description="배경과 포인트 색을 바로 바꿔볼 수 있습니다."
              />

              <div className="mb-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  배경 테마
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  강조 색상
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

            {isAdmin && (
              <section className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
                <SectionTitle
                  title="운영 도구"
                  description="검수에 필요한 모드와 플래그를 빠르게 제어합니다."
                />

                <div className="space-y-3">
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

                  <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-primary)] px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">프리미엄 모드</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        프리미엄 기능 잠금을 점검할 때 사용합니다.
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
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <section className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
              <SectionTitle
                title="활동"
                description="지금 쌓인 루틴과 활동량을 확인합니다."
              />
              <StreakDisplay days={streakDays} />
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-[var(--bg-primary)] p-4 text-center">
                  <p className="text-3xl font-bold text-[var(--text-primary)]">{totalViews}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">총 시청</p>
                </div>
                <div className="rounded-2xl bg-[var(--bg-primary)] p-4 text-center">
                  <p className="text-3xl font-bold text-[var(--text-primary)]">{phraseCount}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">저장 표현</p>
                </div>
                <div className="rounded-2xl bg-[var(--bg-primary)] p-4 text-center">
                  <p className="text-3xl font-bold text-[var(--text-primary)]">{totalWatched}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">본 영상</p>
                </div>
              </div>
            </section>

            {isAdminActive() && (
              <section className="rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
                <SectionTitle
                  title="리포트 번들"
                  description="리포트와 플래그 데이터를 복사하거나 정리할 수 있습니다."
                />

                <div className="rounded-2xl bg-[var(--bg-primary)] p-4">
                  <p className="text-sm font-semibold text-red-400">
                    미해결 {unresolvedCount}건 · 플래그 {flaggedSubtitles.length}건
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

            <section className="overflow-hidden rounded-[32px] border border-[var(--border-card)] bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
              <Link
                href="/terms"
                className="flex items-center justify-between border-b border-[var(--border-card)] px-5 py-4 text-sm text-[var(--text-secondary)]"
              >
                <span>이용약관</span>
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/privacy"
                className="flex items-center justify-between px-5 py-4 text-sm text-[var(--text-secondary)]"
              >
                <span>개인정보처리방침</span>
                <span aria-hidden>→</span>
              </Link>
            </section>
          </div>
        </div>

        <div className="mt-6">
          <AdminIssuesList />
        </div>
      </div>
    </div>
  )
}
