#!/usr/bin/env node
/**
 * Regenerate transcripts using OpenAI Whisper.
 *
 * Usage:
 *   node scripts/whisper-regenerate.mjs
 *   node scripts/whisper-regenerate.mjs --id=ABC
 *   node scripts/whisper-regenerate.mjs --ids-file=path/to/ids.json
 *   node scripts/whisper-regenerate.mjs --queue=needs_whisper --ids-file=src/data/content-existing-batch.json
 *   node scripts/whisper-regenerate.mjs --concurrency=3
 */

import { readFile, writeFile, mkdtemp, rm, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execFileSync } from 'child_process'
import { tmpdir } from 'os'
import { existsSync, readdirSync, statSync, mkdirSync } from 'fs'
import { loadEnv } from './lib/load-env.mjs'
import { loadSeedData } from './lib/load-seed-data.mjs'

loadEnv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const TRANSCRIPTS_DIR = join(__dirname, '..', 'public', 'transcripts')
const WHISPER_RAW_DIR = join(__dirname, '..', 'logs', 'whisper-raw')
const SEED_VIDEOS_PATH = join(__dirname, '..', 'src', 'data', 'seed-videos.ts')
const COST_LOG_PATH = join(__dirname, '..', 'whisper-cost-log.json')
const MANIFEST_PATH = join(__dirname, 'whisper-manifest.json')
const FFMPEG_LOCATION = resolveFfmpegLocation()
const TARGET_DURATION = 4
const MAX_DURATION = 6
const MAX_TEXT_LENGTH = 120

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY
if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY (or OPEN_API_KEY) environment variable required')
  process.exit(1)
}

if (FFMPEG_LOCATION === false) {
  console.warn('WARN: ffmpeg not found, falling back to full-audio downloads for Whisper input.')
}

