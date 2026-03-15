#!/usr/bin/env node
/**
 * Re-chunk transcript files using Whisper raw segments (proper sentence boundaries).
 *
 * Problem: Some transcripts were built from word-level timestamps, cramming multiple
 * sentences into single segments. The raw Whisper data has proper per-sentence segments.
 *
 * Usage:
 *   node scripts/rechunk-from-raw.mjs
 *   node scripts/rechunk-from-raw.mjs --dry        # Preview without writing
 *   node scripts/rechunk-from-raw.mjs --id=ABC     # Process single video
 */

import { readFile, writeFile, readdir } from 'fs/promises'
import { join, dirname, basename } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import { execSync } from 'child_process'
import { loadSeedData } from './lib/load-seed-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TRANSCRIPTS_DIR = join(__dirname, '..', 'public', 'transcripts')
const WHISPER_RAW_DIR = join(__dirname, '..', 'logs', 'whisper-raw')
const SEED_VIDEOS_PATH = join(__dirname, '..', 'src', 'data', 'seed-videos.ts')

const TARGET_DURATION = 4
const MAX_DURATION = 6
const MAX_TEXT_LENGTH = 120

const args = process.argv.slice(2)
const specificId = args.find(a => a.startsWith('--id='))?.split('=')[1]
const dryRun = args.includes('--dry')

