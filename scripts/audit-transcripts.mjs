/**
 * audit-transcripts.mjs
 *
 * 자막 품질 감사 스크립트. 파이프라인 Step 6 (QA Audit)에 사용.
 *
 * Usage:
 *   node scripts/audit-transcripts.mjs                    # 전체 transcripts 감사
 *   node scripts/audit-transcripts.mjs --shorts           # shorts 영상만
 *   node scripts/audit-transcripts.mjs --ids id1,id2,id3  # 특정 ID만
 *   node scripts/audit-transcripts.mjs --timing           # 타이밍 이슈만 (overlap, bad order)
 */

import fs from 'fs'
import path from 'path'

const TRANSCRIPTS_DIR = 'public/transcripts'

// Parse args
const args = process.argv.slice(2)
const shortsOnly = args.includes('--shorts')
const timingOnly = args.includes('--timing')
const idsIdx = args.indexOf('--ids')
const specificIds = idsIdx >= 0 ? args[idsIdx + 1].split(',') : null

// Get file list
function getTargetIds() {
  if (specificIds) return specificIds

  if (shortsOnly) {
    // Read seed-videos.ts and extract shorts IDs
    const seedContent = fs.readFileSync('src/data/seed-videos.ts', 'utf8')
    const shortsIds = []
    const regex = /id:\s*'shorts-([^']+)'/g
    let match
    while ((match = regex.exec(seedContent)) !== null) {
      shortsIds.push(match[1])
    }
    return shortsIds
  }

  // All transcripts
  return fs.readdirSync(TRANSCRIPTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''))
}

const ids = getTargetIds()

// Counters
let totalFiles = 0, totalSegs = 0
let totalMulti = 0, totalMissingKo = 0, totalNoPunct = 0
let totalOverlaps = 0, totalBadOrder = 0, totalLongGaps = 0
const problemFiles = []

for (const id of ids) {
  const fp = path.join(TRANSCRIPTS_DIR, id + '.json')
  if (!fs.existsSync(fp)) {
    if (specificIds || shortsOnly) console.log(`MISSING: ${id}`)
    continue
  }

  totalFiles++
  const d = JSON.parse(fs.readFileSync(fp, 'utf8'))
  let multi = 0, missingKo = 0, noPunct = 0, overlaps = 0, badOrder = 0, longGaps = 0
  const issues = []

  for (let i = 0; i < d.length; i++) {
    const s = d[i]
    const en = s.en || ''
    const duration = s.end - s.start

    // Multi-sentence check
    if (!timingOnly) {
      const parts = en.split(/(?<=[.!?])\s+(?=[A-Z])/)
      if (parts.length >= 2 && duration > 3) {
        multi++
        issues.push(`  [multi] seg ${i}: "${en.substring(0, 60)}..." (${duration.toFixed(1)}s, ${parts.length} sentences)`)
      }

      // Missing ko
      if (!(s.ko || '').trim()) missingKo++

      // No punctuation
      if (en.length > 10 && !/[.!?\"')\u2019\u201D♪—]$/.test(en.trim())) {
        noPunct++
        issues.push(`  [punct] seg ${i}: "${en.substring(0, 60)}"`)
      }
    }

    // Timing checks
    if (s.start >= s.end) {
      badOrder++
      issues.push(`  [bad-order] seg ${i}: start=${s.start} >= end=${s.end}`)
    }

    if (i > 0) {
      const prev = d[i - 1]
      if (s.start < prev.end - 0.01) {
        overlaps++
        issues.push(`  [overlap] seg ${i}: start=${s.start} < prev.end=${prev.end} (${(prev.end - s.start).toFixed(3)}s)`)
      }
      if (s.start - prev.end > 2.0) {
        longGaps++
      }
    }
  }

  totalSegs += d.length
  totalMulti += multi; totalMissingKo += missingKo; totalNoPunct += noPunct
  totalOverlaps += overlaps; totalBadOrder += badOrder; totalLongGaps += longGaps

  const hasProblems = multi > 0 || missingKo > 0 || noPunct > 0 || overlaps > 0 || badOrder > 0
  if (hasProblems) {
    problemFiles.push(id)
    const parts = []
    if (multi > 0) parts.push(`${multi} multi-sentence`)
    if (missingKo > 0) parts.push(`${missingKo} missing ko`)
    if (noPunct > 0) parts.push(`${noPunct} no punct`)
    if (overlaps > 0) parts.push(`${overlaps} overlaps`)
    if (badOrder > 0) parts.push(`${badOrder} bad order`)
    console.log(`${id}: ${d.length} segs — ${parts.join(', ')}`)
    issues.slice(0, 5).forEach(line => console.log(line))
    if (issues.length > 5) console.log(`  ... and ${issues.length - 5} more issues`)
  }
}

console.log('\n=== SUMMARY ===')
console.log(`Files scanned: ${totalFiles}`)
console.log(`Total segments: ${totalSegs}`)
console.log(`Multi-sentence (>3s): ${totalMulti}`)
console.log(`Missing ko: ${totalMissingKo}`)
console.log(`No end punctuation: ${totalNoPunct}`)
console.log(`Timing overlaps: ${totalOverlaps}`)
console.log(`Bad order (start>=end): ${totalBadOrder}`)
console.log(`Long gaps (>2s): ${totalLongGaps}`)
console.log(`Problem files: ${problemFiles.length}/${totalFiles}`)
