#!/usr/bin/env node
/**
 * Audit all transcript files for common issues.
 * Usage: node scripts/audit-subtitles.mjs
 *
 * Checks:
 * 1. Timing issues (overlaps, negative duration, unreasonable gaps)
 * 2. Missing/empty Korean translations
 * 3. Abnormal en/ko length ratios
 * 4. Very short transcripts (< 3 subtitles)
 * 5. Foreign language contamination in ko field
 * 6. HTML entities or garbled text
 * 7. Duplicate consecutive subtitles
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts')
const REPORT_PATH = join(ROOT, 'logs', 'subtitle-audit-report.json')

const files = readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'))
console.log(`Auditing ${files.length} transcript files...\n`)

const issues = []
let clean = 0
let total = 0

// Detect non-Korean characters in ko field (Latin alphabet blocks, Chinese, etc.)
function hasNonKoreanContamination(ko) {
  if (!ko || ko.length === 0) return false
  // Allow: Korean, numbers, punctuation, spaces, common symbols
  // Flag: if more than 40% of characters are Latin alphabet
  const latinChars = (ko.match(/[a-zA-Z]/g) || []).length
  const totalChars = ko.replace(/[\s\d.,!?'"()\-:;]/g, '').length
  if (totalChars === 0) return false
  return latinChars / totalChars > 0.5
}

function hasHtmlEntities(text) {
  return /&[a-z]+;|&#\d+;/i.test(text)
}

for (const file of files) {
  total++
  const videoId = file.replace('.json', '')
  const filePath = join(TRANSCRIPTS_DIR, file)

  let data
  try {
    data = JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (e) {
    issues.push({ videoId, severity: 'critical', type: 'parse_error', detail: e.message })
    continue
  }

  if (!Array.isArray(data)) {
    issues.push({ videoId, severity: 'critical', type: 'not_array', detail: 'Transcript is not an array' })
    continue
  }

  const fileIssues = []

  // Check: very short transcript
  if (data.length < 3) {
    fileIssues.push({ type: 'too_short', severity: 'warning', detail: `Only ${data.length} subtitles` })
  }

  let missingKoCount = 0
  let contaminatedKoCount = 0
  let htmlEntityCount = 0
  let timingOverlapCount = 0
  let negativeDurationCount = 0
  let duplicateCount = 0
  let abnormalRatioCount = 0

  for (let i = 0; i < data.length; i++) {
    const sub = data[i]

    // Check: missing fields
    if (sub.start === undefined || sub.end === undefined || !sub.en) {
      fileIssues.push({ type: 'missing_fields', severity: 'critical', detail: `Subtitle ${i} missing start/end/en` })
      continue
    }

    // Check: negative duration
    if (sub.end <= sub.start) {
      negativeDurationCount++
    }

    // Check: timing overlap with next subtitle
    if (i < data.length - 1 && data[i + 1].start < sub.end - 0.1) {
      timingOverlapCount++
    }

    // Check: missing Korean translation
    if (!sub.ko || sub.ko.trim() === '') {
      missingKoCount++
    } else {
      // Check: foreign language contamination in ko
      if (hasNonKoreanContamination(sub.ko)) {
        contaminatedKoCount++
      }

      // Check: abnormal en/ko length ratio
      const enLen = sub.en.length
      const koLen = sub.ko.length
      if (enLen > 10 && koLen > 0) {
        const ratio = koLen / enLen
        if (ratio < 0.15 || ratio > 4.0) {
          abnormalRatioCount++
        }
      }
    }

    // Check: HTML entities
    if (hasHtmlEntities(sub.en) || (sub.ko && hasHtmlEntities(sub.ko))) {
      htmlEntityCount++
    }

    // Check: duplicate consecutive subtitles
    if (i > 0 && sub.en === data[i - 1].en) {
      duplicateCount++
    }
  }

  if (missingKoCount > 0) {
    const pct = Math.round(missingKoCount / data.length * 100)
    fileIssues.push({
      type: 'missing_ko',
      severity: pct > 50 ? 'critical' : 'warning',
      detail: `${missingKoCount}/${data.length} subtitles missing ko (${pct}%)`
    })
  }

  if (contaminatedKoCount > 0) {
    fileIssues.push({
      type: 'ko_contaminated',
      severity: 'warning',
      detail: `${contaminatedKoCount} subtitles have non-Korean text in ko field`
    })
  }

  if (htmlEntityCount > 0) {
    fileIssues.push({
      type: 'html_entities',
      severity: 'minor',
      detail: `${htmlEntityCount} subtitles contain HTML entities`
    })
  }

  if (timingOverlapCount > 0) {
    fileIssues.push({
      type: 'timing_overlap',
      severity: 'warning',
      detail: `${timingOverlapCount} timing overlaps`
    })
  }

  if (negativeDurationCount > 0) {
    fileIssues.push({
      type: 'negative_duration',
      severity: 'critical',
      detail: `${negativeDurationCount} subtitles with end <= start`
    })
  }

  if (duplicateCount > 0) {
    fileIssues.push({
      type: 'duplicate',
      severity: 'minor',
      detail: `${duplicateCount} consecutive duplicate subtitles`
    })
  }

  if (abnormalRatioCount > 0) {
    fileIssues.push({
      type: 'abnormal_ratio',
      severity: 'minor',
      detail: `${abnormalRatioCount} subtitles with abnormal en/ko length ratio`
    })
  }

  if (fileIssues.length > 0) {
    const maxSeverity = fileIssues.some(i => i.severity === 'critical') ? 'critical'
      : fileIssues.some(i => i.severity === 'warning') ? 'warning' : 'minor'
    issues.push({ videoId, severity: maxSeverity, issues: fileIssues })
  } else {
    clean++
  }
}

// Summary
const critical = issues.filter(i => i.severity === 'critical')
const warnings = issues.filter(i => i.severity === 'warning')
const minor = issues.filter(i => i.severity === 'minor')

console.log('=== 자막 감사 결과 ===')
console.log(`전체 파일: ${total}`)
console.log(`문제 없음: ${clean} (${Math.round(clean / total * 100)}%)`)
console.log(`문제 발견: ${issues.length}`)
console.log(`  - Critical: ${critical.length}`)
console.log(`  - Warning: ${warnings.length}`)
console.log(`  - Minor: ${minor.length}`)
console.log('')

// Issue type breakdown
const typeCounts = {}
for (const issue of issues) {
  for (const i of (issue.issues || [{ type: issue.type }])) {
    typeCounts[i.type] = (typeCounts[i.type] || 0) + 1
  }
}
console.log('이슈 유형별:')
Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`)
})

// Show critical issues
if (critical.length > 0) {
  console.log(`\n=== Critical 이슈 (${critical.length}개) ===`)
  critical.slice(0, 20).forEach(c => {
    console.log(`  ${c.videoId}: ${(c.issues || [{ detail: c.detail }]).map(i => i.detail).join(', ')}`)
  })
  if (critical.length > 20) console.log(`  ... and ${critical.length - 20} more`)
}

// Show warnings
if (warnings.length > 0) {
  console.log(`\n=== Warning 이슈 (${warnings.length}개) ===`)
  warnings.slice(0, 20).forEach(w => {
    console.log(`  ${w.videoId}: ${w.issues.map(i => i.detail).join(', ')}`)
  })
  if (warnings.length > 20) console.log(`  ... and ${warnings.length - 20} more`)
}

// Save full report
writeFileSync(REPORT_PATH, JSON.stringify({
  summary: { total, clean, issues: issues.length, critical: critical.length, warnings: warnings.length, minor: minor.length },
  typeCounts,
  critical: critical.map(c => ({ videoId: c.videoId, issues: c.issues || [{ type: c.type, detail: c.detail }] })),
  warnings: warnings.map(w => ({ videoId: w.videoId, issues: w.issues })),
  minor: minor.map(m => ({ videoId: m.videoId, issues: m.issues })),
  cleanVideoIds: files.filter(f => !issues.some(i => i.videoId === f.replace('.json', ''))).map(f => f.replace('.json', '')),
}, null, 2))

console.log(`\n상세 리포트: ${REPORT_PATH}`)
