/**
 * expressionWeb.ts
 *
 * Expression connection graph — finds related expressions via shared root verbs,
 * themes, categories, and CEFR levels. Powers the "Expression Web" UI and
 * learning path generation.
 *
 * Data: expression-entries-v2.json + expression-index-v3.json
 * Uses lazy loading to avoid bundling large JSON into the initial bundle.
 */

import type { ExpressionEntry } from './expressionLookup'

// ---------------------------------------------------------------------------
// Lazy-loaded data
// ---------------------------------------------------------------------------

type IndexV3Row = { exprId: string; sentenceIdx: number; en: string; ko: string }

let _entries: Record<string, ExpressionEntry> | null = null
let _videoIndex: Record<string, IndexV3Row[]> | null = null
let _dataPromise: Promise<void> | null = null

async function ensureData(): Promise<{ entries: Record<string, ExpressionEntry>; videoIndex: Record<string, IndexV3Row[]> }> {
  if (_entries && _videoIndex) return { entries: _entries, videoIndex: _videoIndex }
  if (!_dataPromise) {
    _dataPromise = Promise.all([
      import('../data/expression-entries-v2.json').then((m) => {
        _entries = m.default as Record<string, ExpressionEntry>
      }),
      import('../data/expression-index-v3.json').then((m) => {
        _videoIndex = m.default as Record<string, IndexV3Row[]>
      }),
    ]).then(() => {})
  }
  await _dataPromise
  return { entries: _entries!, videoIndex: _videoIndex! }
}

/** Preload data for expressionWeb. */
export async function preloadExpressionWebData(): Promise<void> {
  await ensureData()
}

// ---------------------------------------------------------------------------
// Pre-computed indexes (built once on first access after data loads)
// ---------------------------------------------------------------------------

let _rootIndex: Map<string, string[]> | null = null
let _themeIndex: Map<string, string[]> | null = null
let _categoryIndex: Map<string, string[]> | null = null
let _cefrIndex: Map<string, string[]> | null = null
let _exprToVideos: Map<string, string[]> | null = null

function getRootIndex(entries: Record<string, ExpressionEntry>): Map<string, string[]> {
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

function getThemeIndex(entries: Record<string, ExpressionEntry>): Map<string, string[]> {
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

function getCategoryIndex(entries: Record<string, ExpressionEntry>): Map<string, string[]> {
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

function getCefrIndex(entries: Record<string, ExpressionEntry>): Map<string, string[]> {
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

function getExprToVideos(videoIndex: Record<string, IndexV3Row[]>): Map<string, string[]> {
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

function extractRootVerb(canonical: string, category: string): string | null {
  const parts = canonical.toLowerCase().split(/\s+/)
  if (parts.length < 2) return null

  const firstWord = parts[0]
  if (firstWord.length < 2) return null

  const SKIP_WORDS = new Set(['a', 'an', 'the', 'my', 'no', 'on', 'in', 'at', 'to', 'of', 'it', 'be', 'is'])
  if (SKIP_WORDS.has(firstWord)) return null

  if (category === 'phrasal_verb' || category === 'collocation') {
    return firstWord
  }

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
// Scoring
// ---------------------------------------------------------------------------

interface RelationScore {
  exprId: string
  score: number
  reasons: RelationReason[]
}

type RelationReason = 'same_root' | 'same_theme' | 'same_category' | 'same_cefr'

function computeRelationScore(
  entries: Record<string, ExpressionEntry>,
  sourceId: string,
  targetId: string,
): RelationScore | null {
  if (sourceId === targetId) return null

  const source = entries[sourceId]
  const target = entries[targetId]
  if (!source || !target) return null

  let score = 0
  const reasons: RelationReason[] = []

  const sourceRoot = extractRootVerb(source.canonical, source.category)
  const targetRoot = extractRootVerb(target.canonical, target.category)
  if (sourceRoot && targetRoot && sourceRoot === targetRoot) {
    score += 50
    reasons.push('same_root')
  }

  const sourceThemes = new Set(source.theme ?? [])
  const sharedThemes = (target.theme ?? []).filter((t) => sourceThemes.has(t))
  if (sharedThemes.length > 0) {
    score += 15 * sharedThemes.length
    reasons.push('same_theme')
  }

  if (source.category === target.category) {
    score += 10
    reasons.push('same_category')
  }

  if (source.cefr.toUpperCase() === target.cefr.toUpperCase()) {
    score += 5
    reasons.push('same_cefr')
  }

  if (score === 0) return null

  return { exprId: targetId, score, reasons }
}

// ---------------------------------------------------------------------------
// Public API (async — loads data on first call)
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
  videoIds: string[]
}

export async function getRelatedExpressions(exprId: string, limit: number = 10): Promise<RelatedExpression[]> {
  const { entries, videoIndex } = await ensureData()
  const source = entries[exprId]
  if (!source) return []

  const exprVideos = getExprToVideos(videoIndex)
  const candidates = new Set<string>()

  const root = extractRootVerb(source.canonical, source.category)
  if (root) {
    const rootExprs = getRootIndex(entries).get(root) ?? []
    for (const id of rootExprs) candidates.add(id)
  }

  for (const theme of source.theme ?? []) {
    const themeExprs = getThemeIndex(entries).get(theme) ?? []
    for (const id of themeExprs) candidates.add(id)
  }

  const categoryExprs = getCategoryIndex(entries).get(source.category) ?? []
  for (const id of categoryExprs) candidates.add(id)

  const cefrExprs = getCefrIndex(entries).get(source.cefr.toUpperCase()) ?? []
  for (const id of cefrExprs) candidates.add(id)

  const scored: RelatedExpression[] = []
  for (const targetId of candidates) {
    const result = computeRelationScore(entries, exprId, targetId)
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

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return b.videoCount - a.videoCount
  })

  return scored.slice(0, limit)
}

export async function getExpressionCluster(exprId: string): Promise<ExpressionCluster | null> {
  const { entries, videoIndex } = await ensureData()
  const source = entries[exprId]
  if (!source) return null

  const exprVideos = getExprToVideos(videoIndex)
  const related = await getRelatedExpressions(exprId, 15)

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

export async function getVideoCountForExpression(exprId: string): Promise<number> {
  const { videoIndex } = await ensureData()
  return getExprToVideos(videoIndex).get(exprId)?.length ?? 0
}

export async function getVideosForExpression(exprId: string): Promise<string[]> {
  const { videoIndex } = await ensureData()
  return getExprToVideos(videoIndex).get(exprId) ?? []
}

export async function getExpressionEntry(exprId: string): Promise<ExpressionEntry | null> {
  const { entries } = await ensureData()
  return entries[exprId] ?? null
}

export async function getAllExpressionEntries(): Promise<Record<string, ExpressionEntry>> {
  const { entries } = await ensureData()
  return entries
}
