'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStore } from '@/stores/useAdminStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import {
  useThemeStore,
  type ThemeAccent,
  type ThemeBackground,
} from '@/stores/useThemeStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { StreakDisplay } from '@/components/StreakDisplay'
import { AdminIssuesList } from '@/components/AdminIssuesList'

const BACKGROUND_OPTIONS = [
  {
    id: 'dark' as const,
    label: '다크',
    description: '쇼츠와 플레이어를 어둡게 봅니다.',
    previewClass: 'bg-[#050505] border-white/10',
  },
  {
    id: 'light' as const,
    label: '라이트',
    description: '쇼츠와 플레이어를 밝게 봅니다.',
    previewClass: 'bg-[#f8fafc] border-slate-300',
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
    description: '프리즈와 강조 포인트를 보라로 맞춥니다.',
    swatchClass: 'bg-violet-500',
  },
  {
    id: 'blue' as const,
    label: '블루',
    description: '프리즈와 강조 포인트를 블루로 맞춥니다.',
    swatchClass: 'bg-blue-500',
  },
] satisfies Array<{
  id: ThemeAccent
  label: string
  description: string
  swatchClass: string
}>

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-[var(--bg-card)] p-4 text-center shadow-[var(--card-shadow)]">
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
    </div>
  )
}

export default function ProfilePage() {
  const { user, loading, signInWithGoogle, signInWithKakao, signOut } = useAuth()
  const backgroundTheme = useThemeStore((state) => state.backgroundTheme)
  const colorTheme = useThemeStore((state) => state.colorTheme)
  const setBackgroundTheme = useThemeStore((state) => state.setBackgroundTheme)
  const setColorTheme = useThemeStore((state) => state.setColorTheme)
  const streakDays = useUserStore((state) => state.streakDays)
  const phraseCount = usePhraseStore((state) => state.phrases.length)
  const totalWatched = useWatchHistoryStore((state) => state.watchedVideoIds.length)
  const totalViews = useWatchHistoryStore((state) =>
    Object.values(state.viewCounts).reduce((sum, count) => sum + count, 0),
  )
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

  const isAdminOwner = isAdmin && user?.email === adminEmail
  const unresolvedCount = issues.filter((issue) => !issue.resolved).length

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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl text-white">S</span>
            )}
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--text-primary)]">{user?.user_metadata?.full_name ?? '게스트'}</p>
            <p className="text-sm text-[var(--text-secondary)]">{user?.email ?? '로그인하면 기록이 더 잘 쌓입니다.'}</p>
          </div>
        </motion.div>

        <StreakDisplay days={streakDays} />

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat value={totalViews} label="총 시청" />
          <Stat value={phraseCount} label="저장 표현" />
          <Stat value={totalWatched} label="본 영상" />
        </div>

        <div className="mt-6 rounded-xl bg-[var(--bg-card)] px-4 py-4 shadow-[var(--card-shadow)]">
          <div className="mb-4">
            <p className="text-sm text-[var(--text-secondary)]">테마</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              배경 밝기와 포인트 색상을 따로 고를 수 있습니다.
            </p>
          </div>

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
                        <p className="text-sm font-medium text-[var(--text-primary)]">{option.label}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{option.description}</p>
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
                        <p className="text-sm font-medium text-[var(--text-primary)]">{option.label}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{option.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {isAdminOwner && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--bg-card)] px-4 py-3 shadow-[var(--card-shadow)]">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">관리자 모드</p>
              <p className="text-xs text-[var(--text-muted)]">리포트와 자막 플래그 표시를 켜고 끕니다.</p>
            </div>
            <button
              onClick={() => setAdminEnabled(!adminEnabled)}
              className={`relative h-6 w-11 rounded-full ${adminEnabled ? 'bg-red-500' : 'bg-[var(--bg-secondary)]'}`}
              role="switch"
              aria-checked={adminEnabled}
            >
              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${adminEnabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        )}

        {isAdminActive() && (
          <div className="mt-3 rounded-xl bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]">
            <p className="text-sm font-semibold text-red-400">REPORT BUNDLE</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              미해결 {unresolvedCount}건 · 자막 플래그 {flaggedSubtitles.length}건
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              나중에 한 번에 수정할 수 있도록 이슈와 자막 플래그를 함께 내보냅니다.
            </p>
            <div className="mt-3 flex gap-2">
              <button onClick={copyBundle} className="flex-1 rounded-lg bg-red-500/10 py-2 text-xs font-medium text-red-400">
                리포트 번들 복사
              </button>
              <button
                onClick={clearFlags}
                disabled={flaggedSubtitles.length === 0}
                className="rounded-lg bg-[var(--bg-secondary)] px-4 py-2 text-xs text-[var(--text-muted)] disabled:opacity-30"
              >
                플래그 비우기
              </button>
            </div>
          </div>
        )}

        <AdminIssuesList />

        <div className="mt-3 overflow-hidden rounded-xl bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
          <Link href="/terms" className="flex items-center justify-between border-b border-[var(--border-card)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            <span>이용약관</span>
            <span>›</span>
          </Link>
          <Link href="/privacy" className="flex items-center justify-between px-4 py-3 text-sm text-[var(--text-secondary)]">
            <span>개인정보처리방침</span>
            <span>›</span>
          </Link>
        </div>

        <div className="mt-4">
          {loading ? null : user ? (
            <button
              onClick={signOut}
              className="w-full rounded-xl bg-[var(--bg-card)] py-3 text-sm text-[var(--text-secondary)] shadow-[var(--card-shadow)]"
            >
              로그아웃
            </button>
          ) : (
            <div className="space-y-3">
              <button onClick={() => signInWithGoogle('/profile')} className="w-full rounded-xl bg-white py-3 font-medium text-black">
                Google로 로그인
              </button>
              <button onClick={() => signInWithKakao('/profile')} className="w-full rounded-xl bg-[#FEE500] py-3 font-medium text-[#191919]">
                카카오로 로그인
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
