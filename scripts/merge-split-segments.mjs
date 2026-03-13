/**
 * merge-split-segments.mjs
 *
 * Merges subtitle segments that were incorrectly split mid-sentence.
 * Detection: segment ends without sentence punctuation AND next segment starts lowercase.
 *
 * For each merged group:
 *   - en: joined with space
 *   - ko: joined with space
 *   - start: first segment's start
 *   - end: last segment's end
 *
 * Also produces an index remap file for updating expression-index-v2.json.
 *
 * Usage: node scripts/merge-split-segments.mjs [--dry-run]
 */

import fs from 'fs'
import path from 'path'

const TRANSCRIPTS_DIR = 'public/transcripts'
const INDEX_PATH = 'src/data/expression-index-v2.json'
const MAX_MERGED_DURATION = 9999 // no cap - merge all bad splits

const dryRun = process.argv.includes('--dry-run')

const SENTENCE_END = new Set(['.', '?', '!', '"', ')', "'", '♪', ']'])

function shouldMerge(curEn, nextEn) {
  if (!curEn || !nextEn) return false
  curEn = curEn.trim()
  nextEn = nextEn.trim()
  if (curEn.length === 0 || nextEn.length === 0) return false
  if (curEn.startsWith('[') || curEn.startsWith('♪')) return false
  if (nextEn.startsWith('[') || nextEn.startsWith('♪')) return false

  const lastChar = curEn[curEn.length - 1]
  const endsWithPunct = SENTENCE_END.has(lastChar)

  const firstChar = nextEn[0]
  const nextStartsLower = firstChar !== firstChar.toUpperCase() && firstChar === firstChar.toLowerCase()

  return !endsWithPunct && nextStartsLower
}

const files = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json')).sort()
console.log(`Processing ${files.length} transcript files...`)

let totalMerged = 0
let totalFilesChanged = 0
let totalSegsBefore = 0
let totalSegsAfter = 0
const indexRemaps = {} // videoId -> {oldIdx: newIdx}

for (const f of files) {
  const videoId = f.replace('.json', '')
  const filePath = path.join(TRANSCRIPTS_DIR, f)
  const transcript = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  if (transcript.length < 2) {
    totalSegsBefore += transcript.length
    totalSegsAfter += transcript.length
    continue
  }

  totalSegsBefore += transcript.length
  const merged = []
  const remap = {} // oldIdx -> newIdx
  let i = 0

  while (i < transcript.length) {
    const group = [{ seg: transcript[i], origIdx: i }]

    while (i + 1 < transcript.length) {
      const curEn = group[group.length - 1].seg.en
      const nextEn = transcript[i + 1].en
      const groupStart = group[0].seg.start
      const nextEnd = transcript[i + 1].end

      // Check duration cap
      if (nextEnd - groupStart > MAX_MERGED_DURATION) break

      if (shouldMerge(curEn, nextEn)) {
        i++
        group.push({ seg: transcript[i], origIdx: i })
      } else {
        break
      }
    }

    const newIdx = merged.length

    // Map all original indices in this group to the new merged index
    for (const item of group) {
      remap[item.origIdx] = newIdx
    }

    if (group.length === 1) {
      merged.push(group[0].seg)
    } else {
      // Merge the group
      const mergedSeg = {
        start: group[0].seg.start,
        end: group[group.length - 1].seg.end,
        en: group.map(g => g.seg.en.trim()).join(' '),
        ko: group.map(g => (g.seg.ko || '').trim()).filter(k => k.length > 0).join(' '),
      }
      merged.push(mergedSeg)
      totalMerged += group.length - 1
    }

    i++
  }

  totalSegsAfter += merged.length

  if (merged.length !== transcript.length) {
    totalFilesChanged++
    indexRemaps[videoId] = remap

    if (!dryRun) {
      fs.writeFileSync(filePath, JSON.stringify(merged, null, 2))
    }
  }
}

// Update expression-index-v2.json
if (!dryRun && Object.keys(indexRemaps).length > 0) {
  console.log(`\nUpdating expression index...`)
  const exprIndex = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'))

  let remappedEntries = 0
  let droppedEntries = 0

  for (const [videoId, remap] of Object.entries(indexRemaps)) {
    const rows = exprIndex[videoId]
    if (!rows) continue

    const newRows = []
    const seen = new Set()

    for (const row of rows) {
      const newIdx = remap[row.sentenceIdx]
      if (newIdx === undefined) {
        droppedEntries++
        continue
      }

      // Deduplicate: same exprId at same newIdx
      const key = `${row.exprId}:${newIdx}`
      if (seen.has(key)) continue
      seen.add(key)

      // Update en/ko from the merged transcript
      const transcript = JSON.parse(fs.readFileSync(
        path.join(TRANSCRIPTS_DIR, `${videoId}.json`), 'utf-8'
      ))
      const mergedSeg = transcript[newIdx]

      newRows.push({
        exprId: row.exprId,
        sentenceIdx: newIdx,
        en: mergedSeg ? mergedSeg.en : row.en,
        ko: mergedSeg ? mergedSeg.ko : row.ko,
      })
      remappedEntries++
    }

    exprIndex[videoId] = newRows
  }

  fs.writeFileSync(INDEX_PATH, JSON.stringify(exprIndex))
  console.log(`Expression index remapped: ${remappedEntries} entries updated, ${droppedEntries} dropped`)
}

console.log(`\n=== Merge Complete ===`)
console.log(`Files changed: ${totalFilesChanged} / ${files.length}`)
console.log(`Segments before: ${totalSegsBefore}`)
console.log(`Segments after: ${totalSegsAfter}`)
console.log(`Segments merged away: ${totalMerged}`)
console.log(`Reduction: ${(totalMerged/totalSegsBefore*100).toFixed(1)}%`)
if (dryRun) console.log(`\n(DRY RUN - no files written)`)
