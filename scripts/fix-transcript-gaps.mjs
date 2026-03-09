#!/usr/bin/env node
/**
 * Regenerate all transcripts from YouTube auto-captions via yt-dlp.
 * - Fetches word-level timing from YouTube (json3 format)
 * - Segments into 3-6 second chunks with proper sentence boundaries
 * - Preserves existing Korean translations via fuzzy matching
 * - Marks silence/music gaps with [silence] annotations in console
 *
 * Usage:
 *   node scripts/fix-transcript-gaps.mjs           # Regenerate all
 *   node scripts/fix-transcript-gaps.mjs --id=ABC  # Regenerate specific video
 *   node scripts/fix-transcript-gaps.mjs --ids-file=path/to/ids.json
 *   node scripts/fix-transcript-gaps.mjs --dry      # Dry run, show stats only
 */

import { readdir, readFile, writeFile, mkdtemp, rm } from 'fs/promises'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TRANSCRIPTS_DIR = join(__dirname, '..', 'public', 'transcripts')
const SEED_VIDEOS_PATH = join(__dirname, '..', 'src', 'data', 'seed-videos.ts')

const TARGET_DURATION = 4
const MAX_DURATION = 6
const MAX_TEXT_LENGTH = 120

const args = process.argv.slice(2)
const specificId = args.find(a => a.startsWith('--id='))?.split('=')[1]
const idsFile = args.find(a => a.startsWith('--ids-file='))?.split('=')[1]
const dryRun = args.includes('--dry')

async function main() {
  // Extract YouTube IDs from seed-videos.ts
  const seedContent = await readFile(SEED_VIDEOS_PATH, 'utf-8')
  const youtubeIds = [...seedContent.matchAll(/youtubeId:\s*'([^']+)'/g)].map(m => m[1])

  console.log(`Found ${youtubeIds.length} seed videos\n`)

  let toProcess = specificId ? [specificId] : youtubeIds
  if (idsFile) {
    const batch = JSON.parse((await readFile(resolve(idsFile), 'utf-8')).replace(/^\uFEFF/, ''))
    const ids = Array.isArray(batch) ? batch : batch.ids ?? batch.valid_ids ?? []
    toProcess = ids.filter(Boolean)
  }
  let success = 0
  let failed = 0

  for (const videoId of toProcess) {
    process.stdout.write(`  ${videoId}... `)

    try {
      // 1. Load existing transcript for Korean matching
      const existingPath = join(TRANSCRIPTS_DIR, `${videoId}.json`)
      let existing = []
      if (existsSync(existingPath)) {
        existing = JSON.parse(await readFile(existingPath, 'utf-8'))
      }

      // 2. Fetch fresh from YouTube via yt-dlp
      const ytEvents = await fetchYtDlpEvents(videoId)
      if (!ytEvents || ytEvents.length === 0) {
        console.log('SKIP (no YouTube transcript)')
        failed++
        continue
      }

      // 3. Deduplicate overlapping events (YouTube sends progressive updates)
      const deduped = deduplicateEvents(ytEvents)

      // 4. Segment into subtitle entries
      const entries = postProcessSubtitles(groupIntoSubtitles(deduped))

      if (entries.length === 0) {
        console.log('SKIP (no text after filtering)')
        failed++
        continue
      }

      // 5. Match Korean translations from existing file
      const koMap = buildKoMap(existing)
      const existingKoEntries = existing.filter(entry => entry.ko)
      let koMatched = 0
      for (const entry of entries) {
        const ko = findBestKoMatch(entry, koMap, existingKoEntries)
        if (ko) {
          entry.ko = ko
          koMatched++
        }
      }

      // 6. Quality stats
      const gaps = countGaps(entries, 2)
      const maxDur = Math.max(...entries.map(e => e.end - e.start))
      const maxLen = Math.max(...entries.map(e => e.en.length))

      if (dryRun) {
        console.log(`${entries.length} entries, ${koMatched}/${entries.length} ko, ${gaps} gaps>2s, maxDur=${maxDur.toFixed(1)}s, maxLen=${maxLen}ch`)
        continue
      }

      // 7. Write
      await writeFile(existingPath, JSON.stringify(entries, null, 2) + '\n', 'utf-8')
      console.log(`OK - ${entries.length} entries (${koMatched} ko matched, ${gaps} gaps)`)
      success++

      await sleep(1500)
    } catch (err) {
      console.log(`FAILED: ${err.message}`)
      failed++
    }
  }

  console.log(`\nDone: ${success} regenerated, ${failed} failed`)

  if (!dryRun) {
    console.log('\nRun "node scripts/check-transcripts.mjs" to verify quality.')
  }
}

/**
 * Fetch YouTube auto-captions via yt-dlp json3 format.
 */
