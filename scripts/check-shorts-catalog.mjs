#!/usr/bin/env node
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const manifest = JSON.parse(readFileSync(join(ROOT, 'src/data/recommendation-manifest.json'), 'utf8'))
const readyIds = new Set((manifest.videos || []).filter(v => v.qualityTier === 'ready').map(v => v.id))
console.log('Total ready in manifest:', readyIds.size)

const seed = readFileSync(join(ROOT, 'src/data/seed-videos.ts'), 'utf8')
const lines = seed.split('\n')
let lastId = null
const shortsIds = []
for (const line of lines) {
  const m = line.match(/id:\s*'([^']+)'/)
  if (m) lastId = m[1]
  if (line.includes("format: 'shorts'") && lastId) {
    shortsIds.push(lastId)
    lastId = null
  }
}
console.log('Shorts IDs in seed-videos:', shortsIds.length)

const inCatalog = shortsIds.filter(id => readyIds.has(id))
const missing = shortsIds.filter(id => !readyIds.has(id))
console.log('Shorts IN catalog:', inCatalog.length)
console.log('Shorts NOT in catalog:', missing.length)
if (missing.length > 0) {
  console.log('Missing IDs:', missing)
}
