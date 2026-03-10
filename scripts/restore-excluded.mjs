#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs'

const verify = JSON.parse(readFileSync('logs/transcript-verification.json', 'utf8'))
const seedContent = readFileSync('src/data/seed-videos.ts', 'utf8')

let reExcluded = 0
for (const [id, info] of Object.entries(verify)) {
  if ((info.status === 'needs_review' || info.status === 'needs_whisper') && !seedContent.includes(id)) {
    verify[id] = {
      status: 'excluded',
      reason: 'removed_from_catalog',
      excludedAt: new Date().toISOString()
    }
    reExcluded++
  }
}

writeFileSync('logs/transcript-verification.json', JSON.stringify(verify, null, 2))
console.log('Re-excluded:', reExcluded)
