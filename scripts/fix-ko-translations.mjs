#!/usr/bin/env node
/**
 * Fix Korean translation issues in transcript files.
 *
 * Two issue types:
 * 1. ko_contaminated: ko field has >50% Latin/English text → re-translate
 * 2. partial_ko: ko field is empty → translate from en
 *
 * Uses OpenAI GPT-4o-mini for translation (ANTHROPIC_API_KEY not available).
 */

import { readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TRANSCRIPTS_DIR = join(__dirname, '..', 'public', 'transcripts')

// Load API key from .env.local
const envContent = await readFile(join(__dirname, '..', '.env.local'), 'utf-8')
const apiKeyMatch = envContent.match(/OPENAI_API_KEY=(.+)/)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || (apiKeyMatch ? apiKeyMatch[1].trim() : '')

if (!OPENAI_API_KEY) {
  console.error('ERROR: No OPENAI_API_KEY found')
  process.exit(1)
}

// Load file list
const issueList = JSON.parse(
  await readFile(join(__dirname, '..', 'logs', 'remaining-ko-issue.json'), 'utf-8')
)

console.log(`Files to process: ${issueList.length}`)

/**
 * Check if a ko string is contaminated (>50% Latin characters among non-whitespace non-digit chars).
 * Returns true if it needs re-translation.
 */
function isKoContaminated(ko) {
  if (!ko || ko.trim() === '') return false // empty is a different issue

  // Count non-whitespace, non-digit, non-punctuation characters
  const stripped = ko.replace(/[\s\d.,!?;:'"()\-–—…\[\]{}\/\\@#$%^&*+=<>~`|]/g, '')
  if (stripped.length < 3) return false // too short to judge

  // Count Latin chars (a-zA-Z)
  const latinChars = (stripped.match(/[a-zA-Z]/g) || []).length
  // Count Korean chars
  const koreanChars = (stripped.match(/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F\uA960-\uA97F\uD7B0-\uD7FF]/g) || []).length

  const total = latinChars + koreanChars
  if (total === 0) return false

  const latinRatio = latinChars / total

  // If >50% Latin among letter chars, it's contaminated
  return latinRatio > 0.5
}

/**
 * Check if contaminated ko is just proper nouns (acceptable).
 * If the en text is very short and the ko is basically the same, it's likely a proper noun.
 */
function isJustProperNouns(en, ko) {
  // If the en is very short (1-3 words) and ko looks like it's just names
  const enWords = en.trim().split(/\s+/)
  if (enWords.length > 4) return false

  // Check if ko stripped of whitespace/punctuation matches en stripped
  const koClean = ko.replace(/[\s.,!?'"]/g, '').toLowerCase()
  const enClean = en.replace(/[\s.,!?'"]/g, '').toLowerCase()

  // If they're basically the same short string, it might be a proper noun
  if (koClean === enClean && enWords.length <= 3) return true

  return false
}

async function translateBatch(subtitlesToTranslate) {
  if (subtitlesToTranslate.length === 0) return []

  const BATCH_SIZE = 40
  const results = new Array(subtitlesToTranslate.length)

  for (let batchStart = 0; batchStart < subtitlesToTranslate.length; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, subtitlesToTranslate.length)
    const batch = subtitlesToTranslate.slice(batchStart, batchEnd)

    const prompt = batch.map((item, i) => `${i}: ${item.en}`).join('\n')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: `You are a professional English-to-Korean translator for a language learning app. Translate each numbered English line to natural, conversational Korean. Rules:
- Return ONLY the translations, one per line, same number prefix
- Use natural spoken Korean (대화체), not formal written style
- Keep proper nouns (names, brand names, place names) in English
- For song lyrics, translate the meaning naturally into Korean
- Do NOT add explanations or notes
- Do NOT leave English words unless they are proper nouns or commonly used loanwords in Korean`
          },
          {
            role: 'user',
            content: prompt,
          }
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${errText}`)
    }

    const data = await response.json()
    const text = data.choices[0].message.content
    const lines = text.split('\n').filter(l => l.trim())

    for (let i = 0; i < batch.length; i++) {
      const line = lines.find(l => {
        const match = l.match(/^(\d+)\s*[:.)]\s*(.+)/)
        return match && parseInt(match[1]) === i
      })
      if (line) {
        const match = line.match(/^(\d+)\s*[:.)]\s*(.+)/)
        results[batchStart + i] = match ? match[2].trim() : line.replace(/^\d+\s*[:.)]\s*/, '').trim()
      } else {
        // Fallback: try positional matching
        if (lines[i]) {
          const cleaned = lines[i].replace(/^\d+\s*[:.)]\s*/, '').trim()
          results[batchStart + i] = cleaned
        }
      }
    }

    // Rate limit
    if (batchEnd < subtitlesToTranslate.length) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  return results
}

// Main processing
let totalFilesFixed = 0
let totalSubtitlesFixed = 0
let totalEmptyFixed = 0
let totalContaminatedFixed = 0
let skippedFiles = 0

for (const videoId of issueList) {
  const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`)

  let transcript
  try {
    transcript = JSON.parse(await readFile(filePath, 'utf-8'))
  } catch (err) {
    console.log(`  SKIP ${videoId}: ${err.message}`)
    skippedFiles++
    continue
  }

  // Find subtitles that need fixing
  const toFix = []
  for (let i = 0; i < transcript.length; i++) {
    const sub = transcript[i]

    if (!sub.ko || sub.ko.trim() === '') {
      // Empty ko
      toFix.push({ index: i, en: sub.en, reason: 'empty' })
    } else if (isKoContaminated(sub.ko) && !isJustProperNouns(sub.en, sub.ko)) {
      // Contaminated ko
      toFix.push({ index: i, en: sub.en, reason: 'contaminated', oldKo: sub.ko })
    }
  }

  if (toFix.length === 0) {
    console.log(`  OK ${videoId}: no issues found`)
    continue
  }

  const emptyCount = toFix.filter(f => f.reason === 'empty').length
  const contaminatedCount = toFix.filter(f => f.reason === 'contaminated').length

  process.stdout.write(`  ${videoId}: ${toFix.length} to fix (${emptyCount} empty, ${contaminatedCount} contaminated)... `)

  try {
    const translations = await translateBatch(toFix)

    let fixed = 0
    for (let j = 0; j < toFix.length; j++) {
      if (translations[j]) {
        transcript[toFix[j].index].ko = translations[j]
        fixed++
      }
    }

    if (fixed > 0) {
      await writeFile(filePath, JSON.stringify(transcript, null, 2) + '\n', 'utf-8')
      totalFilesFixed++
      totalSubtitlesFixed += fixed
      totalEmptyFixed += toFix.filter((f, j) => f.reason === 'empty' && translations[j]).length
      totalContaminatedFixed += toFix.filter((f, j) => f.reason === 'contaminated' && translations[j]).length
      console.log(`DONE (${fixed} fixed)`)
    } else {
      console.log('no translations returned')
    }
  } catch (err) {
    console.log(`ERROR: ${err.message}`)
  }

  // Rate limit between files
  await new Promise(r => setTimeout(r, 300))
}

console.log(`\n=== Summary ===`)
console.log(`Files fixed: ${totalFilesFixed}/${issueList.length}`)
console.log(`Subtitles re-translated: ${totalSubtitlesFixed}`)
console.log(`  - Empty ko filled: ${totalEmptyFixed}`)
console.log(`  - Contaminated ko fixed: ${totalContaminatedFixed}`)
if (skippedFiles > 0) console.log(`Files skipped (not found): ${skippedFiles}`)
