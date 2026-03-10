'use client'

import { AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { SavedPhraseCard } from '@/components/SavedPhraseCard'
import { AppPage, SurfaceCard } from '@/components/ui/AppPage'
import { getCatalogVideoById } from '@/lib/catalog'
import { createHiddenVideoIdSet, filterHiddenItemsByVideoId } from '@/lib/videoVisibility'
import { buildShortsUrl } from '@/lib/videoRoutes'
import { useAdminStore } from '@/stores/useAdminStore'
import type { SavedPhrase } from '@/stores/usePhraseStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'

function formatDateLabel(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24))
  const calendarLabel =
    date.getFullYear() === now.getFullYear()
      ? `${date.getMonth() + 1}/${date.getDate()}`
      : `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`

  if (diffDays === 0) return `TODAY · ${calendarLabel}`
  if (diffDays === 1) return `YESTERDAY · ${calendarLabel}`
  return calendarLabel
}

function getDateKey(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export default function SavedPhrasesPage() {
  const router = useRouter()
  const { phrases, removePhrase } = usePhraseStore()
  const clearDeletedFlag = useWatchHistoryStore((state) => state.clearDeletedFlag)
  const hiddenVideos = useAdminStore((state) => state.hiddenVideos)
  const hiddenVideoIdSet = useMemo(() => createHiddenVideoIdSet(hiddenVideos), [hiddenVideos])
  const visiblePhrases = useMemo(
    () => filterHiddenItemsByVideoId(phrases, hiddenVideoIdSet),
    [hiddenVideoIdSet, phrases],
  )

  const groupedPhrases = useMemo(() => {
    const groups: { label: string; key: string; phrases: SavedPhrase[] }[] = []
    const seen = new Set<string>()

    for (const phrase of visiblePhrases) {
      const dateKey = getDateKey(phrase.savedAt)

      if (!seen.has(dateKey)) {
        seen.add(dateKey)
        groups.push({
          label: formatDateLabel(phrase.savedAt),
          key: dateKey,
          phrases: [],
        })
      }

      const group = groups.find((item) => item.key === dateKey)
      group?.phrases.push(phrase)
    }

    return groups
  }, [visiblePhrases])

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }

    router.replace('/learning')
  }

  return (
    <AppPage>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="text-[var(--text-secondary)] transition-transform active:scale-90"
            aria-label="Back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--accent-text)]">
            SAVED
          </p>
        </div>

        <SurfaceCard className="p-5">
          {visiblePhrases.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[var(--border-card)] px-5 py-10 text-center">
              <p className="text-sm text-[var(--text-secondary)]">No saved items yet.</p>
            </div>
          ) : (
            groupedPhrases.map((group) => (
              <div key={group.key} className="mb-5 last:mb-0">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  {group.label}
                </p>
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {group.phrases.map((phrase) => (
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
              </div>
            ))
          )}
        </SurfaceCard>
      </div>
    </AppPage>
  )
}
