'use client'

import { useEffect } from 'react'
import { useUserStore } from '@/stores/useUserStore'
import { usePhraseStore } from '@/stores/usePhraseStore'
import { useWatchHistoryStore } from '@/stores/useWatchHistoryStore'
import { useBadgeStore } from '@/stores/useBadgeStore'

/**
 * Reactive badge checker hook.
 * Reads all relevant stores and calls checkBadges() whenever
 * any tracked value changes.
 *
 * Mount once in the tabs layout.
 */
export function useBadgeChecker() {
  const level = useUserStore((s) => s.level)
  const streakDays = useUserStore((s) => s.streakDays)
  const phrasesSaved = usePhraseStore((s) => s.phrases.length)
  const videosWatched = useWatchHistoryStore((s) => s.watchedVideoIds.length)
  const gamesCleared = useBadgeStore((s) => s.gamesCleared)
  const checkBadges = useBadgeStore((s) => s.checkBadges)

  useEffect(() => {
    checkBadges({
      videosWatched,
      streakDays,
      gamesCleared,
      phrasesSaved,
      level,
    })
  }, [videosWatched, streakDays, gamesCleared, phrasesSaved, level, checkBadges])
}
