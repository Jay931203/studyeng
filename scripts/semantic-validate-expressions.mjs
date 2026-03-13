/**
 * semantic-validate-expressions.mjs
 *
 * Uses OpenAI GPT-4o-mini to SEMANTICALLY validate expression-transcript matches.
 * For each candidate, asks AI: "Is this expression used with its intended meaning?"
 *
 * Input: src/data/expression-candidates.json
 * Output: src/data/expression-validated.json
 *
 * Usage: node scripts/semantic-validate-expressions.mjs [--resume]
 */

import fs from 'fs'
import path from 'path'

const CANDIDATES_PATH = 'src/data/expression-candidates.json'
const OUTPUT_PATH = 'src/data/expression-validated.json'
const PROGRESS_PATH = 'src/data/validation-progress.json'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY not set')
  process.exit(1)
}

const resume = process.argv.includes('--resume')

// Load candidates
const allCandidates = JSON.parse(fs.readFileSync(CANDIDATES_PATH, 'utf-8'))
console.log(`Loaded ${allCandidates.length} candidates`)

// Group by videoId
const byVideo = {}
allCandidates.forEach(c => {
  if (!byVideo[c.videoId]) byVideo[c.videoId] = []
  byVideo[c.videoId].push(c)
})
const videoIds = Object.keys(byVideo)
console.log(`Grouped into ${videoIds.length} videos`)

// Load progress if resuming
let validated = []
let processedVideos = new Set()
if (resume && fs.existsSync(PROGRESS_PATH)) {
  const progress = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'))
  validated = progress.validated || []
  processedVideos = new Set(progress.processedVideoIds || [])
  console.log(`Resuming: ${processedVideos.size} videos done, ${validated.length} validated matches`)
}

// Batch videos into groups for API calls (aim for ~30-50 candidates per call)
function createBatches(videoIds, byVideo, batchSize = 40) {
  const batches = []
  let currentBatch = []
  let currentCount = 0

  for (const vid of videoIds) {
    if (processedVideos.has(vid)) continue
    const candidates = byVideo[vid]
    if (currentCount + candidates.length > batchSize && currentBatch.length > 0) {
      batches.push(currentBatch)
      currentBatch = []
      currentCount = 0
    }
    currentBatch.push({ videoId: vid, candidates })
    currentCount += candidates.length
  }
  if (currentBatch.length > 0) batches.push(currentBatch)
  return batches
}

const batches = createBatches(videoIds, byVideo)
console.log(`Created ${batches.length} API batches`)

async function callOpenAI(messages, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0,
          max_tokens: 4096,
        }),
      })

      if (!res.ok) {
        const errText = await res.text()
        if (res.status === 429) {
          const wait = Math.pow(2, attempt) * 2000
          console.log(`  Rate limited, waiting ${wait}ms...`)
          await new Promise(r => setTimeout(r, wait))
          continue
        }
        throw new Error(`OpenAI API error ${res.status}: ${errText}`)
      }

      const data = await res.json()
      return data.choices[0].message.content
    } catch (err) {
      if (attempt === retries - 1) throw err
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
    }
  }
}

function buildPrompt(batchGroup) {
  const lines = []
  let idx = 0
  for (const { videoId, candidates } of batchGroup) {
    for (const c of candidates) {
      lines.push(`${idx}|${c.canonical}|${c.meaning_ko}|${c.category}|${c.en}`)
      idx++
    }
  }

  return {
    role: 'user',
    content: `You are validating English expression matches for a language learning app.

For each row below, decide if the expression is used WITH ITS INTENDED MEANING in the sentence.
Format: index|expression|intended_meaning_ko|category|sentence

Rules:
- "about" as hedging means "approximately/roughly". "about to [verb]" or "about [topic]" = REJECT
- "well" as discourse marker means filler at start ("Well, ..."). "well" as adjective/adverb = REJECT
- "look" as discourse marker means attention-getter ("Look, ..."). "look at/for" as verb = REJECT
- "some" as hedging means "approximately". "some [noun]" as determiner = REJECT
- "around" as hedging means "approximately". "around [place]" = REJECT
- "just" as hedging means "only/merely" used to soften. "just [past tense]" = OK if softening
- For slang contractions (gonna, wanna, gotta, kinda, lemme, etc.): almost always ACCEPT
- For exclamations (wow, hey, damn, ooh, etc.): ACCEPT if used as exclamation
- For multi-word expressions: ACCEPT only if the COMPLETE phrase appears with intended meaning
- For phrasal verbs: ACCEPT only if verb+particle appear together with intended meaning
- "dead" as slang means "extremely funny/done". "dead" meaning actually deceased = REJECT
- "hit" as slang means impressive. "hit" as physical action = REJECT

Respond with ONLY the indices that are VALID (expression IS used with intended meaning).
Format your response as comma-separated numbers, nothing else. If none valid, respond "NONE".

${lines.join('\n')}`,
  }
}

