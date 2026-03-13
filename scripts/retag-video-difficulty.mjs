/**
 * retag-video-difficulty.mjs
 *
 * Computes per-video difficulty from the CEFR level of the highest-level
 * expression matched to that video (max CEFR approach), then patches
 * difficulty values in src/data/seed-videos.ts.
 *
 * Rationale: each video is matched with only a handful of expressions
 * (median ~3). Using the maximum CEFR encountered gives the most spread-out
 * difficulty distribution while still reflecting the hardest vocabulary
 * a learner will encounter.
 *
 * Mapping:
 *   max CEFR → difficulty
 *   A1, A2   → 1
 *   B1       → 2
 *   B2       → 3
 *   C1       → 4
 *   C2       → 5
 *
 * Videos with NO matched expressions keep their current difficulty.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

console.log('Loading expression-index-v2.json …')
const expressionIndex = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/expression-index-v2.json'), 'utf8'),
)

console.log('Loading expression-entries-v2.json …')
const expressionEntries = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'src/data/expression-entries-v2.json'), 'utf8'),
)

// ---------------------------------------------------------------------------
// CEFR → numeric rank → difficulty
// ---------------------------------------------------------------------------

const CEFR_RANK = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 }
const RANK_TO_DIFFICULTY = [1, 1, 2, 3, 4, 5] // index = rank

function cefrToRank(cefr) {
  return CEFR_RANK[(cefr ?? '').toUpperCase()] ?? null
}

// ---------------------------------------------------------------------------
// Compute new difficulty per video (keyed by youtubeId)
// ---------------------------------------------------------------------------

console.log('Computing difficulty per video (max CEFR approach) …')

const difficultyByYoutubeId = {} // youtubeId -> difficulty number

for (const [youtubeId, rows] of Object.entries(expressionIndex)) {
  let maxRank = -1

  for (const row of rows) {
    const entry = expressionEntries[row.exprId]
    if (!entry) continue
    const rank = cefrToRank(entry.cefr)
    if (rank !== null && rank > maxRank) {
      maxRank = rank
    }
  }

  if (maxRank < 0) continue // no expressions with known CEFR
  difficultyByYoutubeId[youtubeId] = RANK_TO_DIFFICULTY[maxRank]
}

console.log(`  Computed difficulty for ${Object.keys(difficultyByYoutubeId).length} videos`)

// Distribution of computed values
const distComputed = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
for (const d of Object.values(difficultyByYoutubeId)) {
  distComputed[d] = (distComputed[d] ?? 0) + 1
}
console.log('Computed distribution (expression-matched videos):')
for (const [k, v] of Object.entries(distComputed).sort()) {
  console.log(`  difficulty ${k}: ${v} videos`)
}

// ---------------------------------------------------------------------------
// Patch seed-videos.ts
// ---------------------------------------------------------------------------

const seedPath = path.join(ROOT, 'src/data/seed-videos.ts')
console.log('\nReading seed-videos.ts …')
const source = fs.readFileSync(seedPath, 'utf8')

// Build youtubeId -> internalId map by parsing the TS source
// We look for pairs of id:'xxx' and youtubeId:'yyy' in document order.
const youtubeIdToInternalId = {}
const combinedRegex = /(id|youtubeId):\s*['"]([^'"]+)['"]/g
let currentInternalId = null
let m

while ((m = combinedRegex.exec(source)) !== null) {
  if (m[1] === 'id') {
    currentInternalId = m[2]
  } else if (m[1] === 'youtubeId' && currentInternalId) {
    youtubeIdToInternalId[m[2]] = currentInternalId
    currentInternalId = null
  }
}

console.log(`Built youtubeId→internalId map: ${Object.keys(youtubeIdToInternalId).length} entries`)

// Build internalId -> new difficulty map
const difficultyByInternalId = {}
for (const [youtubeId, internalId] of Object.entries(youtubeIdToInternalId)) {
  if (difficultyByYoutubeId[youtubeId] !== undefined) {
    difficultyByInternalId[internalId] = difficultyByYoutubeId[youtubeId]
  }
}

console.log(`Videos with expression-based difficulty: ${Object.keys(difficultyByInternalId).length}`)

// Line-by-line patch
const lines = source.split('\n')
const output = []
let pendingId = null
let replaced = 0
let unchanged = 0
let noData = 0

for (const line of lines) {
  // Detect id field (must be indented, i.e. inside an object)
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
    pendingId = null // consume

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
      noData++
    }
  }

  output.push(line)
}

console.log(`\nPatch results: ${replaced} replaced, ${unchanged} unchanged, ${noData} no expression data (kept as-is)`)

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

console.log('\nFinal difficulty distribution in seed-videos.ts:')
for (const [k, v] of Object.entries(finalDist).sort()) {
  const bar = '#'.repeat(Math.round(v / 10))
  console.log(`  difficulty ${k}: ${v.toString().padStart(4)} videos  ${bar}`)
}
console.log(`  Total: ${allDiffs.length} videos`)
