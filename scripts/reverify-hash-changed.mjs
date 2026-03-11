#!/usr/bin/env node
/**
 * Re-verify files with hash_changed status.
 * After Whisper re-run, en text improved → hash changed → need re-verification.
 * Audit each, mark as fully_verified if clean + expression-tags match.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
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

const verify = JSON.parse(readFileSync(VERIFY_PATH, 'utf8'))
let reVerified = 0
let issues = 0

for (const [id, info] of Object.entries(verify)) {
  if (info.status !== 'hash_changed') continue

  const filePath = join(TRANSCRIPTS_DIR, `${id}.json`)
  if (!existsSync(filePath)) continue

  const transcript = JSON.parse(readFileSync(filePath, 'utf8'))
  const hash = computeHash(transcript)

  // Check for missing ko
  const missingKo = transcript.filter(s => !s.ko || s.ko.trim() === '').length
  if (missingKo > 0) {
    console.log(`  ${id}: ${missingKo} missing ko - needs_review`)
    verify[id] = {
      status: 'needs_review',
      issues: ['partial_ko'],
      hash,
      subtitleCount: transcript.length,
      checkedAt: new Date().toISOString()
    }
    issues++
    continue
  }

  // Check expression-tags match
  const tagsPath = join(EXPRESSION_TAGS_DIR, `${id}.json`)
  let tagsMatch = false
  if (existsSync(tagsPath)) {
    try {
      const tags = JSON.parse(readFileSync(tagsPath, 'utf8'))
      tagsMatch = tags.transcriptHash === hash
    } catch {}
  }

  verify[id] = {
    status: tagsMatch ? 'fully_verified' : 'auto_verified',
    verifiedAt: new Date().toISOString(),
    hash,
    subtitleCount: transcript.length,
    note: 'Re-verified after Whisper re-run'
  }
  reVerified++
}

writeFileSync(VERIFY_PATH, JSON.stringify(verify, null, 2))

console.log(`\n=== Re-verification 완료 ===`)
console.log(`재인증: ${reVerified}`)
console.log(`이슈 발견: ${issues}`)

// Final counts
const counts = {}
for (const info of Object.values(verify)) {
  counts[info.status] = (counts[info.status] || 0) + 1
}
console.log('\n최종 상태:')
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
  console.log(`  ${status}: ${count}`)
})
