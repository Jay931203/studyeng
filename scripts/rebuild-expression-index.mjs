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

// Check if a segment's en text contains expression canonical form (word boundary match)
function containsExpression(segEn, canonical) {
  const normSeg = norm(segEn)
  const normCanonical = norm(canonical)
  try {
    const escaped = normCanonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return new RegExp(`\\b${escaped}\\b`).test(normSeg)
  } catch {
    return normSeg.includes(normCanonical)
  }
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
    let foundSegIdx = -1

    // Strategy 1: Exact match on en text
    for (let i = 0; i < transcript.length; i++) {
      if (norm(transcript[i].en) === oldEn) {
        foundSegIdx = i
        break
      }
    }

    // Strategy 2: Old en is substring of a segment (merged case)
    if (foundSegIdx === -1) {
      for (let i = 0; i < transcript.length; i++) {
        if (norm(transcript[i].en).includes(oldEn) && oldEn.length > 10) {
          foundSegIdx = i
          break
        }
      }
    }

    // Strategy 3: Segment en is substring of old en (split case)
    if (foundSegIdx === -1) {
      const candidates = []
      for (let i = 0; i < transcript.length; i++) {
        const segNorm = norm(transcript[i].en)
        if (segNorm.length > 10 && oldEn.includes(segNorm)) {
          candidates.push(i)
        }
      }
      if (candidates.length > 0) {
        foundSegIdx = candidates[0]
        for (const ci of candidates) {
          if (containsExpression(transcript[ci].en, canonical)) {
            foundSegIdx = ci
            break
          }
        }
      }
    }

    // Validate: does the expression actually appear as a word?
    if (foundSegIdx !== -1 && containsExpression(transcript[foundSegIdx].en, canonical)) {
      const key = `${row.exprId}:${foundSegIdx}`
      if (!seen.has(key)) {
        seen.add(key)
        newRows.push({
          exprId: row.exprId,
          sentenceIdx: foundSegIdx,
          en: transcript[foundSegIdx].en,
          ko: transcript[foundSegIdx].ko || '',
        })
        if (foundSegIdx === row.sentenceIdx) unchanged++
        else exactMatches++
        matched = true
      }
    }

    // Strategy 4: If validation failed, search ALL segments for one containing the expression
    if (!matched) {
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
    }

    if (!matched) dropped++
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
