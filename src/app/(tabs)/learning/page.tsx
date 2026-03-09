'use client'

import Link from 'next/link'
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

  const isEmpty = phrases.length === 0 && totalWatched === 0

  return (
    <AppPage>
      <DailyMissions />
      <div className="mt-6 space-y-6">
        {isEmpty ? (
          <SurfaceCard className="px-6 py-12 text-center">
            <p className="text-lg font-semibold text-[var(--text-primary)]">NO RECORDS</p>
            <button
              onClick={() => router.push('/shorts')}
              className="mt-6 rounded-full bg-[var(--accent-primary)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              SHORTS
            </button>
          </SurfaceCard>
        ) : (
          <WatchHistory />
        )}

        <SurfaceCard className="p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
              SAVED
            </p>
            {phrases.length > 3 && (
              <Link
                href="/learning/saved"
                className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]"
              >
                VIEW ALL
              </Link>
            )}
          </div>

          {phrases.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--border-card)] px-5 py-8 text-center">
              <p className="text-sm text-[var(--text-secondary)]">No saved items yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {phrases.slice(0, 3).map((phrase) => (
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
