#!/usr/bin/env node
/**
 * Transcript Verification System
 * Tracks review status of all transcript files.
 *
 * Usage:
 *   node scripts/transcript-verification.mjs              # Generate/update verification status
 *   node scripts/transcript-verification.mjs --status      # Show summary
 *   node scripts/transcript-verification.mjs --mark <id>   # Mark a video as verified
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts')
const EXPRESSION_TAGS_DIR = join(ROOT, 'public', 'expression-tags')
const VERIFY_PATH = join(ROOT, 'logs', 'transcript-verification.json')

function computeHash(transcript) {
  const enTexts = transcript.map(s => s.en).join('|')
  return createHash('sha256').update(enTexts).digest('hex').slice(0, 16)
}

function hasNonKoreanContamination(ko) {
  if (!ko || ko.length === 0) return false
  const latinChars = (ko.match(/[a-zA-Z]/g) || []).length
  const totalChars = ko.replace(/[\s\d.,!?'"()\-:;]/g, '').length
  if (totalChars === 0) return false
  return latinChars / totalChars > 0.5
}

function hasMatchingExpressionTags(videoId, transcriptHash) {
  const tagsPath = join(EXPRESSION_TAGS_DIR, videoId + '.json')
  if (!existsSync(tagsPath)) return false
  try {
    const tags = JSON.parse(readFileSync(tagsPath, 'utf8'))
    return tags.transcriptHash === transcriptHash
  } catch {
    return false
  }
}

function auditFile(videoId) {
  const filePath = join(TRANSCRIPTS_DIR, videoId + '.json')
  let data
  try {
    data = JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return { status: 'error', issues: ['parse_error'] }
  }

  if (!Array.isArray(data)) return { status: 'error', issues: ['not_array'] }
  if (data.length === 0) return { status: 'needs_whisper', issues: ['empty'] }
  if (data.length < 3) return { status: 'needs_review', issues: ['too_short'] }

  const issues = []
  let missingKo = 0
  let contaminated = 0

  for (const sub of data) {
    if (!sub.ko || sub.ko.trim() === '') missingKo++
    else if (hasNonKoreanContamination(sub.ko)) contaminated++
  }

  const missingPct = Math.round(missingKo / data.length * 100)
  if (missingPct === 100) return { status: 'needs_translation', issues: ['no_ko'], hash: computeHash(data) }
  if (missingPct > 20) issues.push('partial_ko')
  if (contaminated > 0) issues.push('ko_contaminated')

  const hash = computeHash(data)

  if (issues.length === 0) {
    return { status: 'clean', hash, subtitleCount: data.length }
  }
  return { status: 'needs_review', issues, hash, subtitleCount: data.length }
}

// Load existing verification data
let existing = {}
if (existsSync(VERIFY_PATH)) {
  existing = JSON.parse(readFileSync(VERIFY_PATH, 'utf8'))
}

const args = process.argv.slice(2)

// --mark <videoId>: Mark as verified
if (args[0] === '--mark') {
  const id = args[1]
  if (!id) { console.log('Usage: --mark <videoId>'); process.exit(1) }
  const audit = auditFile(id)
  existing[id] = {
    status: 'verified',
    verifiedAt: new Date().toISOString(),
    hash: audit.hash,
    subtitleCount: audit.subtitleCount
  }
  writeFileSync(VERIFY_PATH, JSON.stringify(existing, null, 2))
  console.log(`${id} marked as verified (hash: ${audit.hash})`)
  process.exit(0)
}

// --status: Show summary
if (args[0] === '--status') {
  const counts = {}
  for (const [id, info] of Object.entries(existing)) {
    counts[info.status] = (counts[info.status] || 0) + 1
  }
  console.log('=== Verification Status ===')
  console.log(`Total tracked: ${Object.keys(existing).length}`)
  Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`)
  })

  // Check for hash mismatches (en text changed since verification)
  let hashMismatch = 0
  for (const [id, info] of Object.entries(existing)) {
    if ((info.status === 'verified' || info.status === 'fully_verified') && info.hash) {
      const audit = auditFile(id)
      if (audit.hash && audit.hash !== info.hash) {
        hashMismatch++
        console.log(`  ⚠ Hash mismatch: ${id} (verified: ${info.hash}, current: ${audit.hash})`)
      }
    }
  }
  if (hashMismatch > 0) {
    console.log(`\n⚠ ${hashMismatch} verified files have changed en text - need re-pipeline!`)
  }
  process.exit(0)
}

// Default: Generate/update verification for all files
const files = readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'))
console.log(`Scanning ${files.length} transcript files...\n`)

let updated = 0
let alreadyVerified = 0
let hashChanged = 0

for (const file of files) {
  const videoId = file.replace('.json', '')
  const audit = auditFile(videoId)

  // Skip excluded videos
  if (existing[videoId]?.status === 'excluded') {
    alreadyVerified++
    continue
  }

  // If already verified or fully_verified, check hash
  if (existing[videoId]?.status === 'verified' || existing[videoId]?.status === 'fully_verified') {
    if (audit.hash && existing[videoId].hash !== audit.hash) {
      // en text changed since verification → needs full re-pipeline
      existing[videoId] = {
        status: 'hash_changed',
        previousHash: existing[videoId].hash,
        currentHash: audit.hash,
        detectedAt: new Date().toISOString(),
        note: 'en text changed - needs full pipeline: whisper → ko translation → expression-tags'
      }
      hashChanged++
      updated++
    } else {
      alreadyVerified++
    }
    continue
  }

  // Set status based on audit
  if (audit.status === 'clean') {
    const tagsMatch = hasMatchingExpressionTags(videoId, audit.hash)
    existing[videoId] = {
      status: tagsMatch ? 'fully_verified' : 'auto_verified',
      verifiedAt: new Date().toISOString(),
      hash: audit.hash,
      subtitleCount: audit.subtitleCount
    }
  } else {
    existing[videoId] = {
      status: audit.status,
      issues: audit.issues,
      hash: audit.hash || null,
      subtitleCount: audit.subtitleCount || 0,
      checkedAt: new Date().toISOString()
    }
  }
  updated++
}

writeFileSync(VERIFY_PATH, JSON.stringify(existing, null, 2))

// Summary
const counts = {}
for (const info of Object.values(existing)) {
  counts[info.status] = (counts[info.status] || 0) + 1
}

console.log('=== 검수 태깅 결과 ===')
console.log(`전체 파일: ${files.length}`)
console.log(`신규 태깅: ${updated}`)
console.log(`기존 verified 유지: ${alreadyVerified}`)
if (hashChanged > 0) console.log(`⚠ 해시 변경 감지: ${hashChanged}`)
console.log('')
console.log('상태별:')
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
  console.log(`  ${status}: ${count}`)
})
console.log(`\n저장: ${VERIFY_PATH}`)
