#!/usr/bin/env node
/**
 * Find videos in seed-videos.ts that are missing static transcripts.
 * Cross-references seed data against:
 *   1. whisper-manifest.json (whisper processing records)
 *   2. public/transcripts/ directory (actual transcript files)
 *
 * Output: output/missing-transcripts.json
 */

import { readFile, writeFile, readdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { loadSeedData } from './lib/load-seed-data.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SEED_PATH = join(ROOT, 'src', 'data', 'seed-videos.ts')
const MANIFEST_PATH = join(__dirname, 'whisper-manifest.json')
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts')
const OUTPUT_PATH = join(ROOT, 'output', 'missing-transcripts.json')

async function main() {
  // 1. Load seed videos
  const { seedVideos } = await loadSeedData(SEED_PATH)
  console.log(`Seed videos: ${seedVideos.length}`)

  // 2. Load whisper manifest
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf-8'))
  const manifestIds = new Set(Object.keys(manifest))
  console.log(`Whisper manifest entries: ${manifestIds.size}`)

  // 3. Read actual transcript files on disk
  const transcriptFiles = await readdir(TRANSCRIPTS_DIR)
  const transcriptIds = new Set(
    transcriptFiles
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  )
  console.log(`Transcript files on disk: ${transcriptIds.size}`)

  // 4. Find missing — a video is "missing" if no transcript file on disk
  const missing = []
  const hasTranscript = []

  for (const video of seedVideos) {
    const id = video.youtubeId
    if (!transcriptIds.has(id)) {
      missing.push({
        youtubeId: id,
        title: video.title,
        category: video.category,
        seriesId: video.seriesId || null,
        difficulty: video.difficulty,
        inManifest: manifestIds.has(id),
      })
    } else {
      hasTranscript.push(id)
    }
  }

  console.log(`\n=== SUMMARY ===`)
  console.log(`Videos with transcripts: ${hasTranscript.length}`)
  console.log(`Videos MISSING transcripts: ${missing.length}`)

  // 5. Check for manifest entries that have no seed video (orphans)
  const seedIds = new Set(seedVideos.map(v => v.youtubeId))
  const manifestOnlyIds = [...manifestIds].filter(id => !seedIds.has(id))
  const transcriptOnlyIds = [...transcriptIds].filter(id => !seedIds.has(id))
  console.log(`Manifest entries not in seed: ${manifestOnlyIds.length}`)
  console.log(`Transcript files not in seed: ${transcriptOnlyIds.length}`)

  // 6. Group by category
  const byCategory = {}
  for (const v of missing) {
    byCategory[v.category] = byCategory[v.category] || []
    byCategory[v.category].push(v)
  }

  console.log(`\n--- Missing by Category ---`)
  for (const [cat, items] of Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${cat}: ${items.length}`)
  }

  // 7. Group by difficulty
  const byDifficulty = {}
  for (const v of missing) {
    const d = v.difficulty
    byDifficulty[d] = byDifficulty[d] || []
    byDifficulty[d].push(v)
  }

  console.log(`\n--- Missing by Difficulty ---`)
  for (const [diff, items] of Object.entries(byDifficulty).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    console.log(`  Level ${diff}: ${items.length}`)
  }

  // 8. Check which missing have manifest entries (whisper ran but no file?)
  const missingWithManifest = missing.filter(v => v.inManifest)
  const missingNoManifest = missing.filter(v => !v.inManifest)
  console.log(`\n--- Manifest Status of Missing ---`)
  console.log(`  In manifest (whisper ran, but no transcript file): ${missingWithManifest.length}`)
  console.log(`  Not in manifest (never processed): ${missingNoManifest.length}`)

  // 9. Group by series
  const bySeries = {}
  for (const v of missing) {
    const key = v.seriesId || '(no series)'
    bySeries[key] = bySeries[key] || []
    bySeries[key].push(v)
  }

  console.log(`\n--- Missing by Series (top 15) ---`)
  const sortedSeries = Object.entries(bySeries).sort((a, b) => b[1].length - a[1].length)
  for (const [series, items] of sortedSeries.slice(0, 15)) {
    console.log(`  ${series}: ${items.length}`)
  }

  // 10. Save output
  const output = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalSeedVideos: seedVideos.length,
      withTranscripts: hasTranscript.length,
      missingTranscripts: missing.length,
      inManifestButNoFile: missingWithManifest.length,
      neverProcessed: missingNoManifest.length,
      manifestOrphans: manifestOnlyIds.length,
      transcriptOrphans: transcriptOnlyIds.length,
    },
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([k, v]) => [k, { count: v.length, youtubeIds: v.map(x => x.youtubeId) }])
    ),
    byDifficulty: Object.fromEntries(
      Object.entries(byDifficulty).map(([k, v]) => [k, { count: v.length, youtubeIds: v.map(x => x.youtubeId) }])
    ),
    bySeries: Object.fromEntries(
      Object.entries(bySeries).map(([k, v]) => [k, { count: v.length, youtubeIds: v.map(x => x.youtubeId) }])
    ),
    missing,
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8')
  console.log(`\nSaved to: ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
