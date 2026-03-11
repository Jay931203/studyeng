#!/usr/bin/env node
/**
 * Apply pre-translated Korean subtitles to transcript files.
 * Reads ko-translations.json and patches each transcript file.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts')
const TRANSLATIONS_PATH = join(ROOT, 'logs', 'ko-translations.json')

const translations = JSON.parse(readFileSync(TRANSLATIONS_PATH, 'utf8'))

// Group by video ID
const byVideo = {}
for (const t of translations) {
  if (!byVideo[t.vid]) byVideo[t.vid] = []
  byVideo[t.vid].push(t)
}

let filesUpdated = 0
let totalApplied = 0

for (const [vid, items] of Object.entries(byVideo)) {
  const filePath = join(TRANSCRIPTS_DIR, `${vid}.json`)
  if (!existsSync(filePath)) {
    console.log(`  ${vid}: FILE NOT FOUND, skip`)
    continue
  }

  const transcript = JSON.parse(readFileSync(filePath, 'utf8'))
  let applied = 0

  for (const item of items) {
    if (item.idx < transcript.length) {
      transcript[item.idx].ko = item.ko
      applied++
    } else {
      console.log(`  ${vid}: idx ${item.idx} out of range (${transcript.length} entries)`)
    }
  }

  writeFileSync(filePath, JSON.stringify(transcript, null, 2) + '\n')
  console.log(`  ${vid}: ${applied}/${items.length} applied`)
  filesUpdated++
  totalApplied += applied
}

console.log(`\n=== 완료 ===`)
console.log(`파일 업데이트: ${filesUpdated}`)
console.log(`번역 적용: ${totalApplied}/${translations.length}`)
