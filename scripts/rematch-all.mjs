#!/usr/bin/env node
/**
 * Run all 10 batches sequentially to avoid OpenAI rate limits.
 * Usage: node scripts/rematch-all.mjs [startBatch]
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const TOTAL = 10
const startBatch = parseInt(process.argv[2] ?? '0')

const outDir = path.resolve('src/data/match-results-v3')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

for (let i = startBatch; i < TOTAL; i++) {
  const outFile = path.join(outDir, `batch-${i}.json`)

  // Skip if already has meaningful results (>5 matches)
  if (fs.existsSync(outFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outFile, 'utf-8'))
      if (existing.length > 5) {
        console.log(`\nBatch ${i}: already has ${existing.length} matches, skipping`)
        continue
      }
    } catch {}
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`Starting batch ${i} / ${TOTAL}`)
  console.log(`${'='.repeat(60)}\n`)

  try {
    execSync(
      `node scripts/rematch-expressions-v3.mjs --batch ${i} --total ${TOTAL}`,
      { stdio: 'inherit', env: { ...process.env }, timeout: 1800000 }
    )
  } catch (err) {
    console.error(`Batch ${i} failed: ${err.message}`)
  }

  // Brief pause between batches
  if (i < TOTAL - 1) {
    console.log('\nWaiting 5s before next batch...')
    await new Promise(r => setTimeout(r, 5000))
  }
}

// Merge results
console.log(`\n${'='.repeat(60)}`)
console.log('Merging all batches...')
console.log(`${'='.repeat(60)}\n`)

const allResults = []
const videoMap = {}

for (let i = 0; i < TOTAL; i++) {
  const batchFile = path.join(outDir, `batch-${i}.json`)
  if (!fs.existsSync(batchFile)) continue
  const batch = JSON.parse(fs.readFileSync(batchFile, 'utf-8'))
  for (const r of batch) {
    if (!videoMap[r.videoId]) videoMap[r.videoId] = []
    videoMap[r.videoId].push({
      exprId: r.exprId,
      sentenceIdx: r.sentenceIdx,
      en: r.en,
      ko: r.ko,
      surfaceForm: r.surfaceForm,
    })
  }
  allResults.push(...batch)
}

// Write merged index
const indexPath = path.resolve('src/data/expression-index-v3.json')
fs.writeFileSync(indexPath, JSON.stringify(videoMap, null, 2))

// Stats
const uniqueExprs = new Set(allResults.map(r => r.exprId))
const uniqueVideos = Object.keys(videoMap)
const entriesData = JSON.parse(fs.readFileSync('src/data/expression-entries-v2.json', 'utf-8'))
const inflected = allResults.filter(r => {
  return r.surfaceForm.toLowerCase() !== entriesData[r.exprId]?.canonical?.toLowerCase()
})

console.log('Results:')
console.log(`  Total matches: ${allResults.length}`)
console.log(`  Unique expressions: ${uniqueExprs.size}`)
console.log(`  Unique videos: ${uniqueVideos.length}`)
console.log(`  Written to: ${indexPath}`)
