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

function AnimatedStat({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      className="rounded-xl bg-[var(--bg-card)] p-4 text-center shadow-[var(--card-shadow)]"
    >
      <motion.p
        key={value}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="text-2xl font-bold text-[var(--text-primary)]"
      >
        {value}
      </motion.p>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
    </motion.div>
  )
}

const THEME_OPTIONS = [
  {
    id: 'purple-dark' as const,
    label: '블랙 + 보라',
    swatchClass: 'bg-black border-purple-500',
    dotClass: 'bg-purple-500',
  },
  {
    id: 'blue-dark' as const,
    label: '블랙 + 블루',
    swatchClass: 'bg-black border-blue-500',
    dotClass: 'bg-blue-500',
  },
  {
    id: 'light' as const,
    label: '화이트 + 보라',
    swatchClass: 'bg-white border-purple-600',
    dotClass: 'bg-purple-600',
  },
  {
    id: 'light-blue' as const,
    label: '화이트 + 블루',
    swatchClass: 'bg-white border-blue-600',
    dotClass: 'bg-blue-600',
  },
] satisfies Array<{
  id: ThemeId
  label: string
  swatchClass: string
  dotClass: string
}>

export default function ProfilePage() {
  const { streakDays } = useUserStore()
  const phraseCount = usePhraseStore((state) => state.phrases.length)
  const totalWatched = useWatchHistoryStore((state) => state.watchedVideoIds.length)
  const totalViews = useWatchHistoryStore((state) =>
    Object.values(state.viewCounts).reduce((sum, count) => sum + count, 0),
  )

  const { user, loading, signInWithGoogle, signInWithKakao, signOut } = useAuth()
  const { theme, setTheme } = useThemeStore()
  const {
    adminEmail,
    adminEnabled,
    clearFlags,
    exportFlags,
    flaggedSubtitles,
    isAdmin,
    isAdminActive,
    setAdminEnabled,
  } = useAdminStore()

  const isNewUser = totalViews === 0 && phraseCount === 0 && streakDays === 0

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center gap-4"
        >
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-2xl shadow-lg shadow-blue-500/20"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="h-8 w-8">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0zM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695z" clipRule="evenodd" />
              </svg>
            )}
          </motion.div>

          <div>
            <p className="text-lg font-bold text-[var(--text-primary)]">
              {user?.user_metadata?.full_name ?? '게스트'}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {user?.email ?? '로그인하면 학습 기록이 유지됩니다.'}
            </p>
            {isNewUser && (
              <span className="mt-2 inline-flex rounded-full bg-[var(--accent-glow)] px-2 py-0.5 text-xs font-medium text-[var(--accent-text)]">
                첫 학습을 시작해보세요
              </span>
            )}
          </div>
        </motion.div>

        <StreakDisplay days={streakDays} />

        <div className="mt-4 grid grid-cols-3 gap-3">
          <AnimatedStat value={totalViews} label="총 시청" />
          <AnimatedStat value={phraseCount} label="저장 표현" />
          <AnimatedStat value={totalWatched} label="본 영상" />
        </div>

        <div className="mt-6 rounded-xl bg-[var(--bg-card)] px-4 py-3 shadow-[var(--card-shadow)]">
          <p className="mb-3 text-sm text-[var(--text-secondary)]">테마</p>
          <div className="grid grid-cols-2 gap-3">
            {THEME_OPTIONS.map((option) => {
              const selected = theme === option.id
              return (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTheme(option.id)}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                    selected
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-glow)]'
                      : 'border-[var(--border-card)] bg-[var(--bg-primary)]'
                  }`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border-[3px] ${option.swatchClass}`}>
                    <div className={`h-4 w-4 rounded-full ${option.dotClass}`} />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${selected ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                      {option.label}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {selected ? '현재 사용 중' : '색상 조합 바꾸기'}
                    </p>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {isAdmin && user?.email === adminEmail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center justify-between rounded-xl bg-[var(--bg-card)] px-4 py-3 shadow-[var(--card-shadow)]"
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-red-400">
                <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
              </svg>
              <div>
                <span className="text-sm text-[var(--text-secondary)]">관리자 모드</span>
                <p className="text-xs text-[var(--text-muted)]">리포트 보기와 플래그 관리</p>
              </div>
            </div>
            <button
              onClick={() => setAdminEnabled(!adminEnabled)}
              className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                adminEnabled ? 'bg-red-500' : 'bg-[var(--bg-secondary)]'
              }`}
              role="switch"
              aria-checked={adminEnabled}
              aria-label="관리자 모드 켜기"
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  adminEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </motion.div>
        )}

        {isAdminActive() && (
          <div className="mt-3 overflow-hidden rounded-xl bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
            <div className="flex items-center justify-between border-b border-[var(--border-card)] px-4 py-3">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-red-400">
                  <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.449 6.449 0 0 1 4.271.572 7.948 7.948 0 0 0 5.965.524l2.078-.64A.75.75 0 0 0 18 11.75V3.885a.75.75 0 0 0-.975-.716l-2.296.707a6.449 6.449 0 0 1-4.848-.426 7.948 7.948 0 0 0-5.259-.704L3.5 3.99V2.75Z" />
                </svg>
                <span className="text-xs font-semibold text-red-400">SUBTITLE FLAGS</span>
              </div>
              <span className="text-xs text-[var(--text-muted)]">{flaggedSubtitles.length}건</span>
            </div>
            <div className="flex gap-2 px-4 py-3">
              <button
                onClick={() => {
                  const json = exportFlags()
                  navigator.clipboard.writeText(json).then(() => {
                    window.alert(`${flaggedSubtitles.length}건을 복사했습니다.`)
                  }).catch(() => {
                    window.prompt('플래그 JSON', json)
                  })
                }}
                disabled={flaggedSubtitles.length === 0}
                className="flex-1 rounded-lg bg-red-500/10 py-2 text-xs font-medium text-red-400 transition-transform disabled:cursor-not-allowed disabled:opacity-30 active:scale-95"
              >
                Export ({flaggedSubtitles.length})
              </button>
              <button
                onClick={() => {
                  if (window.confirm('자막 플래그를 전부 지울까요?')) {
                    clearFlags()
                  }
                }}
                disabled={flaggedSubtitles.length === 0}
                className="rounded-lg bg-[var(--bg-secondary)] px-4 py-2 text-xs font-medium text-[var(--text-muted)] transition-transform disabled:cursor-not-allowed disabled:opacity-30 active:scale-95"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <AdminIssuesList />

        <div className="mt-3 overflow-hidden rounded-xl bg-[var(--bg-card)] shadow-[var(--card-shadow)]">
          <Link
            href="/terms"
            className="flex w-full items-center justify-between border-b border-[var(--border-card)] px-4 py-3"
          >
            <span className="text-sm text-[var(--text-secondary)]">이용약관</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[var(--text-muted)]">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
            </svg>
          </Link>
          <Link
            href="/privacy"
            className="flex w-full items-center justify-between px-4 py-3"
          >
            <span className="text-sm text-[var(--text-secondary)]">개인정보처리방침</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-[var(--text-muted)]">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        <div className="mt-4">
          {loading ? null : user ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={signOut}
              className="w-full rounded-xl bg-[var(--bg-card)] py-3 text-sm text-[var(--text-secondary)] shadow-[var(--card-shadow)]"
            >
              로그아웃
            </motion.button>
          ) : (
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => signInWithGoogle('/onboarding')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 font-medium text-black"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google로 로그인
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => signInWithKakao('/onboarding')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3 font-medium text-[#191919]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#191919" d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.01 4.36 6.36l-1.1 4.07c-.08.31.27.55.54.38l4.73-3.12c.48.05.97.08 1.47.08 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" />
                </svg>
                카카오로 로그인
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
