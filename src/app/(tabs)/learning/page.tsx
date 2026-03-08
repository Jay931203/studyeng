'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { DailyMissions } from '@/components/DailyMissions'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { WatchHistory } from '@/components/WatchHistory'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { getCatalogVideoById } from '@/lib/catalog'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

export default function LearningPage() {
  const router = useRouter()
  const { phrases, removePhrase } = usePhraseStore()
  const totalWatched = useWatchHistoryStore((state) => state.watchedVideoIds.length)
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const [showAllPhrases, setShowAllPhrases] = useState(false)

  const isEmpty = phrases.length === 0 && totalWatched === 0

  return (
    <AppPage>
      <DailyMissions />
      <div className="mt-6 space-y-6">
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
          <WatchHistory />
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
                      const seriesId = getCatalogVideoById(phrase.videoId)?.seriesId
                      const baseUrl = buildShortsUrl(phrase.videoId, seriesId)
                      const separator = baseUrl.includes('?') ? '&' : '?'
                      const url = `${baseUrl}${separator}t=${phrase.timestampStart}&phraseId=${phrase.id}`
                      router.push(url)
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </SurfaceCard>
      </div>
    </AppPage>
  )
}
