/**
 * classExpressionClips.ts
 *
 * Builds expression-first clip data for the class detail (expression browser) page.
 * For each expression in a class, finds all video clips where it appears.
 */

import expressionEntriesData from '@/data/expression-entries-v2.json'
import expressionIndexData from '@/data/expression-index-v3.json'
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
// Internal data
// ---------------------------------------------------------------------------

const entries = expressionEntriesData as Record<string, ExpressionEntryV2>
const videoIndex = expressionIndexData as Record<string, IndexRowV3[]>

// Build a reverse index: exprId -> [{youtubeId, row}]
// Lazy-initialized to avoid blocking module load
let reverseIndex: Map<string, { youtubeId: string; row: IndexRowV3 }[]> | null = null

function getReverseIndex(): Map<string, { youtubeId: string; row: IndexRowV3 }[]> {
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
// Public API
// ---------------------------------------------------------------------------

export function getExpressionEntry(exprId: string): ExpressionEntryV2 | undefined {
  return entries[exprId]
}

/**
 * For a given expression and a set of allowed videoIds, find all clips.
 * Returns clips with timing info from seed-videos subtitles.
 */
export function getClipsForExpression(
  exprId: string,
  allowedVideoIds?: Set<string>,
): ClipInfo[] {
  const ri = getReverseIndex()
  const matches = ri.get(exprId)
  if (!matches) return []

  const clips: ClipInfo[] = []

  for (const { youtubeId, row } of matches) {
    if (allowedVideoIds && !allowedVideoIds.has(youtubeId)) continue

    const video = getCatalogVideoByYoutubeId(youtubeId)
    if (!video) continue

    const subtitle = video.subtitles?.[row.sentenceIdx]
    if (!subtitle) continue

    clips.push({
      youtubeId,
      videoTitle: video.title,
      sentenceEn: row.en,
      sentenceKo: row.ko,
      surfaceForm: row.surfaceForm ?? exprId,
      start: subtitle.start,
      end: subtitle.end,
      sentenceIdx: row.sentenceIdx,
    })
  }

  return clips
}

/**
 * Build expression-with-clips data for all expressions in a class.
 * Only includes expressions that have at least one clip.
 */
export function buildClassExpressionClips(
  expressions: string[],
  videoIds: string[],
): ExpressionWithClips[] {
  const allowedVideoIds = new Set(videoIds)
  const result: ExpressionWithClips[] = []

  for (const exprId of expressions) {
    const entry = entries[exprId]
    if (!entry) continue

    const clips = getClipsForExpression(exprId, allowedVideoIds)
    if (clips.length === 0) continue

    result.push({ entry, clips })
  }

  return result
}
