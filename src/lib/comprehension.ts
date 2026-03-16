import expressionIndex from '@/data/expression-index-v3.json'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'

const exprIndex = expressionIndex as Record<
  string,
  Array<{ exprId: string; sentenceIdx: number; en: string; ko: string; surfaceForm: string }>
>

export interface VideoComprehension {
  total: number
  known: number
  percentage: number
  unknownExprs: string[]
}

/**
 * Calculate what % of expressions in a video the user already knows.
 * Uses useFamiliarityStore snapshot (call from React or getState()).
 */
export function getVideoComprehension(videoId: string): VideoComprehension {
  const entries = exprIndex[videoId]
  if (!entries || entries.length === 0) {
    return { total: 0, known: 0, percentage: 0, unknownExprs: [] }
  }

  // Deduplicate expression IDs (same expr can appear multiple times in one video)
  const uniqueExprIds = [...new Set(entries.map((e) => e.exprId))]
  const total = uniqueExprIds.length

  const familiarityState = useFamiliarityStore.getState()
  const unknownExprs: string[] = []
  let known = 0

  for (const exprId of uniqueExprIds) {
    if (familiarityState.isFamiliar(exprId)) {
      known += 1
    } else {
      unknownExprs.push(exprId)
    }
  }

  const percentage = total > 0 ? Math.round((known / total) * 100) : 0

  return { total, known, percentage, unknownExprs }
}

// Cache layer: memoize per videoId, invalidated when familiarity version changes
let cachedFamiliarityVersion = 0
const comprehensionCache = new Map<string, VideoComprehension>()

/**
 * Cached version of getVideoComprehension.
 * Pass a familiarityVersion number that changes when familiarity data changes
 * (e.g. Object.keys(entries).length or a counter).
 */
export function getCachedVideoComprehension(
  videoId: string,
  familiarityVersion: number,
): VideoComprehension {
  if (familiarityVersion !== cachedFamiliarityVersion) {
    comprehensionCache.clear()
    cachedFamiliarityVersion = familiarityVersion
  }

  const cached = comprehensionCache.get(videoId)
  if (cached) return cached

  const result = getVideoComprehension(videoId)
  comprehensionCache.set(videoId, result)
  return result
}

/**
 * Check if a video has enough expressions to show a comprehension badge.
 */
export function hasEnoughExpressions(videoId: string): boolean {
  const entries = exprIndex[videoId]
  if (!entries) return false
  const uniqueCount = new Set(entries.map((e) => e.exprId)).size
  return uniqueCount >= 3
}
