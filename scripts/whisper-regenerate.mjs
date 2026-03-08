#!/usr/bin/env node
/**
 * Regenerate all transcripts using OpenAI Whisper API.
 * 1. Download audio via yt-dlp
 * 2. Transcribe with Whisper (accurate timing + text)
 * 3. Merge short segments, cap duration
 * 4. Save as JSON (ko will be translated separately by Claude)
 *
 * Usage:
 *   node scripts/whisper-regenerate.mjs           # Regenerate all
 *   node scripts/whisper-regenerate.mjs --id=ABC  # Specific video
 *   node scripts/whisper-regenerate.mjs --dry      # Dry run
 *   node scripts/whisper-regenerate.mjs --skip-done # Skip existing
 *   node scripts/whisper-regenerate.mjs --force    # Force re-process all
 */

import { readFile, writeFile, mkdtemp, rm, appendFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { tmpdir } from 'os'
import { existsSync, statSync } from 'fs'
import { loadEnv } from './lib/load-env.mjs'

loadEnv()

const __dirname = dirname(fileURLToPath(import.meta.url))
const TRANSCRIPTS_DIR = join(__dirname, '..', 'public', 'transcripts')
const SEED_VIDEOS_PATH = join(__dirname, '..', 'src', 'data', 'seed-videos.ts')
const COST_LOG_PATH = join(__dirname, '..', 'whisper-cost-log.json')
const MANIFEST_PATH = join(__dirname, 'whisper-manifest.json')

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY environment variable required')
  process.exit(1)
}

const args = process.argv.slice(2)
const specificId = args.find(a => a.startsWith('--id='))?.split('=')[1]
const dryRun = args.includes('--dry')
const forceAll = args.includes('--force')

