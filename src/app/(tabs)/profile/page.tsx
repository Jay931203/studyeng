'use client'

import { useUserStore } from '@/stores/useUserStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useAuth } from '@/hooks/useAuth'
import { StreakDisplay } from '@/components/StreakDisplay'
import { calculateXpForLevel } from '@/lib/gamification'

export default function ProfilePage() {
  const { level, xp, streakDays } = useUserStore()
  const phraseCount = usePhraseStore((s) => s.phrases.length)
  const { user, signInWithGoogle, signOut, loading } = useAuth()

  const xpForNextLevel = calculateXpForLevel(level)
  const xpProgress = (xp / xpForNextLevel) * 100

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl overflow-hidden">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="avatar"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              '\uD83D\uDC64'
            )}
          </div>
          <div>
            <p className="text-white font-bold text-lg">
              {user?.user_metadata?.full_name ?? '게스트'}
            </p>
            <p className="text-gray-400 text-sm">레벨 {level}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>경험치</span>
            <span>{xp} / {xpForNextLevel}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        <StreakDisplay days={streakDays} />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-white text-2xl font-bold">{phraseCount}</p>
            <p className="text-gray-400 text-xs">저장한 표현</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4 text-center">
            <p className="text-white text-2xl font-bold">{level}</p>
            <p className="text-gray-400 text-xs">현재 레벨</p>
          </div>
        </div>

        <div className="mt-8">
          {loading ? null : user ? (
            <button
              onClick={signOut}
              className="w-full py-3 bg-white/5 text-gray-400 rounded-xl text-sm"
            >
              로그아웃
            </button>
          ) : (
            <button
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
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