const args = process.argv.slice(2)
const specificId = args.find(a => a.startsWith('--id='))?.split('=')[1]
const dryRun = args.includes('--dry')
const forceAll = args.includes('--force')
const queueName = getArgValue('--queue')
const idsFile = getArgValue('--ids-file')
const limit = Number.parseInt(getArgValue('--limit') || '0', 10)
const concurrency = Math.max(1, Number.parseInt(getArgValue('--concurrency') || '3', 10))

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
  const { seedVideos } = await loadSeedData(SEED_VIDEOS_PATH)
  const allVideos = dedupeVideos(
    seedVideos.map(video => ({
      youtubeId: video.youtubeId,
      clipStart: video.clipStart,
      clipEnd: video.clipEnd,
    }))
  )

  let toProcess = allVideos

  if (queueName) {
    const batch = await readBatchIds(idsFile)
    const ids = new Set(batch[queueName] ?? [])
    toProcess = allVideos.filter(video => ids.has(video.youtubeId))
  } else if (idsFile) {
    const batch = await readBatchIds(idsFile)
    const idsList = Array.isArray(batch) ? batch : batch.valid_ids ?? batch.ids ?? []
    const ids = new Set(idsList)
    const seedIds = new Set(allVideos.map(v => v.youtubeId))
    // Include IDs from file that are NOT in seed-videos as full shorts
    const extraVideos = idsList.filter(id => !seedIds.has(id)).map(id => ({ youtubeId: id, clipStart: 0, clipEnd: 0 }))
    toProcess = [...allVideos.filter(video => ids.has(video.youtubeId)), ...extraVideos]
  } else if (specificId) {
    toProcess = allVideos.filter(video => video.youtubeId === specificId)
  }

  if (limit > 0) {
    toProcess = toProcess.slice(0, limit)
  }

  console.log(`Processing ${toProcess.length} videos (OpenAI Whisper)\n`)

  let success = 0
  let failed = 0
  let skipped = 0
  let completed = 0
  let nextIndex = 0
  let persistQueue = Promise.resolve()

  async function worker() {
    while (true) {
      const currentIndex = nextIndex++
      if (currentIndex >= toProcess.length) {
        return
      }

      const videoInfo = toProcess[currentIndex]
      const videoId = videoInfo.youtubeId
      const { clipStart, clipEnd } = videoInfo

      if (dryRun) {
        completed++
        console.log(`  [${completed}/${toProcess.length}] ${videoId} [${clipStart}-${clipEnd}s]... WOULD PROCESS`)
        continue
      }

      if (!forceAll && isProcessed(videoId)) {
        skipped++
        completed++
        console.log(`  [${completed}/${toProcess.length}] ${videoId} [${clipStart}-${clipEnd}s]... SKIP (already whispered)`)
        continue
      }

      const tempDir = await mkdtemp(join(tmpdir(), 'whisper-'))

      try {
        let audioDownload = await downloadAudio(videoId, tempDir, 'bestaudio[ext=webm]/bestaudio', clipStart, clipEnd)

        if (!existsSync(audioDownload.audioPath)) {
          failed++
          completed++
          console.log(`  [${completed}/${toProcess.length}] ${videoId} [${clipStart}-${clipEnd}s]... SKIP (no audio)`)
          continue
        }

        let whisperResult
        try {
          whisperResult = await transcribeWithOpenAI(audioDownload.audioPath)
        } catch (error) {
          if (
            String(error.message).includes('OpenAI API 413') ||
            String(error.message).includes('could not be decoded')
          ) {
            audioDownload = await downloadClippedAudioWithYtDlp(
              videoId,
              tempDir,
              'worstaudio[ext=webm]/worstaudio/worstaudio',
              clipStart,
              clipEnd,
            )
            whisperResult = await transcribeWithOpenAI(audioDownload.audioPath)
          } else {
            throw error
          }
        }

        if (!whisperResult?.segments?.length) {
          failed++
          completed++
          console.log(`  [${completed}/${toProcess.length}] ${videoId} [${clipStart}-${clipEnd}s]... SKIP (whisper returned no segments)`)
          continue
        }

        // Save raw Whisper response for future reprocessing
        await saveWhisperRaw(videoId, whisperResult)

        // Use word-level timestamps if available for more accurate timing
        const segments = rebuildSegmentsFromWords(whisperResult) || whisperResult.segments

        const audioDurationMin = (whisperResult.duration || 60) / 60
        const cost = audioDurationMin * 0.006

        let regenerated = regroupWhisperSegments(segments, {
          clipStart,
          clipEnd,
          timeOffsetSec: audioDownload.timeOffsetSec,
        })

        // Detect uniform timing (broken Whisper) and warn
        if (regenerated.length >= 5 && hasUniformTiming(regenerated)) {
          console.log(`    ⚠ Uniform timing detected for ${videoId} — timestamps may be inaccurate`)
        }

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
        console.log(`  [${completed}/${toProcess.length}] ${videoId} [${clipStart}-${clipEnd}s]... OK - ${regenerated.length} entries (${koMatched} ko) $${round2(cost * 10000) / 10000}`)
        await sleep(2000)
      } catch (error) {
        failed++
        completed++
        console.log(`  [${completed}/${toProcess.length}] ${videoId} [${clipStart}-${clipEnd}s]... FAILED: ${String(error.message || error).slice(0, 120)}`)
      } finally {
        await rm(tempDir, { recursive: true, force: true })
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, Math.max(toProcess.length, 1)) }, () => worker())
  )

  const totalProcessed = Object.keys(manifest).length
  const totalManifestCost = Object.values(manifest).reduce((sum, entry) => sum + (entry.cost || 0), 0)

  console.log(`\nDone: ${success} regenerated, ${failed} failed, ${skipped} skipped`)
  console.log(`Session cost: $${round2(sessionCost * 10000) / 10000} (${round2(sessionMinutes)} min audio)`)
  console.log(`Total whispered: ${totalProcessed} videos | Lifetime cost: $${round2(totalManifestCost * 100) / 100}`)
}

async function saveManifest() {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf-8')
}

