'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { DailyMissions } from '@/components/DailyMissions'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { StreakDisplay } from '@/components/StreakDisplay'
import { ViewingStats } from '@/components/ViewingStats'
import { WatchHistory } from '@/components/WatchHistory'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { useAuth } from '@/hooks/useAuth'
import { getCatalogVideoById } from '@/lib/catalog'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useUserStore } from '@/stores/useUserStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

export default function LearningPage() {
  const router = useRouter()
  const { user } = useAuth()
  const streakDays = useUserStore((state) => state.streakDays)
  const { phrases, removePhrase, incrementReview } = usePhraseStore()
  const totalWatched = useWatchHistoryStore((state) => state.watchedVideoIds.length)
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const [showAllPhrases, setShowAllPhrases] = useState(false)

  const profileName = useMemo(() => {
    return (
      user?.user_metadata?.full_name ??
      user?.user_metadata?.name ??
      user?.email?.split('@')[0] ??
      '게스트'
    )
  }, [user])

  const isEmpty = phrases.length === 0 && totalWatched === 0

  return (
    <AppPage>
        <div className="mb-6 flex items-center justify-end">
          <button
            onClick={() => router.push('/shorts')}
            className="rounded-full bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Feed
          </button>
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
          <SurfaceCard className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
              오늘 상태
            </p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-2xl font-bold text-white">
                {profileName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-[var(--text-secondary)]">현재 계정</p>
                <h2 className="truncate text-2xl font-bold text-[var(--text-primary)]">
                  {profileName}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {isEmpty
                    ? '아직 쌓인 기록이 없습니다. 몇 장면만 보면 바로 채워집니다.'
                    : '쌓인 기록이 많을수록 다음 장면이 더 정확하게 붙습니다.'}
                </p>
              </div>
            </div>

          </SurfaceCard>

          <StreakDisplay days={streakDays} />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
          <div className="space-y-6">
            <DailyMissions />
            {!isEmpty && <ViewingStats />}
          </div>

          <div className="space-y-6">
            {isEmpty ? (
              <SurfaceCard className="px-6 py-12 text-center">
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  아직 쌓인 기록이 없습니다
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                  장면을 보기 시작하면 시청 기록과 저장 표현이 이 화면에 자동으로 쌓입니다.
                </p>
                <button
                  onClick={() => router.push('/shorts')}
                  className="mt-6 rounded-full bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  첫 장면 보러 가기
                </button>
              </SurfaceCard>
            ) : (
              <>
                <WatchHistory />
              </>
            )}

            <SurfaceCard className="p-5">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-text)]">
                    저장 표현
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)]">
                    다시 볼 표현
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    짧은 대사만 따로 남겨뒀다가 다시 꺼내볼 수 있습니다.
                  </p>
                </div>
                {phrases.length > 3 && (
                  <button
                    onClick={() => setShowAllPhrases((current) => !current)}
                    className="text-sm font-medium text-[var(--accent-text)]"
                  >
                    {showAllPhrases ? '접기' : '전체 보기'}
                  </button>
                )}
              </div>

              {phrases.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-[var(--border-card)] px-5 py-8 text-center">
                  <p className="text-sm text-[var(--text-secondary)]">
                    장면에서 문장을 저장하면 여기에 쌓입니다.
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
                          incrementReview(phrase.id)
                          const seriesId = getCatalogVideoById(phrase.videoId)?.seriesId
                          const baseUrl = buildShortsUrl(phrase.videoId, seriesId)
                          const separator = baseUrl.includes('?') ? '&' : '?'
                          const url = `${baseUrl}${separator}t=${phrase.timestampStart}`
                          router.push(url)
                        }}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </SurfaceCard>
          </div>
        </div>
    </AppPage>
  )
}