async function fetchYtDlpEvents(videoId) {
  const tempDir = await mkdtemp(join(tmpdir(), 'ytdlp-'))
  const outTemplate = join(tempDir, '%(id)s')

  try {
    execSync(
      `yt-dlp --write-auto-sub --sub-lang en --sub-format json3 --skip-download -o "${outTemplate}" "https://www.youtube.com/watch?v=${videoId}"`,
      { stdio: 'pipe', timeout: 30000 }
    )

    const tempFiles = await readdir(tempDir)
    const json3File = tempFiles.find(f => f.endsWith('.json3'))
    if (!json3File) return null

    const data = JSON.parse(await readFile(join(tempDir, json3File), 'utf-8'))
    if (!data.events) return null

    const entries = []
    for (const event of data.events) {
      if (!event.segs) continue

      const rawText = event.segs.map(s => s.utf8 || '').join('')
      const text = decodeHTMLEntities(rawText).trim()

      // Skip empty, pure newlines, annotations like [Music] [Applause]
      if (!text || /^\s*$/.test(text) || /^\[.*\]$/.test(text)) continue

      const startMs = event.tStartMs || 0
      const durationMs = event.dDurationMs || 0

      entries.push({
        startSec: startMs / 1000,
        endSec: (startMs + durationMs) / 1000,
        text,
      })
    }

    return entries
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

/**
 * YouTube json3 sends overlapping events (progressive word display).
 * Deduplicate by keeping the longest text for overlapping time ranges.
 */
function deduplicateEvents(events) {
  if (events.length === 0) return []

  const sorted = [...events].sort((a, b) => a.startSec - b.startSec || a.endSec - b.endSec)

  const result = []
  let current = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]

    if (isLikelyProgressiveDuplicate(current, next, 'text')) {
      current = pickMoreCompleteTimedEntry(current, next, 'text')
    } else {
      result.push(current)
      current = next
    }
  }
  result.push(current)

  return result
}

/**
 * Group deduplicated events into subtitle segments (3-6s, max 120 chars).
 */
function groupIntoSubtitles(events) {
  if (events.length === 0) return []

  const subtitles = []
  let currentTexts = []
  let segStart = events[0].startSec
  let segEnd = events[0].endSec

  for (const ev of events) {
    const text = ev.text

    if (currentTexts.length === 0) {
      segStart = ev.startSec
      segEnd = ev.endSec
      currentTexts.push(text)
    } else {
      const potDuration = ev.endSec - segStart
      const potText = [...currentTexts, text].join(' ')

      if (potDuration <= TARGET_DURATION && potText.length <= MAX_TEXT_LENGTH) {
        currentTexts.push(text)
        segEnd = ev.endSec
      } else if (
        potDuration <= MAX_DURATION &&
        potText.length <= MAX_TEXT_LENGTH &&
        !endsWithSentenceBoundary(currentTexts[currentTexts.length - 1])
      ) {
        currentTexts.push(text)
        segEnd = ev.endSec
      } else {
        subtitles.push(makeEntry(segStart, segEnd, currentTexts))
        segStart = ev.startSec
        segEnd = ev.endSec
        currentTexts = [text]
      }
    }
  }

  if (currentTexts.length > 0) {
    subtitles.push(makeEntry(segStart, segEnd, currentTexts))
  }

  return normalizeGeneratedEntries(subtitles)
}

function makeEntry(start, end, texts) {
  // Ensure minimum duration of 1s for very short entries
  const minEnd = Math.max(end, start + 1)
  // Cap max duration at 7s
  const maxEnd = Math.min(minEnd, start + 7)

  return {
    start: round2(start),
    end: round2(maxEnd),
    en: capitalizeFirst(texts.join(' ')),
    ko: '',
  }
}

function postProcessSubtitles(entries) {
  if (entries.length === 0) return entries

  const result = []

  for (const entry of entries.sort((a, b) => a.start - b.start)) {
    const normalized = normalize(entry.en)
    if (!normalized) continue

    const previous = result[result.length - 1]
    if (previous) {
      if (isLikelyProgressiveDuplicate(previous, entry, 'en')) {
        result[result.length - 1] = pickMoreCompleteTimedEntry(previous, entry, 'en', {
          start: Math.min(previous.start, entry.start),
          end: Math.max(previous.end, entry.end),
        })
        continue
      }

      if (entry.start < previous.end) {
        entry.start = round2(previous.end)
      }

      if (entry.end <= entry.start + 0.3) {
        continue
      }
    }

    result.push({
      ...entry,
      start: round2(entry.start),
      end: round2(Math.max(entry.end, entry.start + 0.8)),
    })
  }

  return result.filter((entry) => entry.end > entry.start)
}

function countGaps(entries, threshold) {
  let count = 0
  for (let i = 1; i < entries.length; i++) {
    if (entries[i].start - entries[i - 1].end > threshold) count++
  }
  return count
}

/**
 * Ensure generated subtitles stay time-ordered and non-overlapping.
 * Also drops adjacent progressive duplicates that survive event-level dedupe.
 */
