/**
 * merge-match-results.mjs
 *
 * Merges all batch-*.json match results into:
 *   - src/data/expression-index-v2.json   (videoId → [{exprId, sentenceIdx, en, ko}])
 *   - Updates src/data/expression-entries-v2.json with videoCount per expression
 *
 * Usage: node scripts/merge-match-results.mjs
 */

import fs from 'fs'
import path from 'path'

const MATCH_DIR = 'src/data/match-results'
const ENTRIES_PATH = 'src/data/expression-entries-v2.json'
const TRANSCRIPT_DIR = 'public/transcripts'
const OUTPUT_INDEX = 'src/data/expression-index-v2.json'

// 1. Load entries dictionary
const entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'))

// 2. Merge all batch results
const mergedIndex = {} // videoId → [{exprId, sentenceIdx, en, ko}]
const exprVideoSets = {} // exprId → Set<videoId> for videoCount

const batchFiles = fs.readdirSync(MATCH_DIR).filter(f => f.endsWith('.json')).sort()
console.log(`Found ${batchFiles.length} batch files`)

let totalMatches = 0
let validMatches = 0
let invalidMatches = 0
let duplicateMatches = 0

for (const batchFile of batchFiles) {
  const batchData = JSON.parse(fs.readFileSync(path.join(MATCH_DIR, batchFile), 'utf-8'))

  for (const [videoId, matches] of Object.entries(batchData)) {
    // Load transcript for en/ko lookup
    const transcriptPath = path.join(TRANSCRIPT_DIR, `${videoId}.json`)
    let transcript = []
    if (fs.existsSync(transcriptPath)) {
      transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf-8'))
    }

    if (!mergedIndex[videoId]) mergedIndex[videoId] = []
    const existingKeys = new Set(
      mergedIndex[videoId].map(m => `${m.exprId}:${m.sentenceIdx}`)
    )

    for (const match of matches) {
      totalMatches++
      const exprId = match.canonical.toLowerCase().trim()

      // Validate: canonical must exist in dictionary
      if (!entries[exprId]) {
        invalidMatches++
        continue
      }

      const sentenceIdx = typeof match.sentenceIdx === 'string'
        ? parseInt(match.sentenceIdx, 10)
        : match.sentenceIdx

      // Deduplicate
      const key = `${exprId}:${sentenceIdx}`
      if (existingKeys.has(key)) {
        duplicateMatches++
        continue
      }
      existingKeys.add(key)

      // Look up en/ko from transcript
      const sub = transcript[sentenceIdx]
      const en = sub?.en || match.en || ''
      const ko = sub?.ko || match.ko || ''

      mergedIndex[videoId].push({ exprId, sentenceIdx, en, ko })
      validMatches++

      // Track videoCount
      if (!exprVideoSets[exprId]) exprVideoSets[exprId] = new Set()
      exprVideoSets[exprId].add(videoId)
    }
  }
}

// 3. Sort each video's matches by sentenceIdx
for (const videoId of Object.keys(mergedIndex)) {
  mergedIndex[videoId].sort((a, b) => a.sentenceIdx - b.sentenceIdx)
}

// 4. Update entries with videoCount
for (const [exprId, entry] of Object.entries(entries)) {
  entry.videoCount = exprVideoSets[exprId]?.size || 0
}

// 5. Write outputs
fs.writeFileSync(OUTPUT_INDEX, JSON.stringify(mergedIndex))
fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2))

// 6. Stats
const videosWithMatches = Object.keys(mergedIndex).length
const uniqueExprs = Object.keys(exprVideoSets).length
const exprsWithNoMatch = Object.values(entries).filter(e => e.videoCount === 0).length

console.log(`\n=== Merge Complete ===`)
console.log(`Total matches processed: ${totalMatches}`)
console.log(`Valid matches: ${validMatches}`)
console.log(`Invalid (not in dict): ${invalidMatches}`)
console.log(`Duplicates removed: ${duplicateMatches}`)
console.log(`Videos with matches: ${videosWithMatches} / 1804`)
console.log(`Unique expressions matched: ${uniqueExprs} / ${Object.keys(entries).length}`)
console.log(`Expressions with no matches: ${exprsWithNoMatch}`)
console.log(`\nIndex size: ${(fs.statSync(OUTPUT_INDEX).size / 1024 / 1024).toFixed(1)} MB`)
console.log(`Wrote: ${OUTPUT_INDEX}`)
console.log(`Updated: ${ENTRIES_PATH}`)

// CEFR distribution of matched expressions
const cefrDist = {}
for (const exprId of Object.keys(exprVideoSets)) {
  const cefr = entries[exprId]?.cefr || 'unknown'
  cefrDist[cefr] = (cefrDist[cefr] || 0) + 1
}
console.log(`\nCEFR distribution of matched expressions:`)
for (const [level, count] of Object.entries(cefrDist).sort()) {
  console.log(`  ${level}: ${count}`)
}
