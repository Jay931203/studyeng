#!/usr/bin/env node
/**
 * Build Expression Dictionary from expression-tag files
 * Extracts sentences tagged X01-X07, batches through Claude Haiku
 * to extract canonical expressions, then groups into a dictionary.
 */

import fs from 'fs'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'

const TAGS_DIR = './public/expression-tags'
const OUTPUT_FILE = './src/data/expression-dictionary.json'
const PROGRESS_FILE = './scripts/expr-dict-progress.json'
const BATCH_SIZE = 80
const MODEL = 'claude-haiku-4-5-20251001'

const client = new Anthropic()

// Step 1: Extract all expression-tagged sentences
function extractTaggedSentences() {
  const files = fs.readdirSync(TAGS_DIR).filter(f => f.endsWith('.json'))
  const sentences = []

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(TAGS_DIR, file), 'utf8'))
    const videoId = data.videoId
    const title = data.title || ''

    for (const s of data.sentences || []) {
      const types = s.tags?.expression_types || []
      const exprTypes = types.filter(t => ['X01','X02','X03','X04','X05','X06','X07'].includes(t))
      if (exprTypes.length === 0) continue

      sentences.push({
        videoId,
        sentenceIdx: parseInt(s.id.split('-').pop(), 10),
        en: s.en,
        ko: s.ko,
        cefr: s.tags?.cefr || 'B1',
        exprTypes,
        power: s.tags?.power || [],
      })
    }
  }

  console.log(`Extracted ${sentences.length} tagged sentences from ${files.length} files`)
  return sentences
}

// Step 2: Batch process through Claude
async function extractCanonicalExpressions(sentences, startBatch = 0) {
  const batches = []
  for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
    batches.push(sentences.slice(i, i + BATCH_SIZE))
  }

  console.log(`Processing ${batches.length} batches (starting from batch ${startBatch})...`)

  // Load progress if exists
  let results = []
  if (startBatch > 0 && fs.existsSync(PROGRESS_FILE)) {
    results = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))
    console.log(`Loaded ${results.length} results from progress file`)
  }

  for (let b = startBatch; b < batches.length; b++) {
    const batch = batches[b]
    const batchInput = batch.map((s, i) => `[${i}] "${s.en}"`).join('\n')

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: `You are an English linguistics expert. For each numbered sentence, extract the KEY EXPRESSION (idiom, phrasal verb, collocation, fixed expression, discourse marker, slang, or hedging phrase).

Rules:
- Return the CANONICAL form (base/infinitive form): "figure out" not "figured it out"
- For idioms, return the full idiom: "cup of tea" not just "cup"
- For phrasal verbs, return verb + particle: "come up with", "figure out"
- For discourse markers: "you know", "I mean", "the thing is"
- For hedging: "kind of", "sort of", "I guess"
- If a sentence has multiple expressions, pick the MOST notable one
- If no clear expression exists despite the tag, return "SKIP"
- Use lowercase, no punctuation

Return ONLY a JSON array of objects: [{"i": 0, "expr": "figure out"}, ...]
No explanation, no markdown fences, just the JSON array.`,
        messages: [{ role: 'user', content: batchInput }],
      })

      const text = response.content[0].text.trim()
      let parsed
      try {
        parsed = JSON.parse(text)
      } catch {
        // Try to extract JSON from response
        const match = text.match(/\[[\s\S]*\]/)
        if (match) {
          parsed = JSON.parse(match[0])
        } else {
          console.error(`Batch ${b}: Failed to parse response, skipping`)
          continue
        }
      }

      for (const item of parsed) {
        if (item.expr === 'SKIP' || !item.expr) continue
        const sentence = batch[item.i]
        if (!sentence) continue
        results.push({
          expr: item.expr.toLowerCase().trim(),
          videoId: sentence.videoId,
          sentenceIdx: sentence.sentenceIdx,
          en: sentence.en,
          ko: sentence.ko,
          cefr: sentence.cefr,
          exprTypes: sentence.exprTypes,
          power: sentence.power,
        })
      }

      // Save progress every 5 batches
      if ((b + 1) % 5 === 0) {
        fs.writeFileSync(PROGRESS_FILE, JSON.stringify(results))
        console.log(`  Batch ${b + 1}/${batches.length} done (${results.length} results so far)`)
      }
    } catch (err) {
      console.error(`Batch ${b} error: ${err.message}`)
      // Save progress and report where to resume
      fs.writeFileSync(PROGRESS_FILE, JSON.stringify(results))
      console.log(`Progress saved. Resume from batch ${b} with: node scripts/build-expression-dictionary.mjs --resume ${b}`)
      throw err
    }

    // Small delay to avoid rate limits
    if (b < batches.length - 1) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  // Final save
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(results))
  console.log(`Total extracted: ${results.length} expression occurrences`)
  return results
}

