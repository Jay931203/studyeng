#!/usr/bin/env node
/**
 * Pre-bake Transcript Generator
 *
 * Fetches YouTube auto-captions for all seed videos,
 * segments them into 3-6 second chunks, and translates to Korean via Claude API.
 *
 * Usage:
 *   node scripts/generate-transcripts.mjs              # Generate missing only
 *   node scripts/generate-transcripts.mjs --all        # Regenerate all
 *   node scripts/generate-transcripts.mjs --id=ABC123  # Generate specific video
 *   node scripts/generate-transcripts.mjs --check      # Dry run, show what would be generated
 *
 * Requires:
 *   ANTHROPIC_API_KEY env variable for Korean translation
 *   npm package: youtube-transcript
 */

import { readdir, readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TRANSCRIPTS_DIR = join(__dirname, '..', 'public', 'transcripts')
const SEED_VIDEOS_PATH = join(__dirname, '..', 'src', 'data', 'seed-videos.ts')

const TARGET_DURATION = 4
const MAX_DURATION = 6
const MAX_TEXT_LENGTH = 120

const args = process.argv.slice(2)
const regenerateAll = args.includes('--all')
const checkOnly = args.includes('--check')
const specificId = args.find(a => a.startsWith('--id='))?.split('=')[1]

async function main() {
  // Dynamically import youtube-transcript
  const { YoutubeTranscript } = await import('youtube-transcript')

  // Extract YouTube IDs from seed-videos.ts
  const seedContent = await readFile(SEED_VIDEOS_PATH, 'utf-8')
  const youtubeIds = [...seedContent.matchAll(/youtubeId:\s*'([^']+)'/g)].map(m => m[1])

  console.log(`Found ${youtubeIds.length} seed videos\n`)

  // Get existing transcript files
  const existingFiles = new Set(
    (await readdir(TRANSCRIPTS_DIR))
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  )

  // Determine which videos to process
  let toProcess = youtubeIds
  if (specificId) {
    toProcess = [specificId]
  } else if (!regenerateAll) {
    toProcess = youtubeIds.filter(id => !existingFiles.has(id))
  }

  if (toProcess.length === 0) {
    console.log('All transcripts are up to date! Use --all to regenerate.')
    return
  }

  console.log(`Will ${checkOnly ? 'check' : 'generate'} ${toProcess.length} transcripts:\n`)

  let success = 0
  let failed = 0

  for (const videoId of toProcess) {
    process.stdout.write(`  ${videoId}... `)

    if (checkOnly) {
      console.log(existingFiles.has(videoId) ? 'EXISTS (would regenerate with --all)' : 'MISSING (would generate)')
      continue
    }

    try {
      // Fetch transcript from YouTube
      let rawTranscript = await fetchTranscript(YoutubeTranscript, videoId, 'en')
      if (!rawTranscript || rawTranscript.length === 0) {
        rawTranscript = await fetchTranscript(YoutubeTranscript, videoId)
      }

      if (!rawTranscript || rawTranscript.length === 0) {
        console.log('SKIP (no transcript available)')
        failed++
        continue
      }

      // Group into segments
      const grouped = groupTranscriptEntries(rawTranscript)

      // Translate to Korean
      const translated = await translateSubtitles(grouped)

      // Validate quality
      const issues = validateTranscript(translated)
      const issueWarning = issues > 0 ? ` (${issues} quality warnings)` : ''

      // Write to file
      const outPath = join(TRANSCRIPTS_DIR, `${videoId}.json`)
      await writeFile(outPath, JSON.stringify(translated, null, 2) + '\n', 'utf-8')
      console.log(`OK - ${translated.length} entries${issueWarning}`)
      success++

      // Rate limit to be nice to YouTube and Claude API
      await sleep(1000)
    } catch (err) {
      console.log(`FAILED: ${err.message}`)
      failed++
    }
  }

  if (!checkOnly) {
    console.log(`\nDone: ${success} generated, ${failed} failed`)
  }
}

async function fetchTranscript(YoutubeTranscript, videoId, lang) {
  try {
    const config = lang ? { lang } : undefined
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, config)
    return transcript.map(entry => ({
      text: entry.text,
      offset: entry.offset,
      duration: entry.duration,
    }))
  } catch {
    return null
  }
}

function groupTranscriptEntries(raw) {
  if (raw.length === 0) return []

  const subtitles = []
  let currentTexts = []
  let segmentStart = raw[0].offset / 1000
  let segmentEnd = segmentStart

  for (let i = 0; i < raw.length; i++) {
    const entry = raw[i]
    const entryStart = entry.offset / 1000
    const entryEnd = entryStart + entry.duration / 1000
    const text = decodeHTMLEntities(entry.text).trim()

    if (!text) continue

    if (currentTexts.length === 0) {
      segmentStart = entryStart
      segmentEnd = entryEnd
      currentTexts.push(text)
    } else {
      const potentialDuration = entryEnd - segmentStart
      const potentialText = [...currentTexts, text].join(' ')

      if (potentialDuration <= TARGET_DURATION && potentialText.length <= MAX_TEXT_LENGTH) {
        currentTexts.push(text)
        segmentEnd = entryEnd
      } else if (
        potentialDuration <= MAX_DURATION &&
        potentialText.length <= MAX_TEXT_LENGTH &&
        !endsWithSentenceBoundary(currentTexts[currentTexts.length - 1])
      ) {
        currentTexts.push(text)
        segmentEnd = entryEnd
      } else {
        subtitles.push({
          start: round2(segmentStart),
          end: round2(segmentEnd),
          en: currentTexts.join(' '),
          ko: '',
        })
        segmentStart = entryStart
        segmentEnd = entryEnd
        currentTexts = [text]
      }
    }
  }

  if (currentTexts.length > 0) {
    subtitles.push({
      start: round2(segmentStart),
      end: round2(segmentEnd),
      en: currentTexts.join(' '),
      ko: '',
    })
  }

  return subtitles
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

async function translateSubtitles(entries) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || entries.length === 0) {
    console.log('(no ANTHROPIC_API_KEY, skipping translation) ')
    return entries
  }

  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic({ apiKey })

    const BATCH_SIZE = 50
    const translated = [...entries]

    for (let batchStart = 0; batchStart < entries.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, entries.length)
      const batch = entries.slice(batchStart, batchEnd)

      const englishTexts = batch.map((e, i) => `${i}: ${e.en}`).join('\n')

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Translate each numbered English sentence to natural, conversational Korean. Return ONLY the translations, one per line, with the same number prefix. Do not add any explanation.\n\n${englishTexts}`,
        }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const lines = text.split('\n').filter(l => l.trim())

      for (let i = 0; i < batch.length; i++) {
        const line = lines.find(l => l.startsWith(`${i}:`))
        if (line) {
          translated[batchStart + i] = {
            ...translated[batchStart + i],
            ko: line.replace(/^\d+:\s*/, '').trim(),
          }
        }
      }
    }

    return translated
  } catch (err) {
    console.log(`(translation error: ${err.message}) `)
    return entries
  }
}

function validateTranscript(entries) {
  let issues = 0
  for (const entry of entries) {
    if (entry.end - entry.start > 7) issues++
    if (entry.en.length > 120) issues++
  }
  return issues
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

main().catch(console.error)
