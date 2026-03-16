/**
 * expressionWeb.ts
 *
 * Expression connection graph — finds related expressions via shared root verbs,
 * themes, categories, and CEFR levels. Powers the "Expression Web" UI and
 * learning path generation.
 *
 * Data: expression-entries-v2.json + expression-index-v3.json
 */

import expressionEntriesData from '../data/expression-entries-v2.json'
import expressionIndexData from '../data/expression-index-v3.json'
import type { ExpressionEntry } from './expressionLookup'

// ---------------------------------------------------------------------------
// Internal data
// ---------------------------------------------------------------------------

const entries = expressionEntriesData as Record<string, ExpressionEntry>
const videoIndex = expressionIndexData as Record<string, { exprId: string; sentenceIdx: number; en: string; ko: string }[]>

// ---------------------------------------------------------------------------
// Pre-computed indexes (built once on first access)
// ---------------------------------------------------------------------------

let _rootIndex: Map<string, string[]> | null = null
let _themeIndex: Map<string, string[]> | null = null
let _categoryIndex: Map<string, string[]> | null = null
let _cefrIndex: Map<string, string[]> | null = null
let _exprToVideos: Map<string, string[]> | null = null

function getRootIndex(): Map<string, string[]> {
  if (_rootIndex) return _rootIndex
  _rootIndex = new Map()
  for (const entry of Object.values(entries)) {
    const root = extractRootVerb(entry.canonical, entry.category)
    if (!root) continue
    const existing = _rootIndex.get(root)
    if (existing) {
      existing.push(entry.id)
    } else {
      _rootIndex.set(root, [entry.id])
    }
  }
  return _rootIndex
}

function getThemeIndex(): Map<string, string[]> {
  if (_themeIndex) return _themeIndex
  _themeIndex = new Map()
  for (const entry of Object.values(entries)) {
    for (const theme of entry.theme ?? []) {
      const existing = _themeIndex.get(theme)
      if (existing) {
        existing.push(entry.id)
      } else {
        _themeIndex.set(theme, [entry.id])
      }
    }
  }
  return _themeIndex
}

function getCategoryIndex(): Map<string, string[]> {
  if (_categoryIndex) return _categoryIndex
  _categoryIndex = new Map()
  for (const entry of Object.values(entries)) {
    const existing = _categoryIndex.get(entry.category)
    if (existing) {
      existing.push(entry.id)
    } else {
      _categoryIndex.set(entry.category, [entry.id])
    }
  }
  return _categoryIndex
}

function getCefrIndex(): Map<string, string[]> {
  if (_cefrIndex) return _cefrIndex
  _cefrIndex = new Map()
  for (const entry of Object.values(entries)) {
    const cefr = entry.cefr.toUpperCase()
    const existing = _cefrIndex.get(cefr)
    if (existing) {
      existing.push(entry.id)
    } else {
      _cefrIndex.set(cefr, [entry.id])
    }
  }
  return _cefrIndex
}

function getExprToVideos(): Map<string, string[]> {
  if (_exprToVideos) return _exprToVideos
  _exprToVideos = new Map()
  for (const [videoId, rows] of Object.entries(videoIndex)) {
    for (const row of rows) {
      const existing = _exprToVideos.get(row.exprId)
      if (existing) {
        if (!existing.includes(videoId)) existing.push(videoId)
      } else {
        _exprToVideos.set(row.exprId, [videoId])
      }
    }
  }
  return _exprToVideos
}

// ---------------------------------------------------------------------------
// Root verb extraction
// ---------------------------------------------------------------------------

/**
 * Extract the root verb from an expression. Works for phrasal verbs,
 * collocations, and idioms where the first word is a common verb.
 *
 * For phrasal_verb and collocation: always extract first word.
 * For idiom: only extract if first word is a known common verb
 * (to avoid false groupings like "a piece of cake" -> "a").
 */
function extractRootVerb(canonical: string, category: string): string | null {
  const parts = canonical.toLowerCase().split(/\s+/)
  if (parts.length < 2) return null

  const firstWord = parts[0]
  // Skip very short or common non-verb starters
  if (firstWord.length < 2) return null

  const SKIP_WORDS = new Set(['a', 'an', 'the', 'my', 'no', 'on', 'in', 'at', 'to', 'of', 'it', 'be', 'is'])
  if (SKIP_WORDS.has(firstWord)) return null

  // For phrasal_verb and collocation, first word is almost always the verb
  if (category === 'phrasal_verb' || category === 'collocation') {
    return firstWord
  }

  // For idioms, only extract if first word is a known common verb
  // (prevents false groupings from articles/prepositions in idiom names)
  if (category === 'idiom') {
    const COMMON_VERBS = new Set([
      'break', 'bring', 'call', 'come', 'cut', 'do', 'fall', 'get', 'give', 'go',
      'hang', 'have', 'hold', 'keep', 'kick', 'knock', 'lay', 'let', 'look', 'make',
      'miss', 'pass', 'pick', 'play', 'pull', 'push', 'put', 'run', 'set', 'shut',
      'sit', 'stand', 'take', 'throw', 'turn', 'walk', 'work',
    ])
    if (COMMON_VERBS.has(firstWord)) return firstWord
  }

  return null
}

// ---------------------------------------------------------------------------
// Scoring: how related is one expression to another?
// ---------------------------------------------------------------------------

