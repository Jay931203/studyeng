import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useGameProgressStore } from '@/stores/useGameProgressStore'
import { getLocalizedMeaning } from '@/lib/localeUtils'
import type { SupportedLocale } from '@/stores/useLocaleStore'
import type { ChallengeTransition } from '@/types/level'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExpressionEntry {
  id: string
  canonical?: string
  meaning_ko?: string
  category: string
  cefr: string
  [key: string]: unknown
}

interface IndexMatch {
  exprId: string
  sentenceIdx: number
  en: string
  ko: string
}

export interface ChallengeCard {
  type: 'expression'
  exprId: string
  expression: string
  meaning: string
  cefr: string
  category: string
  contextEn: string | null
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

// Lazily-populated data references
let entries: Record<string, ExpressionEntry> = {}
let index: Record<string, IndexMatch[]> = {}
let _challengeDataLoaded = false
let _challengeDataPromise: Promise<void> | null = null

function loadChallengeData(): Promise<void> {
  if (_challengeDataLoaded) return Promise.resolve()
  if (_challengeDataPromise) return _challengeDataPromise
  _challengeDataPromise = Promise.all([
    import('@/data/expression-entries-v2.json'),
    import('@/data/expression-index-v2.json'),
  ]).then(([ent, idx]) => {
    entries = ent.default as Record<string, ExpressionEntry>
    index = idx.default as Record<string, IndexMatch[]>
    _challengeDataLoaded = true
    _contextCache = null // Reset cache
  })
  return _challengeDataPromise
}

// Kick off loading immediately
if (typeof window !== 'undefined') {
  loadChallengeData()
}

const CHALLENGE_CARD_COUNT = 20
const MAX_CATEGORY_RATIO = 0.3

// ---------------------------------------------------------------------------
// CEFR distribution per challenge level
// ---------------------------------------------------------------------------

interface CefrDistribution {
  levels: { cefr: string; ratio: number }[]
  includeContext: boolean
  relaxCategoryCap?: boolean
  fallbackCefr?: string
}

const CHALLENGE_DISTRIBUTIONS: Record<ChallengeTransition, CefrDistribution> = {
  A2: {
    levels: [{ cefr: 'A2', ratio: 1.0 }],
    includeContext: true,
  },
  B1: {
    levels: [
      { cefr: 'A2', ratio: 0.4 },
      { cefr: 'B1', ratio: 0.6 },
    ],
    includeContext: true,
  },
  B2: {
    levels: [
      { cefr: 'B1', ratio: 0.3 },
      { cefr: 'B2', ratio: 0.7 },
    ],
    includeContext: true,
  },
  C1: {
    levels: [
      { cefr: 'B2', ratio: 0.3 },
      { cefr: 'C1', ratio: 0.7 },
    ],
    includeContext: false,
  },
  C2: {
    levels: [
      { cefr: 'C1', ratio: 0.3 },
      { cefr: 'C2', ratio: 0.7 },
    ],
    includeContext: false,
    relaxCategoryCap: true,
    fallbackCefr: 'C1',
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Context sentence lookup (cached)
let _contextCache: Record<string, IndexMatch[]> | null = null

function getContextByExprId(): Record<string, IndexMatch[]> {
  if (_contextCache) return _contextCache
  const map: Record<string, IndexMatch[]> = {}
  for (const matches of Object.values(index)) {
    for (const m of matches) {
      if (!map[m.exprId]) map[m.exprId] = []
      map[m.exprId].push(m)
    }
  }
  _contextCache = map
  return map
}

function pickContextSentence(exprId: string): string | null {
  const ctx = getContextByExprId()
  const matches = ctx[exprId]
  if (!matches || matches.length === 0) return null
  const pick = matches[Math.floor(Math.random() * matches.length)]
  return pick.en
}

// ---------------------------------------------------------------------------
// Main selection function
// ---------------------------------------------------------------------------

export function selectChallengeCards(
  targetLevel: ChallengeTransition,
  locale: SupportedLocale = 'ko',
): ChallengeCard[] {
  const distribution = CHALLENGE_DISTRIBUTIONS[targetLevel]
  const familiarityState = useFamiliarityStore.getState()
  const gameState = useGameProgressStore.getState()

  // Get mastered expressions (Leitner Box 3)
  const masteredSet = new Set(gameState.getMasteredExpressions())

  // Group expressions by CEFR
  const cefrPools: Record<string, string[]> = {}
  for (const [id, entry] of Object.entries(entries)) {
    const cefr = entry.cefr?.toUpperCase()
    if (!cefr) continue
    if (!cefrPools[cefr]) cefrPools[cefr] = []
    cefrPools[cefr].push(id)
  }

  // Select cards per CEFR ratio
  const selected: string[] = []
  const usedSet = new Set<string>()

  for (const { cefr, ratio } of distribution.levels) {
    const targetCount = Math.round(CHALLENGE_CARD_COUNT * ratio)
    const pool = cefrPools[cefr] ?? []

    // Filter with bias removal
    const filtered = pool.filter((id) => {
      if (usedSet.has(id)) return false

      // Familiar expressions (count >= 3): 50% chance of exclusion
      const familiarCount = familiarityState.getFamiliarCount(id)
      if (familiarCount >= 3 && Math.random() < 0.5) return false

      // Leitner Box 3 mastered: 50% chance of exclusion
      if (masteredSet.has(id) && Math.random() < 0.5) return false

      return true
    })

    const shuffled = shuffle(filtered)
    let added = 0
    for (const id of shuffled) {
      if (added >= targetCount) break
      selected.push(id)
      usedSet.add(id)
      added++
    }

    // If not enough after filtering, pull from unfiltered pool
    if (added < targetCount) {
      const remaining = pool.filter((id) => !usedSet.has(id))
      const shuffledRemaining = shuffle(remaining)
      for (const id of shuffledRemaining) {
        if (added >= targetCount) break
        selected.push(id)
        usedSet.add(id)
        added++
      }
    }
  }

  // C1->C2 fallback: if not enough cards, supplement from fallback CEFR
  if (distribution.fallbackCefr && selected.length < CHALLENGE_CARD_COUNT) {
    const fallbackPool = (cefrPools[distribution.fallbackCefr] ?? []).filter((id) => !usedSet.has(id))
    const shuffledFallback = shuffle(fallbackPool)
    for (const id of shuffledFallback) {
      if (selected.length >= CHALLENGE_CARD_COUNT) break
      selected.push(id)
      usedSet.add(id)
    }
  }

  // Category diversity check
  const maxCategoryCount = Math.floor(
    CHALLENGE_CARD_COUNT * (distribution.relaxCategoryCap ? 0.4 : MAX_CATEGORY_RATIO),
  )
  const categoryCounts: Record<string, number> = {}
  const diverseSelected: string[] = []
  const overflow: string[] = []

  for (const id of selected) {
    const entry = entries[id]
    const cat = entry?.category ?? 'unknown'
    const current = categoryCounts[cat] ?? 0
    if (current >= maxCategoryCount) {
      overflow.push(id)
    } else {
      diverseSelected.push(id)
      categoryCounts[cat] = current + 1
    }
  }

  // Replace overflow with expressions from other categories
  if (overflow.length > 0) {
    const allCefrs = distribution.levels.map((l) => l.cefr)
    const replacementPool = Object.entries(entries)
      .filter(([id, entry]) => {
        if (usedSet.has(id)) return false
        const cefr = entry.cefr?.toUpperCase()
        if (!allCefrs.includes(cefr)) return false
        const cat = entry.category ?? 'unknown'
        return (categoryCounts[cat] ?? 0) < maxCategoryCount
      })
      .map(([id]) => id)

    const shuffledReplacements = shuffle(replacementPool)
    let replaceIdx = 0
    for (const id of shuffledReplacements) {
      if (replaceIdx >= overflow.length) break
      const entry = entries[id]
      const cat = entry?.category ?? 'unknown'
      if ((categoryCounts[cat] ?? 0) < maxCategoryCount) {
        diverseSelected.push(id)
        usedSet.add(id)
        categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1
        replaceIdx++
      }
    }

    // If still not enough, add overflow back
    if (replaceIdx < overflow.length) {
      diverseSelected.push(...overflow.slice(replaceIdx))
    }
  }

  // Build card data
  const includeContext = distribution.includeContext

  const cards: ChallengeCard[] = diverseSelected.slice(0, CHALLENGE_CARD_COUNT).map((exprId) => {
    const entry = entries[exprId]
    return {
      type: 'expression' as const,
      exprId,
      expression: entry?.canonical ?? exprId,
      meaning: entry ? getLocalizedMeaning(entry, locale) : '',
      cefr: entry?.cefr?.toUpperCase() ?? 'B1',
      category: entry?.category ?? '',
      contextEn: includeContext ? pickContextSentence(exprId) : null,
    }
  })

  return shuffle(cards)
}
