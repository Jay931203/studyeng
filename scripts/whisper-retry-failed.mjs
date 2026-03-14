#!/usr/bin/env node
/**
 * Retry failed Whisper transcriptions by downloading FULL audio
 * and filtering segments by clipStart/clipEnd in code.
 *
 * This avoids ffmpeg clipping issues that cause whisper-regenerate.mjs to fail.
 *
 * Usage:
 *   node scripts/whisper-retry-failed.mjs
 *   node scripts/whisper-retry-failed.mjs --limit=10
 *   node scripts/whisper-retry-failed.mjs --id=ABC
 *   node scripts/whisper-retry-failed.mjs --concurrency=2
 */

import { readFile, writeFile, mkdtemp, rm, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
import { tmpdir } from 'os'
import { existsSync, statSync, mkdirSync } from 'fs'
import { loadEnv } from './lib/load-env.mjs'
import { loadSeedData } from './lib/load-seed-data.mjs'

loadEnv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const TRANSCRIPTS_DIR = join(__dirname, '..', 'public', 'transcripts')
const WHISPER_RAW_DIR = join(__dirname, '..', 'logs', 'whisper-raw')
const SEED_VIDEOS_PATH = join(__dirname, '..', 'src', 'data', 'seed-videos.ts')
const COST_LOG_PATH = join(__dirname, '..', 'whisper-cost-log.json')
const MANIFEST_PATH = join(__dirname, 'whisper-manifest.json')
const NEW_IDS_PATH = join(__dirname, '..', 'output', 'new-video-ids.json')
const TARGET_DURATION = 4
const MAX_DURATION = 6
const MAX_TEXT_LENGTH = 120

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY
if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY (or OPEN_API_KEY) environment variable required')
  process.exit(1)
}

const args = process.argv.slice(2)
const specificId = args.find(a => a.startsWith('--id='))?.split('=')[1]
const limit = Number.parseInt(getArgValue('--limit') || '0', 10)
const concurrency = Math.max(1, Number.parseInt(getArgValue('--concurrency') || '2', 10))
const forceAll = args.includes('--force')

let manifest = {}
if (existsSync(MANIFEST_PATH)) {
  try {
    manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf-8'))
  } catch {
    manifest = {}
  }
}

let sessionCost = 0
let sessionMinutes = 0

