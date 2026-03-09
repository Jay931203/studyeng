#!/usr/bin/env node
// Compute transcript hash for a given videoId
// Usage: node scripts/transcript-hash.mjs <videoId>
// Output: 16-char hex hash of en texts joined by '|'

import { readFileSync, existsSync } from 'fs'
import { createHash } from 'crypto'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const videoId = process.argv[2]
if (!videoId) { console.error('Usage: node scripts/transcript-hash.mjs <videoId>'); process.exit(1) }

const tPath = join(ROOT, 'public', 'transcripts', `${videoId}.json`)
const ePath = join(ROOT, 'public', 'expression-tags', `${videoId}.json`)

let enTexts
if (existsSync(tPath)) {
  enTexts = JSON.parse(readFileSync(tPath, 'utf8')).map(s => s.en)
} else if (existsSync(ePath)) {
  enTexts = JSON.parse(readFileSync(ePath, 'utf8')).sentences.map(s => s.en)
} else {
  console.error('No transcript or expression-tags file found'); process.exit(1)
}

console.log(createHash('sha256').update(enTexts.join('|')).digest('hex').slice(0, 16))