// Manifest: tracks which videos have been Whisper-processed (prevents duplicate cost)
let manifest = {}
if (existsSync(MANIFEST_PATH)) {
  try { manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf-8')) } catch { manifest = {} }
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

function extractVideoInfo(seedContent) {
  const videos = []
  const blocks = seedContent.split(/\{[^}]*youtubeId:/g).slice(1)
  for (const block of blocks) {
    const idMatch = block.match(/^\s*'([^']+)'/)
    const startMatch = block.match(/clipStart:\s*(\d+)/)
    const endMatch = block.match(/clipEnd:\s*(\d+)/)
    if (idMatch) {
      videos.push({
        youtubeId: idMatch[1],
        clipStart: startMatch ? parseInt(startMatch[1]) : 0,
        clipEnd: endMatch ? parseInt(endMatch[1]) : 60,
      })
    }
  }
  const seen = new Set()
  return videos.filter(v => { if (seen.has(v.youtubeId)) return false; seen.add(v.youtubeId); return true })
}

// Cost tracking
let sessionCost = 0
let sessionMinutes = 0

async function logCost(videoId, durationMinutes, cost) {
  sessionCost += cost
  sessionMinutes += durationMinutes

  let log = []
  if (existsSync(COST_LOG_PATH)) {
    try { log = JSON.parse(await readFile(COST_LOG_PATH, 'utf-8')) } catch {}
  }
  log.push({
    videoId,
    durationMinutes: round2(durationMinutes),
    cost: round2(cost * 10000) / 10000,
    timestamp: new Date().toISOString(),
  })
  await writeFile(COST_LOG_PATH, JSON.stringify(log, null, 2) + '\n', 'utf-8')
}

async function main() {
  const seedContent = await readFile(SEED_VIDEOS_PATH, 'utf-8')
  const allVideos = extractVideoInfo(seedContent)

  const toProcess = specificId
    ? allVideos.filter(v => v.youtubeId === specificId)
    : allVideos

  console.log(`Processing ${toProcess.length} videos (OpenAI Whisper)\n`)

  let success = 0
  let failed = 0
  let skipped = 0

  for (const videoInfo of toProcess) {
    const videoId = videoInfo.youtubeId
    const { clipStart, clipEnd } = videoInfo
    process.stdout.write(`  ${videoId} [${clipStart}-${clipEnd}s]... `)

    if (dryRun) {
      console.log('WOULD PROCESS')
      continue
    }

    // Check manifest — never re-process unless --force
    if (!forceAll && isProcessed(videoId)) {
      console.log('SKIP (already whispered)')
      skipped++
      continue
    }

    const tempDir = await mkdtemp(join(tmpdir(), 'whisper-'))

    try {
      // 1. Download full audio
      const audioPath = join(tempDir, `${videoId}.webm`)
      execSync(
        `yt-dlp -f "bestaudio[ext=webm]/bestaudio" --no-post-overwrites -o "${audioPath}" "https://www.youtube.com/watch?v=${videoId}"`,
        { stdio: 'pipe', timeout: 120000 }
      )

      if (!existsSync(audioPath)) {
        console.log('SKIP (no audio)')
        failed++
        continue
      }

      // Get file size for cost estimation
      const fileStat = statSync(audioPath)
      const fileSizeMB = fileStat.size / (1024 * 1024)

      // 2. Transcribe with OpenAI Whisper
      const whisperResult = await transcribeWithOpenAI(audioPath)
      if (!whisperResult || !whisperResult.segments || whisperResult.segments.length === 0) {
        console.log('SKIP (whisper returned no segments)')
        failed++
        continue
      }

      // Track cost (duration from whisper response)
      const audioDurationMin = (whisperResult.duration || 60) / 60
      const cost = audioDurationMin * 0.006
      await logCost(videoId, audioDurationMin, cost)

      // 3. Build subtitle entries — filter to clip range only
      const entries = whisperResult.segments
        .filter(s => s.text.trim().length > 0)
        .map(s => ({
          start: round2(s.start),
          end: round2(s.end),
          en: s.text.trim(),
          ko: ''
        }))
        .filter(s => s.start >= clipStart - 1 && s.start <= clipEnd + 1)

      // Merge very short segments (<1.5s) into previous if combined <= 7s
      const merged = []
      for (const e of entries) {
        const dur = e.end - e.start
        if (merged.length > 0 && dur < 1.5 && (e.end - merged[merged.length - 1].start) <= 7) {
          merged[merged.length - 1].en += ' ' + e.en
          merged[merged.length - 1].end = e.end
        } else {
          merged.push({ ...e })
        }
      }

      // Cap duration at 7s
      for (const e of merged) {
        if (e.end - e.start > 7) e.end = round2(e.start + 7)
      }

      // 4. Match existing Korean translations
      const existingPath = join(TRANSCRIPTS_DIR, `${videoId}.json`)
      let koMatched = 0
      if (existsSync(existingPath)) {
        try {
          const existing = JSON.parse(await readFile(existingPath, 'utf-8'))
          const koMap = buildKoMap(existing)
          for (const entry of merged) {
            const ko = findBestKoMatch(entry.en, koMap)
            if (ko) {
              entry.ko = ko
              koMatched++
            }
          }
        } catch {}
      }

      // 5. Save
      await writeFile(existingPath, JSON.stringify(merged, null, 2) + '\n', 'utf-8')

      // Mark as processed in manifest (prevents future duplicate cost)
      markProcessed(videoId, cost)
      await saveManifest()

      console.log(`OK - ${merged.length} entries (${koMatched} ko) $${round2(cost * 10000) / 10000}`)
      success++

      // Rate limit (OpenAI is generous, 2s is enough)
      await sleep(2000)
    } catch (err) {
      console.log(`FAILED: ${err.message.slice(0, 120)}`)
      failed++
    } finally {
      await rm(tempDir, { recursive: true, force: true })
    }
  }

  // Final manifest stats
  const totalProcessed = Object.keys(manifest).length
  const totalManifestCost = Object.values(manifest).reduce((s, e) => s + (e.cost || 0), 0)

  console.log(`\nDone: ${success} regenerated, ${failed} failed, ${skipped} skipped`)
  console.log(`Session cost: $${round2(sessionCost * 10000) / 10000} (${round2(sessionMinutes)} min audio)`)
  console.log(`Total whispered: ${totalProcessed} videos | Lifetime cost: $${round2(totalManifestCost * 100) / 100}`)
}

async function transcribeWithOpenAI(audioPath, retries = 3) {
  const { default: fs } = await import('fs')

  for (let attempt = 1; attempt <= retries; attempt++) {
    const formData = new FormData()
    const audioBuffer = fs.readFileSync(audioPath)
    const blob = new Blob([audioBuffer])
    formData.append('file', blob, 'audio.webm')
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'segment')
    formData.append('language', 'en')

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: formData,
    })

    if (res.ok) {
      return await res.json()
    }

    const text = await res.text()
    if (res.status === 429 && attempt < retries) {
      const waitSec = 10 * attempt
      process.stdout.write(`RATE LIMITED, waiting ${waitSec}s... `)
      await sleep(waitSec * 1000)
      continue
    }

    throw new Error(`OpenAI API ${res.status}: ${text.slice(0, 200)}`)
  }
}

function buildKoMap(entries) {
  const map = new Map()
  for (const entry of entries) {
    if (entry.ko) map.set(normalize(entry.en), entry.ko)
  }
  return map
}

function findBestKoMatch(en, koMap) {
  if (koMap.size === 0) return ''
  const norm = normalize(en)
  if (koMap.has(norm)) return koMap.get(norm)

  for (const [key, ko] of koMap) {
    if (norm.includes(key) && key.length > 10) return ko
    if (key.includes(norm) && norm.length > 10) return ko
  }

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

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

function round2(n) {
  return Math.round(n * 100) / 100
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(console.error)
