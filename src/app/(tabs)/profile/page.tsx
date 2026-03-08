'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useAdminStore } from '@/stores/useAdminStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useThemeStore, type ThemeId } from '@/stores/useThemeStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { StreakDisplay } from '@/components/StreakDisplay'
import { AdminIssuesList } from '@/components/AdminIssuesList'

const THEME_OPTIONS = [
  { id: 'purple-dark' as const, label: '블랙 · 보라', swatch: 'bg-black border-purple-500', dot: 'bg-purple-500' },
  { id: 'blue-dark' as const, label: '블랙 · 블루', swatch: 'bg-black border-blue-500', dot: 'bg-blue-500' },
  { id: 'light' as const, label: '화이트 · 보라', swatch: 'bg-white border-purple-600', dot: 'bg-purple-600' },
  { id: 'light-blue' as const, label: '화이트 · 블루', swatch: 'bg-white border-blue-600', dot: 'bg-blue-600' },
] satisfies Array<{ id: ThemeId; label: string; swatch: string; dot: string }>

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
  const { theme, setTheme } = useThemeStore()
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

        <div className="mt-6 rounded-xl bg-[var(--bg-card)] px-4 py-3 shadow-[var(--card-shadow)]">
          <p className="mb-3 text-sm text-[var(--text-secondary)]">테마</p>
          <div className="grid grid-cols-2 gap-3">
            {THEME_OPTIONS.map((option) => {
              const selected = theme === option.id
              return (
                <button
                  key={option.id}
                  onClick={() => setTheme(option.id)}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left ${
                    selected ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]' : 'border-[var(--border-card)] bg-[var(--bg-primary)]'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-[3px] ${option.swatch}`}>
                    <div className={`h-4 w-4 rounded-full ${option.dot}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">{option.label}</p>
                    <p className="text-xs text-[var(--text-muted)]">{selected ? '현재 사용 중' : '색 조합 바꾸기'}</p>
                  </div>
                </button>
              )
            })}
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
