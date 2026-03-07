/**
 * Pre-bake transcripts for all seed videos.
 * Downloads English subtitles from YouTube, optionally translates to Korean,
 * and saves as static JSON files in public/transcripts/.
 *
 * Usage:
 *   npx tsx scripts/prebake-transcripts.ts
 *   ANTHROPIC_API_KEY=sk-... npx tsx scripts/prebake-transcripts.ts  (with translation)
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'

// We'll dynamically import youtube-transcript since it's ESM
async function main() {
  const { YoutubeTranscript } = await import('youtube-transcript')

  // Read seed videos to get all YouTube IDs
  const seedPath = join(__dirname, '..', 'src', 'data', 'seed-videos.ts')
  const seedContent = readFileSync(seedPath, 'utf-8')

  // Extract all youtubeId values
  const idMatches = [...seedContent.matchAll(/youtubeId:\s*'([^']+)'/g)]
  const youtubeIds = idMatches.map((m) => m[1])

  console.log(`Found ${youtubeIds.length} videos to process`)

  const outDir = join(__dirname, '..', 'public', 'transcripts')
  mkdirSync(outDir, { recursive: true })

  let translated = 0
  let skipped = 0
  let failed = 0

  for (const videoId of youtubeIds) {
    const outFile = join(outDir, `${videoId}.json`)

    // Skip if already exists
    if (existsSync(outFile)) {
      const existing = JSON.parse(readFileSync(outFile, 'utf-8'))
      if (Array.isArray(existing) && existing.length > 0) {
        console.log(`  SKIP ${videoId} (already exists, ${existing.length} entries)`)
        skipped++
        continue
      }
    }

    try {
      console.log(`  FETCH ${videoId}...`)

      // Try English first, then auto-generated
      let raw = await fetchTranscript(YoutubeTranscript, videoId, 'en')
      if (!raw || raw.length === 0) {
        raw = await fetchTranscript(YoutubeTranscript, videoId)
      }

      if (!raw || raw.length === 0) {
        console.log(`  WARN ${videoId}: No transcript available`)
        failed++
        continue
      }

      const grouped = groupTranscriptEntries(raw)
      console.log(`  OK ${videoId}: ${grouped.length} subtitle entries`)

      // Optionally translate
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (apiKey) {
        console.log(`  TRANSLATE ${videoId}...`)
        await translateSubtitles(grouped, apiKey)
        translated++
      }

      writeFileSync(outFile, JSON.stringify(grouped, null, 2), 'utf-8')
      console.log(`  SAVED ${outFile}`)
    } catch (err) {
      console.error(`  ERROR ${videoId}:`, err)
      failed++
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 500))
  }

  console.log(`\nDone! Translated: ${translated}, Skipped: ${skipped}, Failed: ${failed}`)
}

async function fetchTranscript(
  YT: typeof import('youtube-transcript').YoutubeTranscript,
  videoId: string,
  lang?: string
) {
  try {
    const config = lang ? { lang } : undefined
    return await YT.fetchTranscript(videoId, config)
  } catch {
    return null
  }
}

interface SubEntry {
  start: number
  end: number
  en: string
  ko: string
}

function groupTranscriptEntries(
  raw: { text: string; offset: number; duration: number }[]
): SubEntry[] {
  if (raw.length === 0) return []

  const TARGET_DURATION = 4
  const MAX_DURATION = 6
  const subtitles: SubEntry[] = []
  let currentTexts: string[] = []
  let segmentStart = raw[0].offset / 1000
  let segmentEnd = segmentStart

  for (const entry of raw) {
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
      if (potentialDuration <= TARGET_DURATION) {
        currentTexts.push(text)
        segmentEnd = entryEnd
      } else if (
        potentialDuration <= MAX_DURATION &&
        !/[.!?]["']?\s*$/.test(currentTexts[currentTexts.length - 1])
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

async function translateSubtitles(entries: SubEntry[], apiKey: string) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })
  const BATCH_SIZE = 50

  for (let batchStart = 0; batchStart < entries.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, entries.length)
    const batch = entries.slice(batchStart, batchEnd)
    const englishTexts = batch.map((e, i) => `${i}: ${e.en}`).join('\n')

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `Translate each numbered English sentence to natural, conversational Korean. Return ONLY the translations, one per line, with the same number prefix. Do not add any explanation.\n\n${englishTexts}`,
          },
        ],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const lines = text.split('\n').filter((l) => l.trim())

      for (let i = 0; i < batch.length; i++) {
        const line = lines.find((l) => l.startsWith(`${i}:`))
        if (line) {
          entries[batchStart + i].ko = line.replace(/^\d+:\s*/, '').trim()
        }
      }
    } catch (err) {
      console.error('  Translation batch failed:', err)
    }
  }
}

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n/g, ' ')
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

main().catch(console.error)
