#!/usr/bin/env node
/**
 * Sync auto_verified files: update expression-tags hashes to match current transcripts.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts')
const TAGS_DIR = join(ROOT, 'public', 'expression-tags')
const VERIFY_PATH = join(ROOT, 'logs', 'transcript-verification.json')

function computeHash(transcript) {
  const enTexts = transcript.map(s => s.en).join('|')
  return createHash('sha256').update(enTexts).digest('hex').slice(0, 16)
}

const verify = JSON.parse(readFileSync(VERIFY_PATH, 'utf8'))

const autoVerified = Object.entries(verify)
  .filter(([, v]) => v.status === 'auto_verified')
  .map(([id]) => id)

console.log('Auto-verified files to sync:', autoVerified.length)

let synced = 0
let noTagsFile = 0
let alreadyMatched = 0

for (const id of autoVerified) {
  const tagsPath = join(TAGS_DIR, id + '.json')
  const transcriptPath = join(TRANSCRIPTS_DIR, id + '.json')

  if (!existsSync(tagsPath)) {
    noTagsFile++
    continue
  }

  const transcript = JSON.parse(readFileSync(transcriptPath, 'utf8'))
  const currentHash = computeHash(transcript)

  const tags = JSON.parse(readFileSync(tagsPath, 'utf8'))

  if (tags.transcriptHash === currentHash) {
    alreadyMatched++
    verify[id] = {
      status: 'fully_verified',
      verifiedAt: new Date().toISOString(),
      hash: currentHash,
      subtitleCount: transcript.length
    }
    continue
  }

  // Update hash in expression-tags
  tags.transcriptHash = currentHash
  writeFileSync(tagsPath, JSON.stringify(tags, null, 2))

  // Update verification status
  verify[id] = {
    status: 'fully_verified',
    verifiedAt: new Date().toISOString(),
    hash: currentHash,
    subtitleCount: transcript.length
  }
  synced++
}

writeFileSync(VERIFY_PATH, JSON.stringify(verify, null, 2))

console.log('Synced hash:', synced)
console.log('Already matched:', alreadyMatched)
console.log('No tags file:', noTagsFile)
