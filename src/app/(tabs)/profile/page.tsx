'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useUserStore } from '@/stores/useUserStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useAuth } from '@/hooks/useAuth'
import { useThemeStore } from '@/stores/useThemeStore'
import { useAdminStore } from '@/stores/useAdminStore'
import { useOnboardingStore } from '@/stores/useOnboardingStore'
import { StreakDisplay } from '@/components/StreakDisplay'

function AnimatedStat({ value, label }: { value: number; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03 }}
      className="bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl p-4 text-center"
    >
      <motion.p
        key={value}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="text-[var(--text-primary)] text-2xl font-bold"
      >
        {value}
      </motion.p>
      <p className="text-[var(--text-secondary)] text-xs">{label}</p>
    </motion.div>
  )
}

export default function ProfilePage() {
  const { streakDays } = useUserStore()
  const phraseCount = usePhraseStore((s) => s.phrases.length)
  const totalWatched = useWatchHistoryStore((s) => s.watchedVideoIds.length)
  const totalViews = useWatchHistoryStore((s) =>
    Object.values(s.viewCounts).reduce((sum, c) => sum + c, 0)
  )
  const { user, signInWithGoogle, signInWithKakao, signOut, loading } = useAuth()
  const { theme, toggleTheme } = useThemeStore()
  const { isAdmin, setAdmin, flaggedSubtitles, exportFlags, clearFlags } = useAdminStore()
  const { hasSeenWelcome, markWelcomeSeen } = useOnboardingStore()

  const isNewUser = totalViews === 0 && phraseCount === 0 && streakDays === 0

  useEffect(() => {
    if (isNewUser && !hasSeenWelcome) {
      markWelcomeSeen()
    }
  }, [isNewUser, hasSeenWelcome, markWelcomeSeen])

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        {/* Avatar + name */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 mb-6"
        >
          <motion.div
            whileTap={{ scale: 0.95 }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl overflow-hidden shadow-lg shadow-blue-500/20"
          >
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-8 h-8">
                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
              </svg>
            )}
          </motion.div>
          <div>
            <p className="text-[var(--text-primary)] font-bold text-lg">
              {user?.user_metadata?.full_name ?? '게스트'}
            </p>
            {isNewUser && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">
                새로운 학습자
              </span>
            )}
          </div>
        </motion.div>

        {/* Streak */}
        <StreakDisplay days={streakDays} />

        {/* Welcome prompt for new users — shown only once */}
        {isNewUser && !hasSeenWelcome && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-5 border border-blue-500/10"
          >
            <p className="text-[var(--text-primary)] font-bold text-sm mb-1">
              영어, 재밌게 시작해보세요
            </p>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed">
              영상을 보고, 표현을 저장하며 재밌게 영어를 배워보세요
            </p>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <AnimatedStat value={totalViews} label="총 시청" />
          <AnimatedStat value={phraseCount} label="저장한 표현" />
          <AnimatedStat value={totalWatched} label="본 영상" />
        </div>

        {/* Theme toggle */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={toggleTheme}
          className="w-full mt-6 py-3 bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl flex items-center justify-between px-4"
        >
          <span className="text-[var(--text-secondary)] text-sm">테마</span>
          <span className="text-[var(--text-primary)] text-sm font-medium">
            {theme === 'dark' ? '다크 모드' : '라이트 모드'}
          </span>
        </motion.button>

        {/* Admin panel - only visible when admin mode is active */}
        {isAdmin && (
          <div className="mt-3 bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-card)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-400">
                  <path d="M3.5 2.75a.75.75 0 0 0-1.5 0v14.5a.75.75 0 0 0 1.5 0v-4.392l1.657-.348a6.449 6.449 0 0 1 4.271.572 7.948 7.948 0 0 0 5.965.524l2.078-.64A.75.75 0 0 0 18 11.75V3.885a.75.75 0 0 0-.975-.716l-2.296.707a6.449 6.449 0 0 1-4.848-.426 7.948 7.948 0 0 0-5.259-.704L3.5 3.99V2.75Z" />
                </svg>
                <span className="text-red-400 text-xs font-semibold">ADMIN</span>
              </div>
              <span className="text-[var(--text-muted)] text-xs">
                {flaggedSubtitles.length}건 플래그
              </span>
            </div>
            <div className="px-4 py-3 flex gap-2">
              <button
                onClick={() => {
                  const json = exportFlags()
                  navigator.clipboard.writeText(json).then(() => {
                    alert(`${flaggedSubtitles.length}건 복사됨`)
                  }).catch(() => {
                    // Fallback: show in prompt for manual copy
                    prompt('JSON 복사:', json)
                  })
                }}
                disabled={flaggedSubtitles.length === 0}
                className="flex-1 py-2 bg-red-500/10 text-red-400 rounded-lg text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
              >
                Export ({flaggedSubtitles.length})
              </button>
              <button
                onClick={() => {
                  if (confirm('모든 플래그를 삭제하시겠습니까?')) {
                    clearFlags()
                  }
                }}
                disabled={flaggedSubtitles.length === 0}
                className="py-2 px-4 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded-lg text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
              >
                Clear
              </button>
              <button
                onClick={() => setAdmin(false)}
                className="py-2 px-4 bg-[var(--bg-secondary)] text-[var(--text-muted)] rounded-lg text-xs font-medium active:scale-95 transition-transform"
              >
                Off
              </button>
            </div>
          </div>
        )}

        {/* Legal links */}
        <div className="mt-3 bg-[var(--bg-card)] shadow-[var(--card-shadow)] rounded-xl overflow-hidden">
          <Link
            href="/terms"
            className="w-full py-3 flex items-center justify-between px-4 border-b border-[var(--border-card)]"
          >
            <span className="text-[var(--text-secondary)] text-sm">이용약관</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[var(--text-muted)]">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </Link>
          <Link
            href="/privacy"
            className="w-full py-3 flex items-center justify-between px-4"
          >
            <span className="text-[var(--text-secondary)] text-sm">개인정보처리방침</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[var(--text-muted)]">
              <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>

        <div className="mt-4">
          {loading ? null : user ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={signOut}
              className="w-full py-3 bg-[var(--bg-card)] shadow-[var(--card-shadow)] text-[var(--text-secondary)] rounded-xl text-sm"
            >
              로그아웃
            </motion.button>
          ) : (
            <div className="space-y-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={signInWithGoogle}
                className="w-full py-3 bg-white text-black rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google로 로그인
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={signInWithKakao}
                className="w-full py-3 bg-[#FEE500] text-[#191919] rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
