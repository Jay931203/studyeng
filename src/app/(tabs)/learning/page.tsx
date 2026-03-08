'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { DailyMissions } from '@/components/DailyMissions'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { StreakDisplay } from '@/components/StreakDisplay'
import { ViewingStats } from '@/components/ViewingStats'
import { WatchHistory } from '@/components/WatchHistory'
import { useAuth } from '@/hooks/useAuth'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 text-center shadow-[var(--card-shadow)]">
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--text-secondary)]">{label}</p>
    </div>
  )
}

export default function LearningPage() {
  const router = useRouter()
  const { user } = useAuth()
  const streakDays = useUserStore((state) => state.streakDays)
  const { phrases, removePhrase } = usePhraseStore()
  const totalWatched = useWatchHistoryStore((state) => state.watchedVideoIds.length)
  const totalViews = useWatchHistoryStore((state) =>
    Object.values(state.viewCounts).reduce((sum, count) => sum + count, 0),
  )
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const [showAllPhrases, setShowAllPhrases] = useState(false)

  const profileName = useMemo(() => {
    return (
      user?.user_metadata?.full_name ??
      user?.user_metadata?.name ??
      user?.email?.split('@')[0] ??
      '내 프로필'
    )
  }, [user])

  const isEmpty = phrases.length === 0 && totalWatched === 0

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-20 pt-12">
      <div className="px-4">
        <section className="mb-6 rounded-[30px] border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--card-shadow)]">
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
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
                Profile
              </p>
              <h1 className="mt-1 truncate text-2xl font-black text-[var(--text-primary)]">
                {profileName}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                미션, 통계, 시청 기록, 저장한 표현을 여기에서 한 번에 봅니다.
              </p>
            </div>
          </div>
        </section>

        <StreakDisplay days={streakDays} />

        <section className="mt-4 grid grid-cols-3 gap-3">
          <StatCard value={totalViews} label="총 시청" />
          <StatCard value={phrases.length} label="저장 표현" />
          <StatCard value={totalWatched} label="본 영상" />
        </section>

        <div className="mt-6">
          <DailyMissions />
        </div>

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mt-6 rounded-[30px] border border-[var(--border-card)] bg-[var(--bg-card)] px-6 py-12 text-center shadow-[var(--card-shadow)]"
          >
            <p className="text-base font-semibold text-[var(--text-primary)]">
              아직 쌓인 기록이 없습니다
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              영상을 보기 시작하면 진행 상황과 저장한 표현이 여기에 채워집니다.
            </p>
            <button
              onClick={() => router.push('/shorts')}
              className="mt-6 rounded-full bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              영상 보러 가기
            </button>
          </motion.div>
        ) : (
          <>
            <div className="mt-6">
              <ViewingStats />
            </div>

            <WatchHistory />

            <section className="mb-8">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">저장한 표현</h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    쇼츠에서 저장한 문장을 다시 꺼내 보면서 복습 흐름을 이어갈 수 있습니다.
                  </p>
                </div>
                {phrases.length > 3 && (
                  <button
                    onClick={() => setShowAllPhrases((current) => !current)}
                    className="text-xs font-medium text-[var(--accent-text)]"
                  >
                    {showAllPhrases ? '접기' : '전체 보기'}
                  </button>
                )}
              </div>

              {phrases.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border-card)] px-5 py-8 text-center">
                  <p className="text-sm text-[var(--text-secondary)]">
                    쇼츠에서 문장을 두 번 탭하면 여기에 바로 쌓입니다.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {(showAllPhrases ? phrases : phrases.slice(0, 3)).map((phrase) => (
                      <SavedPhraseCard
                        key={phrase.id}
                        phrase={phrase}
                        onDelete={() => removePhrase(phrase.id)}
                        onPlay={() => {
                          clearDeletedFlag(phrase.videoId)
                          router.push(`/shorts?v=${phrase.videoId}`)
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