// Step 3: Group into dictionary
function buildDictionary(results) {
  const groups = new Map()

  for (const r of results) {
    const key = r.expr
    if (!groups.has(key)) {
      groups.set(key, {
        id: key.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        canonical: key,
        category: mapCategory(r.exprTypes),
        cefr: r.cefr,
        cefrCounts: {},
        occurrences: [],
      })
    }

    const group = groups.get(key)
    group.occurrences.push({
      videoId: r.videoId,
      sentenceIdx: r.sentenceIdx,
      en: r.en,
      ko: r.ko,
    })

    // Track CEFR distribution
    group.cefrCounts[r.cefr] = (group.cefrCounts[r.cefr] || 0) + 1
  }

  // Finalize entries
  const entries = [...groups.values()]
    .map(g => {
      // Determine CEFR by majority vote
      const cefrEntries = Object.entries(g.cefrCounts)
      cefrEntries.sort((a, b) => b[1] - a[1])
      g.cefr = cefrEntries[0][0]

      // Pick best example (prefer one with power tag or shortest clear sentence)
      delete g.cefrCounts

      return g
    })
    .sort((a, b) => b.occurrences.length - a.occurrences.length)

  return entries
}

function mapCategory(exprTypes) {
  if (exprTypes.includes('X01')) return 'phrasal_verb'
  if (exprTypes.includes('X02')) return 'idiom'
  if (exprTypes.includes('X03')) return 'collocation'
  if (exprTypes.includes('X04')) return 'fixed_expression'
  if (exprTypes.includes('X05')) return 'slang'
  if (exprTypes.includes('X06')) return 'discourse_marker'
  if (exprTypes.includes('X07')) return 'hedging'
  return 'other'
}

// Main
async function main() {
  const args = process.argv.slice(2)
  const resumeIdx = args.indexOf('--resume')
  const startBatch = resumeIdx !== -1 ? parseInt(args[resumeIdx + 1], 10) : 0

  console.log('=== Expression Dictionary Builder ===\n')

  // Step 1
  const sentences = extractTaggedSentences()

  // Step 2
  const results = await extractCanonicalExpressions(sentences, startBatch)

  // Step 3
  console.log('\nBuilding dictionary...')
  const entries = buildDictionary(results)

  const dictionary = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalExpressions: entries.length,
    totalOccurrences: results.length,
    expressions: entries,
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dictionary, null, 2))
  console.log(`\nDictionary saved to ${OUTPUT_FILE}`)
  console.log(`  Total unique expressions: ${entries.length}`)
  console.log(`  Total occurrences: ${results.length}`)
  console.log(`  Top 20 most common:`)
  entries.slice(0, 20).forEach((e, i) => {
    console.log(`    ${i + 1}. "${e.canonical}" (${e.occurrences.length} videos, ${e.cefr}, ${e.category})`)
  })

  // Cleanup progress file
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE)
  }
}

main().catch(console.error)