async function main() {
  // Load seed data to get clipStart/clipEnd
  const { seedVideos } = await loadSeedData(SEED_VIDEOS_PATH)
  const seedMap = new Map()
  for (const v of seedVideos) {
    if (!seedMap.has(v.youtubeId)) {
      seedMap.set(v.youtubeId, { clipStart: v.clipStart, clipEnd: v.clipEnd })
    }
  }

  // Load new video IDs
  let newIds = []
  if (existsSync(NEW_IDS_PATH)) {
    newIds = JSON.parse(await readFile(NEW_IDS_PATH, 'utf-8'))
  }

  // Find videos that need processing: in new-video-ids AND not in manifest
  let toProcess
  if (specificId) {
    toProcess = [specificId].filter(id => forceAll || !manifest[id])
  } else {
    toProcess = newIds.filter(id => forceAll || !manifest[id])
  }

  // Build video info with clip ranges
  const videoInfos = toProcess.map(id => {
    const seed = seedMap.get(id)
    return {
      youtubeId: id,
      clipStart: seed?.clipStart ?? 0,
      clipEnd: seed?.clipEnd ?? 0,
    }
  })

  let limited = videoInfos
  if (limit > 0) {
    limited = limited.slice(0, limit)
  }

  const clipCount = limited.filter(v => v.clipStart !== 0 || v.clipEnd !== 0).length
  const fullCount = limited.length - clipCount
  console.log(`\nWhisper Retry: ${limited.length} videos (${clipCount} clips, ${fullCount} full)`)
  console.log(`Concurrency: ${concurrency}\n`)

  let success = 0
  let failed = 0
  let completed = 0
  let nextIndex = 0
  let persistQueue = Promise.resolve()

  async function worker() {
    while (true) {
      const currentIndex = nextIndex++
      if (currentIndex >= limited.length) return

      const videoInfo = limited[currentIndex]
      const videoId = videoInfo.youtubeId
      const { clipStart, clipEnd } = videoInfo
      const isClip = clipStart !== 0 || clipEnd !== 0

      const tempDir = await mkdtemp(join(tmpdir(), 'whisper-retry-'))

      try {
        // Step 1: Download FULL audio with worstaudio to keep file small
        const audioPath = await downloadFullAudioSmall(videoId, tempDir)

        if (!audioPath || !existsSync(audioPath)) {
          failed++
          completed++
          console.log(`  [${++completed > completed ? completed : completed}/${limited.length}] ${videoId} [${clipStart}-${clipEnd}s]... SKIP (no audio)`)
          continue
        }

        // Check file size - Whisper limit is 25MB
        const fileSize = statSync(audioPath).size
        if (fileSize > 25 * 1024 * 1024) {
          console.log(`  [${completed + 1}/${limited.length}] ${videoId} ... file too large (${(fileSize / 1024 / 1024).toFixed(1)}MB), skipping`)
          failed++
          completed++
          continue
        }

        // Step 2: Transcribe FULL audio with Whisper
        const whisperResult = await transcribeWithOpenAI(audioPath)

        if (!whisperResult?.segments?.length) {
          failed++
          completed++
          console.log(`  [${completed}/${limited.length}] ${videoId} [${clipStart}-${clipEnd}s]... SKIP (whisper returned no segments)`)
          continue
        }

        // Save raw Whisper response
        await saveWhisperRaw(videoId, whisperResult)

        // Step 3: Use word-level timestamps if available
        const segments = rebuildSegmentsFromWords(whisperResult) || whisperResult.segments

        const audioDurationMin = (whisperResult.duration || 60) / 60
        const cost = audioDurationMin * 0.006

        // Step 4: Regroup and filter by clip range
        // timeOffsetSec is 0 since we sent the full audio
        let regenerated = regroupWhisperSegments(segments, {
          clipStart,
          clipEnd,
          timeOffsetSec: 0,
        })

        if (regenerated.length === 0) {
          failed++
          completed++
          console.log(`  [${completed}/${limited.length}] ${videoId} [${clipStart}-${clipEnd}s]... SKIP (no segments in clip range)`)
          continue
        }

        // Detect uniform timing
        if (regenerated.length >= 5 && hasUniformTiming(regenerated)) {
          console.log(`    WARN: Uniform timing detected for ${videoId}`)
        }

        // Try to preserve existing Korean translations
        const transcriptPath = join(TRANSCRIPTS_DIR, `${videoId}.json`)
        let koMatched = 0
        if (existsSync(transcriptPath)) {
          try {
            const existing = JSON.parse(await readFile(transcriptPath, 'utf-8'))
            const koMap = buildKoMap(existing)
            const existingKoEntries = Array.isArray(existing) ? existing.filter(entry => entry?.ko) : []
            for (const entry of regenerated) {
              const ko = findBestKoMatch(entry, koMap, existingKoEntries)
              if (ko) {
                entry.ko = ko
                koMatched++
              }
            }
          } catch {}
        }

        await writeFile(transcriptPath, JSON.stringify(regenerated, null, 2) + '\n', 'utf-8')

        persistQueue = persistQueue.then(async () => {
          await logCost(videoId, audioDurationMin, cost)
          markProcessed(videoId, cost)
          await saveManifest()
        })
        await persistQueue

        success++
        completed++
        console.log(`  [${completed}/${limited.length}] ${videoId} [${clipStart}-${clipEnd}s]... OK - ${regenerated.length} entries (${koMatched} ko) $${round2(cost * 10000) / 10000}`)
        await sleep(2000)
      } catch (error) {
        failed++
        completed++
        console.log(`  [${completed}/${limited.length}] ${videoId} [${clipStart}-${clipEnd}s]... FAILED: ${String(error.message || error).slice(0, 200)}`)
      } finally {
        await rm(tempDir, { recursive: true, force: true })
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(limited.length, 1)) }, () => worker())
  )

  const totalProcessed = Object.keys(manifest).length
  const totalManifestCost = Object.values(manifest).reduce((sum, entry) => sum + (entry.cost || 0), 0)

  console.log(`\nDone: ${success} regenerated, ${failed} failed`)
  console.log(`Session cost: $${round2(sessionCost * 10000) / 10000} (${round2(sessionMinutes)} min audio)`)
  console.log(`Total whispered: ${totalProcessed} videos | Lifetime cost: $${round2(totalManifestCost * 100) / 100}`)
}

// ─── Audio Download (FULL, no clipping) ─────────────────────────────

async function downloadFullAudioSmall(videoId, tempDir) {
  const outTemplate = join(tempDir, `${videoId}.%(ext)s`)
  try {
    execFileSync(
      'yt-dlp',
      [
        '--js-runtimes', 'node',
        '--remote-components', 'ejs:github',
        '--extractor-retries', '3',
        '--retries', '3',
        '-f', 'worstaudio',
        '--no-post-overwrites',
        '-o', outTemplate,
        `https://www.youtube.com/watch?v=${videoId}`,
      ],
      {
        stdio: 'pipe',
        timeout: 600000,
      }
    )
  } catch (err) {
    throw new Error(`yt-dlp download failed: ${String(err.message || err).slice(0, 150)}`)
  }

  const files = (await readdir(tempDir))
    .filter(file => file.startsWith(videoId))
    .map(file => join(tempDir, file))

  if (files.length === 0) {
    throw new Error('audio download produced no files')
  }

  // Pick largest file (in case multiple formats)
  files.sort((a, b) => statSync(b).size - statSync(a).size)
  return files[0]
}

