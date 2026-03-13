import expressionEntriesData from '@/data/expression-entries-v2.json'
import expressionIndexData from '@/data/expression-index-v2.json'
import { useFamiliarityStore } from '@/stores/useFamiliarityStore'
import { useGameProgressStore } from '@/stores/useGameProgressStore'

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
  meaningKo: string
  cefr: string
  category: string
  contextEn: string | null
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const entries = expressionEntriesData as Record<string, ExpressionEntry>
const index = expressionIndexData as Record<string, IndexMatch[]>

const CHALLENGE_CARD_COUNT = 20
const MAX_CATEGORY_RATIO = 0.3

// ---------------------------------------------------------------------------
// CEFR distribution per challenge level
// ---------------------------------------------------------------------------

interface CefrDistribution {
  levels: { cefr: string; ratio: number }[]
}

const CHALLENGE_DISTRIBUTIONS: Record<'intermediate' | 'advanced', CefrDistribution> = {
  intermediate: {
    levels: [
      { cefr: 'A2', ratio: 0.5 },
      { cefr: 'B1', ratio: 0.5 },
    ],
  },
  advanced: {
    levels: [
      { cefr: 'B2', ratio: 0.6 },
      { cefr: 'C1', ratio: 0.4 },
    ],
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
  targetLevel: 'intermediate' | 'advanced',
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

  // Category diversity check: no single category > 30%
  const maxCategoryCount = Math.floor(CHALLENGE_CARD_COUNT * MAX_CATEGORY_RATIO)
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
  // For intermediate challenge: include context sentences
  // For advanced challenge: no context sentences (harder)
  const includeContext = targetLevel === 'intermediate'

  const cards: ChallengeCard[] = diverseSelected.slice(0, CHALLENGE_CARD_COUNT).map((exprId) => {
    const entry = entries[exprId]
    return {
      type: 'expression' as const,
      exprId,
      expression: entry?.canonical ?? exprId,
      meaningKo: entry?.meaning_ko ?? '',
      cefr: entry?.cefr?.toUpperCase() ?? 'B1',
      category: entry?.category ?? '',
      contextEn: includeContext ? pickContextSentence(exprId) : null,
    }
  })

  return shuffle(cards)
}