interface RelationScore {
  exprId: string
  score: number
  reasons: RelationReason[]
}

type RelationReason = 'same_root' | 'same_theme' | 'same_category' | 'same_cefr'

function computeRelationScore(sourceId: string, targetId: string): RelationScore | null {
  if (sourceId === targetId) return null

  const source = entries[sourceId]
  const target = entries[targetId]
  if (!source || !target) return null

  let score = 0
  const reasons: RelationReason[] = []

  // Same root verb (strongest signal for phrasal verbs)
  const sourceRoot = extractRootVerb(source.canonical, source.category)
  const targetRoot = extractRootVerb(target.canonical, target.category)
  if (sourceRoot && targetRoot && sourceRoot === targetRoot) {
    score += 50
    reasons.push('same_root')
  }

  // Shared themes
  const sourceThemes = new Set(source.theme ?? [])
  const sharedThemes = (target.theme ?? []).filter((t) => sourceThemes.has(t))
  if (sharedThemes.length > 0) {
    score += 15 * sharedThemes.length
    reasons.push('same_theme')
  }

  // Same category
  if (source.category === target.category) {
    score += 10
    reasons.push('same_category')
  }

  // Same CEFR level
  if (source.cefr.toUpperCase() === target.cefr.toUpperCase()) {
    score += 5
    reasons.push('same_cefr')
  }

  if (score === 0) return null

  return { exprId: targetId, score, reasons }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RelatedExpression {
  entry: ExpressionEntry
  videoCount: number
  reasons: RelationReason[]
  score: number
}

export interface ExpressionCluster {
  root: ExpressionEntry
  rootVideoCount: number
  related: RelatedExpression[]
  /** All unique video IDs that contain any expression in this cluster */
  videoIds: string[]
}

/**
 * Get expressions related to the given expression, ranked by connection strength.
 *
 * Strategy:
 *   1. Same root verb (phrasal verbs): strongest signal
 *   2. Shared themes: moderate signal
 *   3. Same category: weak signal
 *   4. Same CEFR level: tie-breaker
 *
 * @param exprId  Expression ID (canonical form)
 * @param limit   Max results (default 10)
 */
export function getRelatedExpressions(exprId: string, limit: number = 10): RelatedExpression[] {
  const source = entries[exprId]
  if (!source) return []

  const exprVideos = getExprToVideos()
  const candidates = new Set<string>()

  // Collect candidates from same root
  const root = extractRootVerb(source.canonical, source.category)
  if (root) {
    const rootExprs = getRootIndex().get(root) ?? []
    for (const id of rootExprs) candidates.add(id)
  }

  // Collect candidates from same themes
  for (const theme of source.theme ?? []) {
    const themeExprs = getThemeIndex().get(theme) ?? []
    for (const id of themeExprs) candidates.add(id)
  }

  // Collect candidates from same category
  const categoryExprs = getCategoryIndex().get(source.category) ?? []
  for (const id of categoryExprs) candidates.add(id)

  // Collect candidates from same CEFR level
  const cefrExprs = getCefrIndex().get(source.cefr.toUpperCase()) ?? []
  for (const id of cefrExprs) candidates.add(id)

  // Score all candidates
  const scored: RelatedExpression[] = []
  for (const targetId of candidates) {
    const result = computeRelationScore(exprId, targetId)
    if (!result) continue

    const targetEntry = entries[targetId]
    if (!targetEntry) continue

    scored.push({
      entry: targetEntry,
      videoCount: exprVideos.get(targetId)?.length ?? 0,
      reasons: result.reasons,
      score: result.score,
    })
  }

  // Sort: highest score first, then by video count (more videos = better content)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.videoCount - a.videoCount
  })

  return scored.slice(0, limit)
}

/**
 * Get a full cluster for an expression: the expression itself, its related
 * expressions, and all videos containing any of them.
 */
export function getExpressionCluster(exprId: string): ExpressionCluster | null {
  const source = entries[exprId]
  if (!source) return null

  const exprVideos = getExprToVideos()
  const related = getRelatedExpressions(exprId, 15)

  // Collect all video IDs across the cluster
  const allVideoIds = new Set<string>()
  const sourceVideos = exprVideos.get(exprId) ?? []
  for (const vid of sourceVideos) allVideoIds.add(vid)
  for (const rel of related) {
    const relVideos = exprVideos.get(rel.entry.id) ?? []
    for (const vid of relVideos) allVideoIds.add(vid)
  }

  return {
    root: source,
    rootVideoCount: sourceVideos.length,
    related,
    videoIds: Array.from(allVideoIds),
  }
}

/**
 * Get the number of videos containing a specific expression.
 */
export function getVideoCountForExpression(exprId: string): number {
  return getExprToVideos().get(exprId)?.length ?? 0
}

/**
 * Get all video IDs containing a specific expression.
 */
export function getVideosForExpression(exprId: string): string[] {
  return getExprToVideos().get(exprId) ?? []
}

/**
 * Look up an expression entry by ID.
 */
export function getExpressionEntry(exprId: string): ExpressionEntry | null {
  return entries[exprId] ?? null
}

/**
 * Get all expression entries (for path generation).
 */
export function getAllExpressionEntries(): Record<string, ExpressionEntry> {
  return entries
}
