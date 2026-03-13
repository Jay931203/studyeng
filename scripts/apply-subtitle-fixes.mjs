/**
 * apply-subtitle-fixes.mjs
 *
 * Applies subtitle punctuation/capitalization fixes from
 * src/data/subtitle-fixes/fix-*.json back to public/transcripts/{videoId}.json.
 *
 * ONLY replaces the `en` field for changed segments. Preserves start, end, ko.
 *
 * Usage: node scripts/apply-subtitle-fixes.mjs
 */

import fs from 'fs'
import path from 'path'

const FIXES_DIR = 'src/data/subtitle-fixes'
const TRANSCRIPTS_DIR = 'public/transcripts'

const fixFiles = fs.readdirSync(FIXES_DIR).filter(f => f.endsWith('.json')).sort()
console.log(`Found ${fixFiles.length} fix files`)

let totalVideos = 0
let totalSegments = 0
let skippedVideos = 0
let missingTranscripts = 0

for (const fixFile of fixFiles) {
  const fixes = JSON.parse(fs.readFileSync(path.join(FIXES_DIR, fixFile), 'utf-8'))

  for (const [videoId, segments] of Object.entries(fixes)) {
    const segKeys = Object.keys(segments)
    if (segKeys.length === 0) continue

    const transcriptPath = path.join(TRANSCRIPTS_DIR, `${videoId}.json`)
    if (!fs.existsSync(transcriptPath)) {
      missingTranscripts++
      continue
    }

    const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf-8'))
    let changed = 0

    for (const [idxStr, fixedEn] of Object.entries(segments)) {
      const idx = parseInt(idxStr, 10)
      if (idx < 0 || idx >= transcript.length) continue
      if (transcript[idx].en === fixedEn) continue

      transcript[idx].en = fixedEn
      changed++
    }

    if (changed > 0) {
      fs.writeFileSync(transcriptPath, JSON.stringify(transcript, null, 2))
      totalVideos++
      totalSegments += changed
    } else {
      skippedVideos++
    }
  }
}

console.log(`\n=== Apply Complete ===`)
console.log(`Videos patched: ${totalVideos}`)
console.log(`Segments updated: ${totalSegments}`)
console.log(`Videos skipped (no actual changes): ${skippedVideos}`)
console.log(`Missing transcripts: ${missingTranscripts}`)