function isProcessed(videoId) {
  return !!manifest[videoId]
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

async function transcribeWithOpenAI(audioPath, retries = 3, granularity = 'word') {
  const { default: fs } = await import('fs')

  for (let attempt = 1; attempt <= retries; attempt++) {
    const formData = new FormData()
    const audioBuffer = fs.readFileSync(audioPath)
    const blob = new Blob([audioBuffer])
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', granularity)
    if (granularity === 'word') {
      formData.append('timestamp_granularities[]', 'segment')
    }
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

/**
 * Rebuild segments from word-level timestamps for more accurate timing.
 * Groups words into sentence-like segments based on punctuation and pauses.
 */
/**
 * Save raw Whisper API response for future reprocessing without re-calling API.
 * Stored in logs/whisper-raw/{videoId}.json
 */
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

function rebuildSegmentsFromWords(whisperResult) {
  const words = whisperResult.words
  if (!words || words.length < 2) return null

  // Check if word timestamps are valid (not all zeros or uniform)
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

    // Split on: sentence-ending punctuation, long pauses, or max duration
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

/**
 * Detect uniform timing pattern (broken Whisper timestamps).
 * Returns true if 80%+ of subtitles have the same duration.
 */
function hasUniformTiming(entries) {
  if (entries.length < 5) return false
  const durations = entries.map(e => Math.round((e.end - e.start) * 2) / 2) // round to 0.5s
  const counts = {}
  for (const d of durations) counts[d] = (counts[d] || 0) + 1
  const maxCount = Math.max(...Object.values(counts))
  return maxCount / entries.length >= 0.8
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

function makeEntry(start, end, texts) {
  return {
    start: round2(start),
    end: round2(Math.min(Math.max(end, start + 0.8), start + 6.8)),
    en: texts.join(' ').replace(/\s+/g, ' ').trim(),
    ko: '',
  }
}

function normalizeWhisperText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
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

async function downloadAudio(videoId, tempDir, format, clipStart, clipEnd) {
  const isFullVideo = clipStart === 0 && clipEnd === 0
  if (isFullVideo) {
    return downloadFullAudio(videoId, tempDir, format)
  }
  if (FFMPEG_LOCATION !== false) {
    try {
      return streamClipAudio(videoId, tempDir, format, clipStart, clipEnd)
    } catch {
      return downloadClippedAudioWithYtDlp(videoId, tempDir, format, clipStart, clipEnd)
    }
  }

  return downloadFullAudio(videoId, tempDir, format)
}

async function downloadClippedAudioWithYtDlp(videoId, tempDir, format, clipStart, clipEnd) {
  const downloaded = await downloadFullAudio(videoId, tempDir, format)
  if (FFMPEG_LOCATION === false) {
    return downloaded
  }

  const sectionStart = Math.max(0, round2(clipStart - 1))
  const sectionDuration = Math.max(1, round2(clipEnd + 1 - sectionStart))
  const clippedPath = join(tempDir, `${videoId}.clip.mp3`)
  execFileSync(
    resolveFfmpegCommand(),
    [
      '-y',
      '-ss',
      String(sectionStart),
      '-t',
      String(sectionDuration),
      '-i',
      downloaded.audioPath,
      '-vn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '64k',
      clippedPath,
    ],
    {
      stdio: 'pipe',
      timeout: 600000,
    }
  )

  return {
    audioPath: clippedPath,
    timeOffsetSec: sectionStart,
  }
}

async function downloadFullAudio(videoId, tempDir, format) {
  const outTemplate = join(tempDir, `${videoId}.%(ext)s`)
  execFileSync(
    'yt-dlp',
    ['--js-runtimes', 'node', '--remote-components', 'ejs:github', '--extractor-retries', '3', '--retries', '3', '-f', format, '--no-post-overwrites', '-o', outTemplate, `https://www.youtube.com/watch?v=${videoId}`],
    {
      stdio: 'pipe',
      timeout: 600000,
    }
  )

  const files = (await readdir(tempDir))
    .filter(file => file.startsWith(videoId))
    .map(file => join(tempDir, file))

  if (files.length === 0) {
    throw new Error('audio download produced no files')
  }

  files.sort((a, b) => statSync(b).size - statSync(a).size)
  return {
    audioPath: files[0],
    timeOffsetSec: 0,
  }
}

function streamClipAudio(videoId, tempDir, format, clipStart, clipEnd) {
  const sectionStart = Math.max(0, round2(clipStart - 1))
  const sectionDuration = Math.max(1, round2(clipEnd + 1 - sectionStart))
  const audioUrl = execFileSync(
    'yt-dlp',
    ['--js-runtimes', 'node', '--remote-components', 'ejs:github', '--extractor-retries', '3', '--retries', '3', '-f', format, '-g', `https://www.youtube.com/watch?v=${videoId}`],
    {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 120000,
    }
  )
    .split(/\r?\n/)
    .find(Boolean)
    ?.trim()

  if (!audioUrl) {
    throw new Error('yt-dlp returned no direct audio url')
  }

  const audioPath = join(tempDir, `${videoId}.mp3`)
  execFileSync(
    resolveFfmpegCommand(),
    [
      '-y',
      '-ss',
      String(sectionStart),
      '-t',
      String(sectionDuration),
      '-i',
      audioUrl,
      '-vn',
      '-ac',
      '1',
      '-ar',
      '16000',
      '-c:a',
      'libmp3lame',
      '-b:a',
      '64k',
      audioPath,
    ],
    {
      stdio: 'pipe',
      timeout: 600000,
    }
  )

  return {
    audioPath,
    timeOffsetSec: sectionStart,
  }
}

function dedupeVideos(videos) {
  const seen = new Set()
  return videos.filter(video => {
    if (seen.has(video.youtubeId)) return false
    seen.add(video.youtubeId)
    return true
  })
}

async function readBatchIds(filePath) {
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw.replace(/^\uFEFF/, ''))
}

function getArgValue(name) {
  const arg = args.find(entry => entry.startsWith(`${name}=`))
  return arg ? arg.slice(name.length + 1) : null
}

function resolveFfmpegLocation() {
  if (process.env.FFMPEG_LOCATION?.trim()) {
    return process.env.FFMPEG_LOCATION.trim()
  }

  if (commandExists('ffmpeg')) {
    return null
  }

  const packagesRoot = join(process.env.LOCALAPPDATA ?? '', 'Microsoft', 'WinGet', 'Packages')
  if (!existsSync(packagesRoot)) {
    return false
  }

  const packageDirs = readdirSync(packagesRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .filter(name => /^(yt-dlp\.FFmpeg|Gyan\.FFmpeg|BtbN\.FFmpeg)/i.test(name))

  for (const dirName of packageDirs) {
    const ffmpegExe = findFileRecursive(join(packagesRoot, dirName), 'ffmpeg.exe', 5)
    if (ffmpegExe) {
      return dirname(ffmpegExe)
    }
  }

  return false
}

function commandExists(command) {
  try {
    execFileSync('where.exe', [command], { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

function resolveFfmpegCommand() {
  if (FFMPEG_LOCATION && FFMPEG_LOCATION !== false) {
    return join(FFMPEG_LOCATION, 'ffmpeg.exe')
  }
  return 'ffmpeg'
}

function findFileRecursive(rootDir, targetName, maxDepth, depth = 0) {
  if (depth > maxDepth || !existsSync(rootDir)) {
    return null
  }

  const entries = readdirSync(rootDir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(rootDir, entry.name)
    if (entry.isFile() && entry.name.toLowerCase() === targetName) {
      return fullPath
    }
    if (entry.isDirectory()) {
      const match = findFileRecursive(fullPath, targetName, maxDepth, depth + 1)
      if (match) {
        return match
      }
    }
  }

  return null
}

main().catch(console.error)
