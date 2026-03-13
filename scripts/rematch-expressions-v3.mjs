#!/usr/bin/env node
/**
 * rematch-expressions-v3.mjs
 *
 * AI-based expression matching with surface form capture.
 * Two-stage: (1) programmatic pre-filter, (2) GPT-4o-mini strict validation.
 *
 * Usage:
 *   node scripts/rematch-expressions-v3.mjs --batch 0 --total 10
 */

import fs from 'fs'
import path from 'path'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY not set')
  process.exit(1)
}

const MAX_RETRIES = 5
const CONCURRENT_CALLS = 1     // sequential to avoid TPM limit
const SENTENCES_PER_CALL = 25
const RETRY_BASE_DELAY = 5000  // 5s base, exponential backoff
const CALL_DELAY = 2000        // 2s between each call

// Parse args
const args = process.argv.slice(2)
const batchIdx = parseInt(args[args.indexOf('--batch') + 1] ?? '0')
const totalBatches = parseInt(args[args.indexOf('--total') + 1] ?? '1')

console.log(`Batch ${batchIdx} / ${totalBatches}`)

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

const entriesPath = path.resolve('src/data/expression-entries-v2.json')
const transcriptsDir = path.resolve('public/transcripts')
const outDir = path.resolve('src/data/match-results-v3')

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const entries = JSON.parse(fs.readFileSync(entriesPath, 'utf-8'))
const exprList = Object.values(entries)

// Build canonical → id map
const canonicalToId = {}
for (const [id, entry] of Object.entries(entries)) {
  canonicalToId[entry.canonical.toLowerCase()] = id
}

// Get transcript files for this batch
const allFiles = fs.readdirSync(transcriptsDir)
  .filter((f) => f.endsWith('.json'))
  .sort()

const batchSize = Math.ceil(allFiles.length / totalBatches)
const startIdx = batchIdx * batchSize
const batchFiles = allFiles.slice(startIdx, startIdx + batchSize)

console.log(`Processing ${batchFiles.length} transcript files (${startIdx}..${startIdx + batchFiles.length - 1})`)

// ---------------------------------------------------------------------------
// Pre-filter: find candidate expressions for a sentence
// ---------------------------------------------------------------------------

