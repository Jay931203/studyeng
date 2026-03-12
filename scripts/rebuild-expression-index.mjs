/**
 * rebuild-expression-index.mjs
 *
 * After subtitle re-segmentation, sentenceIdx values in expression-index-v2.json
 * may be stale. This script re-maps every row by matching expression text against
 * the current transcript files.
 *
 * Strategy per row:
 *   1. Exact match: old en text === some segment's en → update idx + en/ko
 *   2. Substring match: old en is a substring of a segment (merged case) → update
 *   3. Reverse substring: a segment's en is a substring of old en (split case)
 *      → pick the segment that contains the expression's canonical form
 *   4. Fuzzy: try to find the expression canonical in any segment
 *   5. If all fail, drop the row (orphaned)
 *
 * Usage: node scripts/rebuild-expression-index.mjs [--dry-run]
 */

import fs from 'fs'
import path from 'path'

const INDEX_PATH = 'src/data/expression-index-v2.json'
const ENTRIES_PATH = 'src/data/expression-entries-v2.json'
const TRANSCRIPTS_DIR = 'public/transcripts'

const dryRun = process.argv.includes('--dry-run')

const exprIndex = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'))
const exprEntries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'))

const videoIds = Object.keys(exprIndex)
console.log(`Processing ${videoIds.length} videos, rebuilding expression index...`)

let totalRows = 0
let exactMatches = 0
let substringMatches = 0
let reverseSubstringMatches = 0
let canonicalMatches = 0
let dropped = 0
let unchanged = 0

const newIndex = {}

// Cache transcripts to avoid re-reading
const transcriptCache = {}
function getTranscript(videoId) {
  if (transcriptCache[videoId]) return transcriptCache[videoId]
  const fp = path.join(TRANSCRIPTS_DIR, `${videoId}.json`)
  if (!fs.existsSync(fp)) return null
  const t = JSON.parse(fs.readFileSync(fp, 'utf-8'))
  transcriptCache[videoId] = t
  return t
}

// Normalize text for comparison
function norm(text) {
  return (text || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

// Check if a segment's en text contains expression canonical form
function containsExpression(segEn, canonical) {
  const normSeg = norm(segEn)
  const normCanonical = norm(canonical)
  return normSeg.includes(normCanonical)
}

for (const videoId of videoIds) {
  const rows = exprIndex[videoId]
  const transcript = getTranscript(videoId)

  if (!transcript) {
    // Transcript file doesn't exist, drop all rows
    dropped += rows.length
    totalRows += rows.length
    continue
  }

  const newRows = []
  const seen = new Set() // dedup: exprId:sentenceIdx

  for (const row of rows) {
    totalRows++
    const oldEn = norm(row.en)
    const canonical = exprEntries[row.exprId]?.canonical || row.exprId
    let matched = false

    // Strategy 1: Exact match
    for (let i = 0; i < transcript.length; i++) {
      if (norm(transcript[i].en) === oldEn) {
        const key = `${row.exprId}:${i}`
        if (!seen.has(key)) {
          seen.add(key)
          newRows.push({
            exprId: row.exprId,
            sentenceIdx: i,
            en: transcript[i].en,
            ko: transcript[i].ko || '',
          })
          if (i === row.sentenceIdx) unchanged++
          else exactMatches++
          matched = true
        }
        break
      }
    }
    if (matched) continue

    // Strategy 2: Old en is substring of a segment (merged case)
    for (let i = 0; i < transcript.length; i++) {
      if (norm(transcript[i].en).includes(oldEn) && oldEn.length > 10) {
        const key = `${row.exprId}:${i}`
        if (!seen.has(key)) {
          seen.add(key)
          newRows.push({
            exprId: row.exprId,
            sentenceIdx: i,
            en: transcript[i].en,
            ko: transcript[i].ko || '',
          })
          substringMatches++
          matched = true
        }
        break
      }
    }
    if (matched) continue

    // Strategy 3: Segment en is substring of old en (split case) - find the one with the expression
    const candidates = []
    for (let i = 0; i < transcript.length; i++) {
      const segNorm = norm(transcript[i].en)
      if (segNorm.length > 10 && oldEn.includes(segNorm)) {
        candidates.push(i)
      }
    }
    if (candidates.length > 0) {
      // Pick the candidate that contains the canonical expression
      let bestIdx = candidates[0]
      for (const ci of candidates) {
        if (containsExpression(transcript[ci].en, canonical)) {
          bestIdx = ci
          break
        }
      }
      const key = `${row.exprId}:${bestIdx}`
      if (!seen.has(key)) {
        seen.add(key)
        newRows.push({
          exprId: row.exprId,
          sentenceIdx: bestIdx,
          en: transcript[bestIdx].en,
          ko: transcript[bestIdx].ko || '',
        })
        reverseSubstringMatches++
        matched = true
      }
    }
    if (matched) continue

    // Strategy 4: Find canonical expression text in any segment
    for (let i = 0; i < transcript.length; i++) {
      if (containsExpression(transcript[i].en, canonical)) {
        const key = `${row.exprId}:${i}`
        if (!seen.has(key)) {
          seen.add(key)
          newRows.push({
            exprId: row.exprId,
            sentenceIdx: i,
            en: transcript[i].en,
            ko: transcript[i].ko || '',
          })
          canonicalMatches++
          matched = true
        }
        break
      }
    }
    if (matched) continue

    // No match found - drop this row
    dropped++
  }

  if (newRows.length > 0) {
    newIndex[videoId] = newRows
  }
}

console.log(`\n=== Rebuild Complete ===`)
console.log(`Total rows processed: ${totalRows}`)
console.log(`Unchanged (same idx): ${unchanged}`)
console.log(`Exact match (new idx): ${exactMatches}`)
console.log(`Substring match (merged): ${substringMatches}`)
console.log(`Reverse substring (split): ${reverseSubstringMatches}`)
console.log(`Canonical match (fallback): ${canonicalMatches}`)
console.log(`Dropped (orphaned): ${dropped}`)
console.log(`Total kept: ${totalRows - dropped}`)
console.log(`Videos in new index: ${Object.keys(newIndex).length}`)

if (!dryRun) {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(newIndex))
  console.log(`\nIndex written to ${INDEX_PATH}`)
} else {
  console.log(`\n(DRY RUN - no files written)`)
}
