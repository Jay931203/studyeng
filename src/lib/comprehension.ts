import { useFamiliarityStore } from '@/stores/useFamiliarityStore'

type ExprIndexRow = { exprId: string; sentenceIdx: number; en: string; ko: string; surfaceForm: string }

// Lazy-loaded expression index
let _exprIndex: Record<string, ExprIndexRow[]> | null = null
let _loadPromise: Promise<void> | null = null

function ensureLoaded(): Promise<void> {
  if (_exprIndex) return Promise.resolve()
  if (!_loadPromise) {
    _loadPromise = import('@/data/expression-index-v3.json').then((m) => {
      _exprIndex = m.default as Record<string, ExprIndexRow[]>
    })
  }
  return _loadPromise
}

// Kick off loading immediately (non-blocking)
if (typeof window !== 'undefined') {
  ensureLoaded()
}

export interface VideoComprehension {
  total: number
  known: number
  percentage: number
  unknownExprs: string[]
}

/**
 * Calculate what % of expressions in a video the user already knows.
 * Uses useFamiliarityStore snapshot (call from React or getState()).
 * Returns zero result if data hasn't loaded yet.
 */
export function getVideoComprehension(videoId: string): VideoComprehension {
  if (!_exprIndex) return { total: 0, known: 0, percentage: 0, unknownExprs: [] }
  const entries = _exprIndex[videoId]
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
  if (!_exprIndex) return false
  const entries = _exprIndex[videoId]
  if (!entries) return false
  const uniqueCount = new Set(entries.map((e) => e.exprId)).size
  return uniqueCount >= 3
}