async function main() {
  // Build set of reseg-protected files (manually segmented in bad95bf1)
  const resegProtected = new Set()
  try {
    const resegFiles = execSync('git ls-tree --name-only bad95bf1 public/transcripts/', { encoding: 'utf-8' })
    for (const line of resegFiles.trim().split('\n')) {
      if (line) resegProtected.add(basename(line).replace('.json', ''))
    }
    console.log(`Loaded ${resegProtected.size} reseg-protected files from bad95bf1\n`)
  } catch (err) {
    console.warn(`WARNING: Could not load reseg file list from bad95bf1: ${err.message}`)
    console.warn('Proceeding without reseg protection\n')
  }

  // Load seed data for clipStart/clipEnd
  const { seedVideos } = await loadSeedData(SEED_VIDEOS_PATH)
  const clipMap = new Map()
  for (const v of seedVideos) {
    clipMap.set(v.youtubeId, { clipStart: v.clipStart || 0, clipEnd: v.clipEnd || 0 })
  }

  // Find all whisper-raw files (both new and old formats)
  const rawFiles = await readdir(WHISPER_RAW_DIR)
  const rawIds = []

  for (const f of rawFiles) {
    if (!f.endsWith('.json')) continue
    const id = f.replace('.json', '')
    if (specificId && id !== specificId) continue

    try {
      const data = JSON.parse(await readFile(join(WHISPER_RAW_DIR, f), 'utf-8'))
      const segments = extractSegments(data)
      if (segments && segments.length > 0) {
        rawIds.push(id)
      }
    } catch {}
  }

  // Filter to only those that have existing transcripts
  const toProcess = rawIds.filter(id => existsSync(join(TRANSCRIPTS_DIR, `${id}.json`)))

  console.log(`Found ${rawIds.length} raw whisper files, ${toProcess.length} have existing transcripts`)
  if (dryRun) console.log('DRY RUN - no files will be written\n')

  let processed = 0
  let totalSegsBefore = 0
  let totalSegsAfter = 0
  let totalKoMatched = 0
  let totalKoTotal = 0
  let skipped = 0

  for (const id of toProcess) {
    if (resegProtected.has(id)) {
      console.log(`  Skipping ${id} (reseg protected)`)
      skipped++
      continue
    }

    try {
      const rawData = JSON.parse(await readFile(join(WHISPER_RAW_DIR, `${id}.json`), 'utf-8'))
      const existingTranscript = JSON.parse(await readFile(join(TRANSCRIPTS_DIR, `${id}.json`), 'utf-8'))

      if (!Array.isArray(existingTranscript) || existingTranscript.length === 0) {
        skipped++
        continue
      }

      const clip = clipMap.get(id) || { clipStart: 0, clipEnd: 0 }
      const isFullVideo = clip.clipStart === 0 && clip.clipEnd === 0

      // Get raw segments with proper sentence boundaries (handles both formats)
      const extractedSegments = extractSegments(rawData)
      let rawSegments = extractedSegments
        .filter(s => s.text && s.text.trim().length > 0)
        .map(s => ({
          start: round2(s.start),
          end: round2(s.end),
          text: normalizeWhisperText(s.text),
        }))
        .filter(s => s.text.length > 0)

      if (rawSegments.length === 0) {
        skipped++
        continue
      }

      // Filter to clip range if not full video
      if (!isFullVideo) {
        rawSegments = rawSegments.filter(s =>
          s.start >= clip.clipStart - 1 && s.start <= clip.clipEnd + 1
        )
      }

      if (rawSegments.length === 0) {
        skipped++
        continue
      }

      // Regroup segments respecting sentence boundaries
      const regrouped = regroupSegments(rawSegments)

      // Clamp to clip boundaries
      let finalSegments = regrouped
      if (!isFullVideo) {
        finalSegments = regrouped
          .map(s => ({
            ...s,
            start: Math.max(clip.clipStart, s.start),
            end: Math.min(clip.clipEnd, s.end),
          }))
          .filter(s => s.end > s.start + 0.2)
      }

      if (finalSegments.length === 0) {
        skipped++
        continue
      }

      // Build ko map from existing transcript
      const koMap = buildKoMap(existingTranscript)
      const existingKoEntries = existingTranscript.filter(e => e?.ko)

      // Match ko translations
      let koMatched = 0
      const result = finalSegments.map(seg => {
        const ko = findBestKoMatch(seg, koMap, existingKoEntries)
        if (ko) koMatched++
        return {
          start: seg.start,
          end: seg.end,
          en: seg.en,
          ko: ko || '',
        }
      })

      const segsBefore = existingTranscript.length
      const segsAfter = result.length

      if (dryRun) {
        console.log(`  ${id}: ${segsBefore} -> ${segsAfter} segments (${koMatched} ko matched)`)
      } else {
        await writeFile(join(TRANSCRIPTS_DIR, `${id}.json`), JSON.stringify(result, null, 2) + '\n', 'utf-8')
        console.log(`  [${processed + 1}/${toProcess.length}] ${id}: ${segsBefore} -> ${segsAfter} segments (${koMatched}/${segsAfter} ko)`)
      }

      processed++
      totalSegsBefore += segsBefore
      totalSegsAfter += segsAfter
      totalKoMatched += koMatched
      totalKoTotal += segsAfter
    } catch (err) {
      console.error(`  ERROR ${id}: ${err.message}`)
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Files processed: ${processed}`)
  console.log(`Files skipped: ${skipped}`)
  console.log(`Segments before: ${totalSegsBefore}`)
  console.log(`Segments after: ${totalSegsAfter}`)
  console.log(`Ko translations matched: ${totalKoMatched}/${totalKoTotal} (${totalKoTotal > 0 ? Math.round(100 * totalKoMatched / totalKoTotal) : 0}%)`)
}

/**
 * Extract segments from raw data, handling both formats:
 * - New format: {savedAt, segments: [{start, end, text}], words: [...]}
 * - Old format: Array of {start, end, en, ko} (text in 'en' field)
 * - Indexed object: {0: {start, end, text/en}, 1: ...}
 * Returns array of {start, end, text}.
 */
function extractSegments(data) {
  // New format: {savedAt, segments}
  if (data.savedAt && Array.isArray(data.segments)) {
    return data.segments
  }

  // Old format: array of segments (text may be in 'en' or 'text' field)
  if (Array.isArray(data)) {
    return data.map(s => ({
      start: s.start,
      end: s.end,
      text: s.text || s.en || '',
    }))
  }

  // Indexed object: {0: {...}, 1: {...}, ...}
  if (typeof data === 'object' && data['0'] && typeof data['0'].start === 'number') {
    return Object.values(data).map(s => ({
      start: s.start,
      end: s.end,
      text: s.text || s.en || '',
    }))
  }

  return []
}

/**
 * Regroup raw Whisper segments into 4-6 second chunks,
 * respecting sentence boundaries.
 */
function regroupSegments(segments) {
  if (segments.length === 0) return []

  const result = []
  let currentTexts = []
  let segStart = segments[0].start
  let segEnd = segments[0].end

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]

    if (currentTexts.length === 0) {
      segStart = seg.start
      segEnd = seg.end
      currentTexts.push(seg.text)
      continue
    }

    const potentialDuration = seg.end - segStart
    const potentialText = [...currentTexts, seg.text].join(' ')
    const currentDuration = segEnd - segStart
    const previousText = currentTexts[currentTexts.length - 1]

    // If merging stays within TARGET_DURATION and text length, merge
    if (potentialDuration <= TARGET_DURATION && potentialText.length <= MAX_TEXT_LENGTH) {
      currentTexts.push(seg.text)
      segEnd = seg.end
      continue
    }

    // If merging stays within MAX_DURATION, text is short, and previous doesn't end a sentence, merge
    if (
      potentialDuration <= MAX_DURATION &&
      potentialText.length <= MAX_TEXT_LENGTH &&
      !endsWithSentenceBoundary(previousText)
    ) {
      currentTexts.push(seg.text)
      segEnd = seg.end
      continue
    }

    // If current accumulation is very short (< 2s) and segment is small, still merge
    if (currentDuration < 2 && potentialDuration <= MAX_DURATION && potentialText.length <= MAX_TEXT_LENGTH) {
      currentTexts.push(seg.text)
      segEnd = seg.end
      continue
    }

    // Flush current and start new
    result.push(makeEntry(segStart, segEnd, currentTexts))
    segStart = seg.start
    segEnd = seg.end
    currentTexts = [seg.text]
  }

  // Flush remaining
  if (currentTexts.length > 0) {
    result.push(makeEntry(segStart, segEnd, currentTexts))
  }

  return normalizeEntries(result)
}

function normalizeEntries(entries) {
  if (entries.length === 0) return []

  const sorted = [...entries].sort((a, b) => a.start - b.start)
  const normalized = []

  for (const entry of sorted) {
    const e = {
      ...entry,
      start: round2(Math.max(0, entry.start)),
      end: round2(Math.max(entry.end, entry.start + 0.2)),
    }

    const prev = normalized[normalized.length - 1]
    if (prev && e.start < prev.end) {
      e.start = round2(prev.end)
    }
    if (e.end <= e.start) {
      e.end = round2(e.start + 0.2)
    }

    normalized.push(e)
  }

  return normalized
}

function makeEntry(start, end, texts) {
  return {
    start: round2(start),
    end: round2(Math.min(Math.max(end, start + 0.8), start + 8)),
    en: texts.join(' ').replace(/\s+/g, ' ').trim(),
    ko: '',
  }
}

function buildKoMap(entries) {
  const map = new Map()
  for (const entry of entries) {
    if (entry?.ko) {
      map.set(normalize(entry.en), entry.ko)
    }
  }
  return map
}

function findBestKoMatch(entry, koMap, existingEntries) {
  if (koMap.size === 0) return ''

  const norm = normalize(entry.en)
  if (koMap.has(norm)) return koMap.get(norm)

  // Substring match
  for (const [key, ko] of koMap) {
    if (norm.includes(key) && key.length > 10) return ko
    if (key.includes(norm) && norm.length > 10) return ko
  }

  // Time-aligned match
  const timeMatched = findTimeAlignedKo(entry, existingEntries)
  if (timeMatched) return timeMatched

  // Word overlap match
  const newWords = new Set(norm.split(/\s+/))
  if (newWords.size < 2) return ''

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
  let bestDistance = Infinity
  let bestKo = ''

  for (const existing of existingEntries) {
    if (!existing?.ko) continue
    const existingCenter = (existing.start + existing.end) / 2
    const distance = Math.abs(targetCenter - existingCenter)
    if (distance > 2.0) continue

    const similarity = overlapSimilarity(entry.en, existing.en || '')
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
  for (const w of leftWords) {
    if (rightWords.has(w)) matches++
  }

  return matches / Math.max(leftWords.size, rightWords.size)
}

function endsWithSentenceBoundary(text) {
  return /[.!?]["']?\s*$/.test(text)
}

function normalizeWhisperText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function normalize(text) {
  return (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function round2(v) {
  return Math.round(v * 100) / 100
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
