#!/usr/bin/env node
/**
 * Fill missing Korean translations in transcript files.
 * Reads missing-ko-ids.json, sends untranslated entries to Claude Haiku, updates files.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=xxx node scripts/fill-missing-ko.mjs
 *   ANTHROPIC_API_KEY=xxx node scripts/fill-missing-ko.mjs --dry   # preview only
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts')
const MISSING_KO_PATH = join(ROOT, 'logs', 'missing-ko-ids.json')
const SEED_PATH = join(ROOT, 'src', 'data', 'seed-videos.ts')

const dryRun = process.argv.includes('--dry')

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey && !dryRun) {
    console.error('ANTHROPIC_API_KEY required')
    process.exit(1)
  }

  const missingList = JSON.parse(readFileSync(MISSING_KO_PATH, 'utf8'))
  const seedContent = readFileSync(SEED_PATH, 'utf8')

  // Filter out videos not in seed (excluded)
  const toProcess = missingList.filter(v => seedContent.includes(v.id))
  console.log(`Total missing-ko videos: ${missingList.length}`)
  console.log(`In seed (will translate): ${toProcess.length}`)
  console.log(`Excluded (skip): ${missingList.length - toProcess.length}\n`)

  if (dryRun) {
    let totalMissing = 0
    for (const v of toProcess) {
      console.log(`  ${v.id}: ${v.missing}/${v.total} missing`)
      totalMissing += v.missing
    }
    console.log(`\nTotal subtitles to translate: ${totalMissing}`)
    return
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey })

  let totalTranslated = 0
  let totalFailed = 0
  let filesUpdated = 0

  for (const video of toProcess) {
    const filePath = join(TRANSCRIPTS_DIR, `${video.id}.json`)
    if (!existsSync(filePath)) {
      console.log(`  ${video.id}: FILE NOT FOUND, skip`)
      continue
    }

    const transcript = JSON.parse(readFileSync(filePath, 'utf8'))
    const missingIndices = []
    for (let i = 0; i < transcript.length; i++) {
      if (!transcript[i].ko || transcript[i].ko.trim() === '') {
        missingIndices.push(i)
      }
    }

    if (missingIndices.length === 0) {
      console.log(`  ${video.id}: no missing ko (already filled?)`)
      continue
    }

    process.stdout.write(`  ${video.id}: ${missingIndices.length} missing... `)

    try {
      // Build translation request
      const englishTexts = missingIndices
        .map((idx, n) => `${n}: ${transcript[idx].en}`)
        .join('\n')

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: `Translate each numbered English sentence to natural, conversational Korean. Return ONLY the translations, one per line, with the same number prefix. Do not add any explanation.\n\n${englishTexts}`,
        }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const lines = text.split('\n').filter(l => l.trim())

      let filled = 0
      for (let n = 0; n < missingIndices.length; n++) {
        const line = lines.find(l => l.startsWith(`${n}:`))
        if (line) {
          const ko = line.replace(/^\d+:\s*/, '').trim()
          if (ko) {
            transcript[missingIndices[n]].ko = ko
            filled++
          }
        }
      }

      writeFileSync(filePath, JSON.stringify(transcript, null, 2) + '\n')
      console.log(`OK (${filled}/${missingIndices.length} filled)`)
      totalTranslated += filled
      totalFailed += (missingIndices.length - filled)
      filesUpdated++

      // Rate limit
      await new Promise(r => setTimeout(r, 500))
    } catch (err) {
      console.log(`FAILED: ${err.message}`)
      totalFailed += missingIndices.length
    }
  }

  console.log(`\n=== 완료 ===`)
  console.log(`파일 업데이트: ${filesUpdated}`)
  console.log(`번역 성공: ${totalTranslated}`)
  console.log(`번역 실패: ${totalFailed}`)
}

main().catch(console.error)