// Build word → expressions index for fast lookup
const wordToExprs = {}
for (const expr of exprList) {
  const words = expr.canonical.toLowerCase().split(/\s+/)
  for (const w of words) {
    const clean = w.replace(/[^a-z']/g, '')
    if (clean.length < 3) continue
    if (!wordToExprs[clean]) wordToExprs[clean] = []
    wordToExprs[clean].push(expr.canonical)
  }
}

function preFilter(sentence) {
  const sentWords = sentence.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z']/g, ''))
  const candidateSet = new Set()

  for (const w of sentWords) {
    if (w.length < 3) continue
    const matches = wordToExprs[w]
    if (matches) {
      for (const m of matches) candidateSet.add(m)
    }
  }

  return [...candidateSet]
}

// ---------------------------------------------------------------------------
// Build segments with pre-filtered candidates
// ---------------------------------------------------------------------------

const allSegments = []
let skippedNoCandidates = 0

for (const file of batchFiles) {
  const videoId = file.replace('.json', '')
  try {
    const data = JSON.parse(fs.readFileSync(path.join(transcriptsDir, file), 'utf-8'))
    for (let i = 0; i < data.length; i++) {
      const seg = data[i]
      if (!seg.en || seg.en.trim().length < 5) continue

      const candidates = preFilter(seg.en)
      if (candidates.length === 0) {
        skippedNoCandidates++
        continue
      }

      allSegments.push({
        videoId,
        sentenceIdx: i,
        en: seg.en,
        ko: seg.ko || '',
        candidates,
      })
    }
  } catch {
    // skip corrupted files
  }
}

console.log(`Total segments with candidates: ${allSegments.length}`)
console.log(`Skipped (no candidates): ${skippedNoCandidates}`)

// ---------------------------------------------------------------------------
// OpenAI API call — validate candidates for a group of sentences
// ---------------------------------------------------------------------------

async function callOpenAI(segmentGroup) {
  // Build prompt with sentences and their candidates
  const parts = segmentGroup.map((seg, i) => {
    return `[${i + 1}] "${seg.en}"\nCandidates: ${seg.candidates.join(', ')}`
  })

  const prompt = `You are a strict expression matcher. For each sentence, check if any candidate expression is ACTUALLY USED in the sentence.

MATCHING RULES:
1. ALL core words of the expression must appear in the sentence (conjugated forms OK)
2. The words must form a CONTIGUOUS or near-contiguous phrase in the sentence
3. The expression's MEANING must match how it's used in the sentence

EXAMPLES OF VALID MATCHES:
- "point out" matches "pointed out" (past tense)
- "go for it" matches "went for it" (conjugation)
- "tear apart" matches "tear you apart" (insertion of object)
- "oh my god" matches "Oh my god" (exact)

EXAMPLES OF INVALID MATCHES (DO NOT MATCH THESE):
- "keep going" does NOT match "keep pushing" (different verb)
- "you're kidding" does NOT match "you're a part-time lover" (completely different)
- "give me a hand" does NOT match "give me some time" (different meaning)
- "i can't believe" does NOT match "i can't pretend" (different verb)
- "take a look" does NOT match "look at the poor man" (missing "take")
- "that's why" does NOT match "that's good" (different word)
- "cotton on to" does NOT match "Yeah, cotton" (incomplete expression)
- "when it comes to" does NOT match "when do I get" (different phrase)
- "what a mess" does NOT match "making a mess" (missing "what a")

The "surface" field must be the EXACT consecutive text from the sentence that contains the expression. It should be the shortest substring that captures the full expression.

${parts.join('\n\n')}

Return JSON: {"matches":[{"idx":1,"canonical":"expression","surface":"exact substring"}]}
Return empty matches array if no valid matches exist. Be strict - false negatives are much better than false positives.`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error ${res.status}: ${err}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content ?? '{}'

  try {
    const parsed = JSON.parse(content)
    if (parsed.matches && Array.isArray(parsed.matches)) return parsed.matches
    for (const v of Object.values(parsed)) {
      if (Array.isArray(v)) return v
    }
    return []
  } catch {
    return []
  }
}

async function callWithRetry(segmentGroup) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await callOpenAI(segmentGroup)
    } catch (err) {
      console.error(`  Retry ${attempt + 1}/${MAX_RETRIES}: ${err.message}`)
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_BASE_DELAY * Math.pow(2, attempt) + Math.random() * 1000
        await new Promise((r) => setTimeout(r, delay))
      }
    }
  }
  return []
}

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

async function processAll() {
  const results = []
  const groups = []

  for (let i = 0; i < allSegments.length; i += SENTENCES_PER_CALL) {
    groups.push(allSegments.slice(i, i + SENTENCES_PER_CALL))
  }

  console.log(`API calls needed: ${groups.length}`)
  let completed = 0
  let totalMatches = 0

  async function processGroup(group) {
    const matches = await callWithRetry(group)

    for (const match of matches) {
      const segIdx = (match.idx ?? 0) - 1
      if (segIdx < 0 || segIdx >= group.length) continue

      const seg = group[segIdx]
      const canonical = match.canonical?.toLowerCase()?.trim()
      const exprId = canonicalToId[canonical]
      if (!exprId) continue

      const surface = match.surface?.trim()
      if (!surface) continue

      // Verify surface form exists in sentence (case-insensitive)
      if (!seg.en.toLowerCase().includes(surface.toLowerCase())) continue

      results.push({
        videoId: seg.videoId,
        sentenceIdx: seg.sentenceIdx,
        exprId,
        en: seg.en,
        ko: seg.ko,
        surfaceForm: surface,
      })
      totalMatches++
    }

    completed++
    if (completed % 20 === 0 || completed === groups.length) {
      console.log(`  Progress: ${completed}/${groups.length} calls, ${totalMatches} matches`)
    }
  }

  // Run sequentially with delay between calls
  for (let i = 0; i < groups.length; i++) {
    await processGroup(groups[i])
    if (i < groups.length - 1 && CALL_DELAY > 0) {
      await new Promise(r => setTimeout(r, CALL_DELAY))
    }
  }

  return results
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const startTime = Date.now()
const results = await processAll()

const outPath = path.join(outDir, `batch-${batchIdx}.json`)
fs.writeFileSync(outPath, JSON.stringify(results, null, 2))

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
console.log(`\nBatch ${batchIdx} complete:`)
console.log(`  ${results.length} matches found`)
console.log(`  ${elapsed}s elapsed`)
console.log(`  Written to ${outPath}`)