// Process batches with concurrency
const CONCURRENCY = 5
let totalProcessed = 0
let totalValid = 0
let totalRejected = 0
const startTime = Date.now()

async function processBatch(batchGroup, batchIdx) {
  const prompt = buildPrompt(batchGroup)
  const systemMsg = { role: 'system', content: 'You are a precise English linguistics expert. Evaluate expression usage semantically. Be strict about intended meaning.' }

  try {
    const response = await callOpenAI([systemMsg, prompt])
    const trimmed = response.trim()

    // Build flat candidate list for this batch
    const flatCandidates = []
    for (const { videoId, candidates } of batchGroup) {
      for (const c of candidates) {
        flatCandidates.push(c)
      }
    }

    if (trimmed === 'NONE') {
      totalRejected += flatCandidates.length
    } else {
      const validIndices = new Set(
        trimmed.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
      )
      for (const idx of validIndices) {
        if (idx >= 0 && idx < flatCandidates.length) {
          const c = flatCandidates[idx]
          validated.push({
            videoId: c.videoId,
            exprId: c.exprId,
            sentenceIdx: c.sentenceIdx,
            en: c.en,
            ko: c.ko,
          })
          totalValid++
        }
      }
      totalRejected += flatCandidates.length - validIndices.size
    }

    // Mark videos as processed
    for (const { videoId } of batchGroup) {
      processedVideos.add(videoId)
    }

    totalProcessed += flatCandidates.length

    // Save progress every 10 batches
    if (batchIdx % 10 === 0) {
      saveProgress()
    }
  } catch (err) {
    console.error(`  Batch ${batchIdx} failed: ${err.message}`)
    // Don't mark as processed, will be retried on --resume
  }
}

function saveProgress() {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify({
    validated,
    processedVideoIds: [...processedVideos],
    timestamp: new Date().toISOString(),
  }))
}

async function main() {
  console.log(`\nStarting semantic validation with ${CONCURRENCY} concurrent requests...`)
  console.log(`Batches to process: ${batches.length}\n`)

  for (let i = 0; i < batches.length; i += CONCURRENCY) {
    const chunk = batches.slice(i, i + CONCURRENCY)
    const promises = chunk.map((batch, j) => processBatch(batch, i + j))
    await Promise.all(promises)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    const pct = (((i + chunk.length) / batches.length) * 100).toFixed(1)
    console.log(`[${elapsed}s] ${pct}% — Batch ${i + chunk.length}/${batches.length} — Valid: ${totalValid}, Rejected: ${totalRejected}`)
  }

  // Final save
  saveProgress()

  // Build expression-index format
  const newIndex = {}
  for (const v of validated) {
    if (!newIndex[v.videoId]) newIndex[v.videoId] = []
    newIndex[v.videoId].push({
      exprId: v.exprId,
      sentenceIdx: v.sentenceIdx,
      en: v.en,
      ko: v.ko,
    })
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(newIndex))

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n=== Semantic Validation Complete ===`)
  console.log(`Time: ${elapsed}s`)
  console.log(`Total candidates: ${allCandidates.length}`)
  console.log(`Processed: ${totalProcessed}`)
  console.log(`Valid (kept): ${totalValid} (${(totalValid/allCandidates.length*100).toFixed(1)}%)`)
  console.log(`Rejected: ${totalRejected} (${(totalRejected/allCandidates.length*100).toFixed(1)}%)`)
  console.log(`Videos in index: ${Object.keys(newIndex).length}`)
  console.log(`\nOutput written to ${OUTPUT_PATH}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  saveProgress()
  process.exit(1)
})
