/**
 * retag-difficulty-6level.mjs
 *
 * Expands the difficulty scale from 5 levels to 6 levels by splitting
 * the old difficulty=1 (A1+A2) into separate A1 and A2.
 *
 * New mapping:
 *   1 = A1,  2 = A2,  3 = B1,  4 = B2,  5 = C1,  6 = C2
 *
 * Old mapping:
 *   1 = A1/A2,  2 = B1,  3 = B2,  4 = C1,  5 = C2
 *
 * For old difficulty=1 videos, we analyze matched expressions and words
 * to determine A1 vs A2:
 *   - Expression scoring: A1=1, A2=2, B1=3, B2+=4
 *   - Word scoring: A1=1, A2=2, B1+=3
 *   - Average score across all items
 *   - avg < 1.5 or no data → A1 (difficulty=1)
 *   - avg >= 1.5 → A2 (difficulty=2)
 *
 * For old difficulty 2-5, we shift up by 1:
 *   2→3, 3→4, 4→5, 5→6
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

console.log('Loading expression-index-v3.json ...')
const expressionIndex = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/expression-index-v3.json'), 'utf8'),
)

console.log('Loading expression-entries-v2.json ...')
const expressionEntries = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/expression-entries-v2.json'), 'utf8'),
)

console.log('Loading word-index.json ...')
const wordIndex = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/word-index.json'), 'utf8'),
)

console.log('Loading word-entries.json ...')
const wordEntries = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/word-entries.json'), 'utf8'),
)

// ---------------------------------------------------------------------------
// CEFR scoring
// ---------------------------------------------------------------------------

const EXPR_CEFR_SCORE = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 4, C2: 4 }
const WORD_CEFR_SCORE = { A1: 1, A2: 2, B1: 3, B2: 3, C1: 3, C2: 3 }

function getExprScore(cefr) {
  return EXPR_CEFR_SCORE[(cefr ?? '').toUpperCase()] ?? null
}

function getWordScore(cefr) {
  return WORD_CEFR_SCORE[(cefr ?? '').toUpperCase()] ?? null
}

// ---------------------------------------------------------------------------
// Compute A1 vs A2 for each difficulty=1 video (keyed by youtubeId)
// ---------------------------------------------------------------------------

// First, read seed-videos.ts to find which youtubeIds have difficulty=1
const seedPath = path.join(ROOT, 'src/data/seed-videos.ts')
console.log('\nReading seed-videos.ts ...')
const source = fs.readFileSync(seedPath, 'utf8')

// Parse youtubeId -> current difficulty from TS source
const videoInfoMap = {} // youtubeId -> { internalId, currentDifficulty }
const combinedRegex = /(id|youtubeId|difficulty):\s*['"]?([^'",\s]+)['"]?/g
let currentInternalId = null
let currentYoutubeId = null
let m

while ((m = combinedRegex.exec(source)) !== null) {
  if (m[1] === 'id') {
    // Save pending
    if (currentInternalId && currentYoutubeId) {
      // difficulty not yet captured, will be on next pass
    }
    currentInternalId = m[2]
    currentYoutubeId = null
  } else if (m[1] === 'youtubeId' && currentInternalId) {
    currentYoutubeId = m[2]
  } else if (m[1] === 'difficulty' && currentInternalId && currentYoutubeId) {
    videoInfoMap[currentYoutubeId] = {
      internalId: currentInternalId,
      currentDifficulty: parseInt(m[2], 10),
    }
    currentInternalId = null
    currentYoutubeId = null
  }
}

const totalVideos = Object.keys(videoInfoMap).length
console.log(`Found ${totalVideos} videos in seed-videos.ts`)

// Count by current difficulty
const currentDist = {}
for (const info of Object.values(videoInfoMap)) {
  currentDist[info.currentDifficulty] = (currentDist[info.currentDifficulty] ?? 0) + 1
}
console.log('\nCurrent difficulty distribution:')
for (const [k, v] of Object.entries(currentDist).sort()) {
  console.log(`  difficulty ${k}: ${v} videos`)
}

// ---------------------------------------------------------------------------
// Analyze difficulty=1 videos to split A1 vs A2
// ---------------------------------------------------------------------------

console.log('\nAnalyzing difficulty=1 videos for A1/A2 split...')

const newDifficultyByYoutubeId = {} // youtubeId -> new difficulty (1-6)

let a1Count = 0
let a2Count = 0
let noDataCount = 0
let hasDataCount = 0

for (const [youtubeId, info] of Object.entries(videoInfoMap)) {
  if (info.currentDifficulty !== 1) {
    // Shift up: 2→3, 3→4, 4→5, 5→6
    newDifficultyByYoutubeId[youtubeId] = info.currentDifficulty + 1
    continue
  }

  // Difficulty=1: analyze expressions and words
  const exprRows = expressionIndex[youtubeId] ?? []
  const wordRows = wordIndex[youtubeId] ?? []

  let totalScore = 0
  let itemCount = 0

  for (const row of exprRows) {
    const entry = expressionEntries[row.exprId]
    if (!entry) continue
    const score = getExprScore(entry.cefr)
    if (score !== null) {
      totalScore += score
      itemCount++
    }
  }

  for (const row of wordRows) {
    const entry = wordEntries[row.wordId]
    if (!entry) continue
    const score = getWordScore(entry.cefr)
    if (score !== null) {
      totalScore += score
      itemCount++
    }
  }

  if (itemCount === 0) {
    // No data → default to A1
    newDifficultyByYoutubeId[youtubeId] = 1
    a1Count++
    noDataCount++
  } else {
    const avgScore = totalScore / itemCount
    hasDataCount++
    if (avgScore < 1.5) {
      newDifficultyByYoutubeId[youtubeId] = 1 // A1
      a1Count++
    } else {
      newDifficultyByYoutubeId[youtubeId] = 2 // A2
      a2Count++
    }
  }
}

console.log(`\nA1/A2 split results (from ${currentDist[1] ?? 0} difficulty=1 videos):`)
console.log(`  A1 (difficulty=1): ${a1Count} videos (${noDataCount} had no expression/word data)`)
console.log(`  A2 (difficulty=2): ${a2Count} videos`)
console.log(`  With data: ${hasDataCount}, Without data: ${noDataCount}`)

// ---------------------------------------------------------------------------
// Build internalId -> new difficulty map
// ---------------------------------------------------------------------------

const difficultyByInternalId = {}
for (const [youtubeId, info] of Object.entries(videoInfoMap)) {
  const newDiff = newDifficultyByYoutubeId[youtubeId]
  if (newDiff !== undefined) {
    difficultyByInternalId[info.internalId] = newDiff
  }
}

// ---------------------------------------------------------------------------
// Patch seed-videos.ts line by line
// ---------------------------------------------------------------------------

console.log('\nPatching seed-videos.ts ...')

const lines = source.split('\n')
const output = []
let pendingId = null
let replaced = 0
let unchanged = 0
let noMap = 0

for (const line of lines) {
  // Detect id field (indented, inside an object)
  const idMatch = line.match(/^\s+id:\s*['"]([^'"]+)['"]\s*,?\s*$/)
  if (idMatch) {
    pendingId = idMatch[1]
    output.push(line)
    continue
  }

  // Detect difficulty field
  const diffMatch = line.match(/^(\s+difficulty:\s*)(\d+)(,?\s*)$/)
  if (diffMatch && pendingId !== null) {
    const videoId = pendingId
    pendingId = null

    const newVal = difficultyByInternalId[videoId]

    if (newVal !== undefined) {
      const oldVal = parseInt(diffMatch[2], 10)
      if (oldVal !== newVal) {
        output.push(`${diffMatch[1]}${newVal}${diffMatch[3]}`)
        replaced++
      } else {
        output.push(line)
        unchanged++
      }
      continue
    } else {
      noMap++
    }
  }

  output.push(line)
}

console.log(`\nPatch results: ${replaced} replaced, ${unchanged} unchanged, ${noMap} unmapped`)

fs.writeFileSync(seedPath, output.join('\n'), 'utf8')
console.log('seed-videos.ts updated.')

// ---------------------------------------------------------------------------
// Final distribution check
// ---------------------------------------------------------------------------

const patched = output.join('\n')
const allDiffs = [...patched.matchAll(/^\s+difficulty:\s*(\d+)/gm)].map((m) =>
  parseInt(m[1], 10),
)
const finalDist = {}
for (const d of allDiffs) {
  finalDist[d] = (finalDist[d] ?? 0) + 1
}

const CEFR_LABELS = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2' }

console.log('\nFinal difficulty distribution in seed-videos.ts:')
for (const [k, v] of Object.entries(finalDist).sort()) {
  const label = CEFR_LABELS[k] ?? '??'
  const bar = '#'.repeat(Math.round(v / 10))
  console.log(`  difficulty ${k} (${label}): ${v.toString().padStart(4)} videos  ${bar}`)
}
console.log(`  Total: ${allDiffs.length} videos`)
