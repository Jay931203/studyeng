#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const missing = JSON.parse(readFileSync(join(ROOT, 'logs/missing-ko-ids.json'), 'utf8'))
const seed = readFileSync(join(ROOT, 'src/data/seed-videos.ts'), 'utf8')
const results = []

for (const v of missing) {
  if (!seed.includes(v.id)) continue
  const t = JSON.parse(readFileSync(join(ROOT, 'public/transcripts', v.id + '.json'), 'utf8'))
  for (let i = 0; i < t.length; i++) {
    if (!t[i].ko || t[i].ko.trim() === '') {
      results.push({ vid: v.id, idx: i, en: t[i].en })
    }
  }
}

writeFileSync(join(ROOT, 'logs/missing-ko-entries.json'), JSON.stringify(results, null, 2))
console.log('Total missing entries:', results.length)
console.log('Unique videos:', new Set(results.map(r => r.vid)).size)