// ─── Whisper API ─────────────────────────────────────────────────────

async function transcribeWithOpenAI(audioPath, retries = 3) {
  const { default: fs } = await import('fs')

  for (let attempt = 1; attempt <= retries; attempt++) {
    const formData = new FormData()
    const audioBuffer = fs.readFileSync(audioPath)
    const blob = new Blob([audioBuffer])
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'word')
    formData.append('timestamp_granularities[]', 'segment')
    formData.append('language', 'en')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: formData,
    })

    if (response.ok) {
      return await response.json()
    }

    const text = await response.text()
    if (response.status === 429 && attempt < retries) {
      const waitSec = 10 * attempt
      process.stdout.write(`RATE LIMITED, waiting ${waitSec}s... `)
      await sleep(waitSec * 1000)
      continue
    }

    throw new Error(`OpenAI API ${response.status}: ${text.slice(0, 200)}`)
  }
}

// ─── Segment Processing (reused from whisper-regenerate.mjs) ────────

function rebuildSegmentsFromWords(whisperResult) {
  const words = whisperResult.words
  if (!words || words.length < 2) return null

  const hasValidWordTimestamps = words.some((w, i) =>
    i > 0 && w.start !== words[i - 1].start && w.start > 0
  )
  if (!hasValidWordTimestamps) return null

  const segments = []
  let currentWords = []
  let segStart = words[0].start

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    currentWords.push(word.word.trim())

    const isEnd = i === words.length - 1
    const nextWord = words[i + 1]
    const gap = nextWord ? nextWord.start - word.end : 0
    const endsWithPunctuation = /[.!?,;]$/.test(word.word.trim())
    const currentDuration = word.end - segStart

    if (isEnd || (endsWithPunctuation && currentDuration >= 1.0) || gap > 0.7 || currentDuration >= 6) {
      segments.push({
        start: segStart,
        end: word.end,
        text: currentWords.join(' ').trim(),
      })
      currentWords = []
      if (nextWord) segStart = nextWord.start
    }
  }

  return segments.length > 0 ? segments : null
}

function regroupWhisperSegments(segments, { clipStart, clipEnd, timeOffsetSec }) {
  const isFullVideo = clipStart === 0 && clipEnd === 0
  const timed = segments
    .filter(segment => typeof segment?.text === 'string' && segment.text.trim().length > 0)
    .map(segment => ({
      startSec: round2(segment.start + timeOffsetSec),
      endSec: round2(segment.end + timeOffsetSec),
      text: normalizeWhisperText(segment.text),
    }))
    .filter(segment => segment.text)
    .filter(segment => isFullVideo || (segment.startSec >= clipStart - 1 && segment.startSec <= clipEnd + 1))
    .sort((a, b) => a.startSec - b.startSec || a.endSec - b.endSec)

  if (timed.length === 0) {
    return []
  }

  if (isFullVideo) {
    return normalizeGeneratedEntries(groupTimedTextIntoSubtitles(timed))
      .filter(entry => entry.end > entry.start + 0.2)
  }

  return normalizeGeneratedEntries(groupTimedTextIntoSubtitles(timed))
    .map(entry => ({
      ...entry,
      start: Math.max(clipStart, entry.start),
      end: Math.min(clipEnd, entry.end),
    }))
    .filter(entry => entry.end > entry.start + 0.2)
}

function groupTimedTextIntoSubtitles(events) {
  const subtitles = []
  let currentTexts = []
  let segStart = events[0].startSec
  let segEnd = events[0].endSec

  for (const event of events) {
    const text = event.text
    if (!text) continue

    if (currentTexts.length === 0) {
      segStart = event.startSec
      segEnd = event.endSec
      currentTexts.push(text)
      continue
    }

    const previousText = currentTexts[currentTexts.length - 1]
    if (
      isLikelyProgressiveDuplicate(
        { startSec: segStart, endSec: segEnd, text: previousText },
        { startSec: event.startSec, endSec: event.endSec, text },
        'text',
      )
    ) {
      currentTexts[currentTexts.length - 1] = text.length > previousText.length ? text : previousText
      segEnd = Math.max(segEnd, event.endSec)
      continue
    }

    const potentialDuration = event.endSec - segStart
    const potentialText = [...currentTexts, text].join(' ')

    if (potentialDuration <= TARGET_DURATION && potentialText.length <= MAX_TEXT_LENGTH) {
      currentTexts.push(text)
      segEnd = event.endSec
      continue
    }

    if (
      potentialDuration <= MAX_DURATION &&
      potentialText.length <= MAX_TEXT_LENGTH &&
      !endsWithSentenceBoundary(previousText)
    ) {
      currentTexts.push(text)
      segEnd = event.endSec
      continue
    }

    subtitles.push(makeEntry(segStart, segEnd, currentTexts))
    segStart = event.startSec
    segEnd = event.endSec
    currentTexts = [text]
  }

  if (currentTexts.length > 0) {
    subtitles.push(makeEntry(segStart, segEnd, currentTexts))
  }

  return subtitles
}

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

