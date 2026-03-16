'use client'

import { useEffect, useRef } from 'react'
import { getVideoComprehension, hasEnoughExpressions } from '@/lib/comprehension'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useUserStore } from '@/stores/useUserStore'

const SCENE_COMPLETE_XP = 5
const STORAGE_KEY = 'studyeng-scene-complete'

/** Track which videos have already awarded scene-complete bonus */
function getAwardedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

function markAwarded(videoId: string) {
  const set = getAwardedSet()
  set.add(videoId)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
  } catch {
    // quota exceeded — ignore
  }
}

/**
 * Hook that checks if a video has reached 100% comprehension
 * and awards bonus XP once.
 *
 * Call this in any component that shows a video's comprehension state.
 */
export function useSceneCompleteReward(videoId: string) {
  const entries = useFamiliarityStore((s) => s.entries)
  const awardedRef = useRef(false)

  useEffect(() => {
    if (awardedRef.current) return
    if (!hasEnoughExpressions(videoId)) return

    const comp = getVideoComprehension(videoId)
    if (comp.percentage < 100) return

    const awarded = getAwardedSet()
    if (awarded.has(videoId)) return

    awardedRef.current = true
    markAwarded(videoId)
    useUserStore.getState().gainXp(SCENE_COMPLETE_XP, 'Scene Complete bonus')
  }, [videoId, entries])
}
