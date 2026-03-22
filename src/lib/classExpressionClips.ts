/**
 * classExpressionClips.ts
 *
 * Builds expression-first clip data for the class detail (expression browser) page.
 * For each expression in a class, finds all video clips where it appears.
 * Uses lazy loading to avoid bundling large JSON files into the initial bundle.
 */

import { getCatalogVideoByYoutubeId } from '@/lib/catalog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExpressionEntryV2 {
  id: string
  canonical: string
  meaning_ko: string
  meaning_ja?: string
  meaning_zhTW?: string
  meaning_vi?: string
  category: string
  cefr: string
  theme: string[]
  register: string
  learner_value: string
  videoCount: number
}

interface IndexRowV3 {
  exprId: string
  sentenceIdx: number
  en: string
  ko: string
  surfaceForm: string
}

export interface ClipInfo {
  youtubeId: string
  videoTitle: string
  sentenceEn: string
  sentenceKo: string
  surfaceForm: string
  start: number
  end: number
  sentenceIdx: number
}

export interface ExpressionWithClips {
  entry: ExpressionEntryV2
  clips: ClipInfo[]
}

// ---------------------------------------------------------------------------
// Lazy-loaded data
// ---------------------------------------------------------------------------

let _entries: Record<string, ExpressionEntryV2> | null = null
let _videoIndex: Record<string, IndexRowV3[]> | null = null
let _dataPromise: Promise<void> | null = null

async function ensureData() {
  if (_entries && _videoIndex) return
  if (!_dataPromise) {
    _dataPromise = Promise.all([
      import('@/data/expression-entries-v2.json'),
      import('@/data/expression-index-v3.json'),
    ]).then(([ent, idx]) => {
      _entries = ent.default as Record<string, ExpressionEntryV2>
      _videoIndex = idx.default as Record<string, IndexRowV3[]>
    })
  }
  await _dataPromise
}

// Build a reverse index: exprId -> [{youtubeId, row}]
let reverseIndex: Map<string, { youtubeId: string; row: IndexRowV3 }[]> | null = null

function getReverseIndex(videoIndex: Record<string, IndexRowV3[]>): Map<string, { youtubeId: string; row: IndexRowV3 }[]> {
  if (reverseIndex) return reverseIndex
  reverseIndex = new Map()
  for (const [youtubeId, rows] of Object.entries(videoIndex)) {
    for (const row of rows) {
      const list = reverseIndex.get(row.exprId)
      if (list) {
        list.push({ youtubeId, row })
      } else {
        reverseIndex.set(row.exprId, [{ youtubeId, row }])
      }
    }
  }
  return reverseIndex
}

// ---------------------------------------------------------------------------
// Public API (async)
// ---------------------------------------------------------------------------

export async function getExpressionEntry(exprId: string): Promise<ExpressionEntryV2 | undefined> {
  await ensureData()
  return _entries![exprId]
}

/**
 * For a given expression and a set of allowed videoIds, find all clips.
 */
export async function getClipsForExpression(
  exprId: string,
  allowedVideoIds?: Set<string>,
): Promise<ClipInfo[]> {
  await ensureData()
  const ri = getReverseIndex(_videoIndex!)
  const matches = ri.get(exprId)
  if (!matches) return []

  const clips: ClipInfo[] = []

  for (const { youtubeId, row } of matches) {
    if (allowedVideoIds && !allowedVideoIds.has(youtubeId)) continue

    const video = getCatalogVideoByYoutubeId(youtubeId)
    const videoTitle = video?.title ?? ''

    clips.push({
      youtubeId,
      videoTitle,
      sentenceEn: row.en,
      sentenceKo: row.ko,
      surfaceForm: row.surfaceForm ?? exprId,
      start: 0,
      end: 0,
      sentenceIdx: row.sentenceIdx,
    })
  }

  return clips
}

/**
 * Build expression-with-clips data for all expressions in a class.
 */
export async function buildClassExpressionClips(
  expressions: string[],
  videoIds: string[],
): Promise<ExpressionWithClips[]> {
  await ensureData()
  const allowedVideoIds = new Set(videoIds)
  const result: ExpressionWithClips[] = []

  for (const exprId of expressions) {
    const entry = _entries![exprId]
    if (!entry) continue

    const clips = await getClipsForExpression(exprId, allowedVideoIds)
    if (clips.length === 0) continue

    result.push({ entry, clips })
  }

  return result
}