// ─── Helpers ─────────────────────────────────────────────────────────

function makeEntry(start, end, texts) {
  return {
    start: round2(start),
    end: round2(Math.min(Math.max(end, start + 0.8), start + 6.8)),
    en: texts.join(' ').replace(/\s+/g, ' ').trim(),
    ko: '',
  }
}

function normalizeWhisperText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim()
}

function hasUniformTiming(entries) {
  if (entries.length < 5) return false
  const durations = entries.map(e => Math.round((e.end - e.start) * 2) / 2)
  const counts = {}
  for (const d of durations) counts[d] = (counts[d] || 0) + 1
  const maxCount = Math.max(...Object.values(counts))
  return maxCount / entries.length >= 0.8
}

function buildKoMap(entries) {
  const map = new Map()
  for (const entry of entries) {
    if (entry.ko) {
      map.set(normalize(entry.en), entry.ko)
    }
  }
  return map
}

function findBestKoMatch(entry, koMap, existingEntries = []) {
  if (koMap.size === 0) return ''

  const norm = normalize(entry.en)
  if (koMap.has(norm)) return koMap.get(norm)

  for (const [key, ko] of koMap) {
    if (norm.includes(key) && key.length > 10) return ko
    if (key.includes(norm) && norm.length > 10) return ko
  }

  const timeMatched = findTimeAlignedKo(entry, existingEntries)
  if (timeMatched) return timeMatched

  const newWords = new Set(norm.split(/\s+/))
  if (newWords.size < 2) return ''

  let bestScore = 0
  let bestKo = ''
  for (const [key, ko] of koMap) {
    const oldWords = key.split(/\s+/)
    const overlap = oldWords.filter(word => newWords.has(word)).length
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
    if (!existing?.ko) continue
    const existingCenter = (existing.start + existing.end) / 2
    const distance = Math.abs(targetCenter - existingCenter)
    if (distance > 1.5) continue
    const similarity = overlapSimilarity(entry.en, existing.en ?? '')
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
    ? b : a
  return { ...preferred, ...overrides }
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

function endsWithSentenceBoundary(text) {
  return /[.!?]["']?\s*$/.test(text)
}

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function round2(value) {
  return Math.round(value * 100) / 100
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Manifest & Cost ─────────────────────────────────────────────────

async function saveManifest() {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')
}

function markProcessed(videoId, cost) {
  manifest[videoId] = {
    provider: 'openai',
    model: 'whisper-1',
    processedAt: new Date().toISOString(),
    cost: round2(cost * 10000) / 10000,
  }
}

async function logCost(videoId, durationMinutes, cost) {
  sessionCost += cost
  sessionMinutes += durationMinutes

  let log = []
  if (existsSync(COST_LOG_PATH)) {
    try {
      log = JSON.parse(await readFile(COST_LOG_PATH, 'utf-8'))
    } catch {
      log = []
    }
  }

  log.push({
    videoId,
    durationMinutes: round2(durationMinutes),
    cost: round2(cost * 10000) / 10000,
    timestamp: new Date().toISOString(),
  })

  await writeFile(COST_LOG_PATH, JSON.stringify(log, null, 2) + '\n', 'utf-8')
}

async function saveWhisperRaw(videoId, whisperResult) {
  if (!existsSync(WHISPER_RAW_DIR)) {
    mkdirSync(WHISPER_RAW_DIR, { recursive: true })
  }
  const rawPath = join(WHISPER_RAW_DIR, `${videoId}.json`)
  await writeFile(rawPath, JSON.stringify({
    savedAt: new Date().toISOString(),
    duration: whisperResult.duration,
    language: whisperResult.language,
    segments: whisperResult.segments,
    words: whisperResult.words || null,
  }, null, 2) + '\n', 'utf-8')
}

function getArgValue(name) {
  const arg = args.find(entry => entry.startsWith(`${name}=`))
  return arg ? arg.slice(name.length + 1) : null
}

main().catch(console.error)