function normalizeGeneratedEntries(entries) {
  if (entries.length === 0) return []

  const normalized = []
  const sorted = [...entries].sort((a, b) => a.start - b.start || a.end - b.end)

  for (const raw of sorted) {
    const entry = {
      ...raw,
      start: round2(Math.max(0, raw.start)),
      end: round2(Math.max(raw.end, raw.start + 0.2)),
    }

    const prev = normalized[normalized.length - 1]
    if (!prev) {
      normalized.push(entry)
      continue
    }

    if (isLikelyProgressiveDuplicate(prev, entry, 'en')) {
      normalized[normalized.length - 1] = pickMoreCompleteTimedEntry(prev, entry, 'en', {
        start: Math.min(prev.start, entry.start),
        end: Math.max(prev.end, entry.end),
      })
      continue
    }

    if (entry.start < prev.end) {
      entry.start = round2(prev.end)
    }

    if (entry.end <= entry.start) {
      entry.end = round2(entry.start + 0.2)
    }

    normalized.push(entry)
  }

  return normalized
}

/**
 * Build Korean translation map from existing entries.
 */
function buildKoMap(entries) {
  const map = new Map()
  for (const entry of entries) {
    if (entry.ko) {
      map.set(normalize(entry.en), entry.ko)
    }
  }
  return map
}

/**
 * Find best Korean translation match via exact, substring, and word overlap.
 */
function findBestKoMatch(entry, koMap, existingEntries) {
  if (koMap.size === 0) return ''
  const norm = normalize(entry.en)

  // Exact match
  if (koMap.has(norm)) return koMap.get(norm)

  // Substring match
  for (const [key, ko] of koMap) {
    if (norm.includes(key) && key.length > 10) return ko
    if (key.includes(norm) && norm.length > 10) return ko
  }

  const timeMatched = findTimeAlignedKo(entry, existingEntries)
  if (timeMatched) return timeMatched

  // Word overlap: >60% match
  const newWords = new Set(norm.split(/\s+/))
  if (newWords.size < 2) return '' // Too short for fuzzy matching

  let bestScore = 0
  let bestKo = ''
  for (const [key, ko] of koMap) {
    const oldWords = key.split(/\s+/)
    const overlap = oldWords.filter(w => newWords.has(w)).length
    const score = overlap / Math.max(oldWords.length, newWords.size)
    if (score > 0.6 && score > bestScore) {
      bestScore = score
      bestKo = ko
    }
  }

  return bestKo
}

function findTimeAlignedKo(entry, existingEntries) {
  const targetCenter = (entry.start + entry.end) / 2
  let bestDistance = Number.POSITIVE_INFINITY
  let bestKo = ''

  for (const existing of existingEntries) {
    if (!existing.ko) continue

    const existingCenter = (existing.start + existing.end) / 2
    const distance = Math.abs(targetCenter - existingCenter)
    if (distance > 1.5) continue

    const similarity = overlapSimilarity(entry.en, existing.en)
    if (similarity < 0.25) continue

    if (distance < bestDistance) {
      bestDistance = distance
      bestKo = existing.ko
    }
  }

  return bestKo
}

function overlapSimilarity(left, right) {
  const leftWords = new Set(normalize(left).split(/\s+/).filter(Boolean))
  const rightWords = new Set(normalize(right).split(/\s+/).filter(Boolean))
  if (leftWords.size === 0 || rightWords.size === 0) return 0

  let matches = 0
  for (const word of leftWords) {
    if (rightWords.has(word)) matches++
  }

  return matches / Math.max(leftWords.size, rightWords.size)
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function normalizeCaptionText(text) {
  return normalize(text || '')
}

function getEntryStart(entry) {
  return entry.startSec ?? entry.start ?? 0
}

function getEntryEnd(entry) {
  return entry.endSec ?? entry.end ?? getEntryStart(entry)
}

function isLikelyProgressiveDuplicate(a, b, textKey) {
  const aText = normalizeCaptionText(a[textKey])
  const bText = normalizeCaptionText(b[textKey])
  if (!aText || !bText) return false

  const startsClose = Math.abs(getEntryStart(a) - getEntryStart(b)) <= 1.0
  const overlaps = (Math.min(getEntryEnd(a), getEntryEnd(b)) - Math.max(getEntryStart(a), getEntryStart(b))) >= -0.1

  if (!startsClose || !overlaps) return false
  if (aText === bText) return true

  const [shorter, longer] = aText.length <= bText.length ? [aText, bText] : [bText, aText]
  if (shorter.length < 12) return false

  return longer.startsWith(shorter)
}

function pickMoreCompleteTimedEntry(a, b, textKey, overrides = {}) {
  const aText = normalizeCaptionText(a[textKey])
  const bText = normalizeCaptionText(b[textKey])
  const preferred = bText.length > aText.length || (bText.length === aText.length && getEntryEnd(b) > getEntryEnd(a))
    ? b
    : a

  return {
    ...preferred,
    ...overrides,
  }
}

function capitalizeFirst(text) {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function endsWithSentenceBoundary(text) {
  return /[.!?]["']?\s*$/.test(text)
}

function round2(n) {
  return Math.round(n * 100) / 100
}

function decodeHTMLEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n/g, ' ')
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(console.error)
