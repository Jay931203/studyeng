import fs from 'fs'
import path from 'path'

const partsDir = 'src/data/word-dict-parts'
const batchFiles = [
  'batch-0a.json', 'batch-0b.json',
  'batch-1a.json', 'batch-1b.json',
  'batch-2a.json', 'batch-2b.json',
  'batch-3a.json', 'batch-3b.json',
  'batch-4.json',
  'batch-5a.json', 'batch-5b.json',
  'batch-6.json', 'batch-7.json',
  'supplement-basic.json', 'supplement-advanced.json',
]

const merged = {}
const issues = []
let totalInput = 0

for (const file of batchFiles) {
  const filePath = path.join(partsDir, file)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  const entries = Object.entries(data)
  totalInput += entries.length
  console.log(`${file}: ${entries.length} entries`)

  for (const [key, entry] of entries) {
    // Normalize: use canonical as the key (some agents used w3a_001 style IDs)
    const canonical = (entry.canonical || key).toLowerCase().trim()

    if (!canonical || canonical.length < 2) {
      issues.push(`SKIP short: "${canonical}" from ${file}`)
      continue
    }

    // Validate required fields
    const required = ['pos', 'meaning_ko', 'cefr', 'theme', 'register', 'learner_value', 'forms', 'example_en', 'example_ko']
    const missing = required.filter(f => !entry[f])
    if (missing.length > 0) {
      issues.push(`MISSING FIELDS [${missing.join(',')}]: "${canonical}" from ${file}`)
      continue
    }

    // Validate CEFR
    if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(entry.cefr)) {
      issues.push(`INVALID CEFR "${entry.cefr}": "${canonical}" from ${file}`)
      continue
    }

    // Validate POS
    const validPOS = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'pronoun', 'interjection', 'determiner']
    if (!validPOS.includes(entry.pos)) {
      issues.push(`INVALID POS "${entry.pos}": "${canonical}" from ${file}`)
      continue
    }

    // Normalize theme to array
    if (typeof entry.theme === 'string') {
      entry.theme = [entry.theme]
    }

    // Deduplicate: keep first occurrence (earlier batches have higher frequency words)
    if (merged[canonical]) {
      // Skip duplicate
      continue
    }

    merged[canonical] = {
      id: canonical,
      canonical: canonical,
      pos: entry.pos,
      meaning_ko: entry.meaning_ko,
      cefr: entry.cefr,
      theme: entry.theme,
      register: entry.register,
      learner_value: entry.learner_value,
      forms: Array.isArray(entry.forms) ? entry.forms : [],
      example_en: entry.example_en,
      example_ko: entry.example_ko,
    }
  }
}

// Stats
const cefrDist = {}
const posDist = {}
const valueDist = {}

for (const entry of Object.values(merged)) {
  cefrDist[entry.cefr] = (cefrDist[entry.cefr] || 0) + 1
  posDist[entry.pos] = (posDist[entry.pos] || 0) + 1
  valueDist[entry.learner_value] = (valueDist[entry.learner_value] || 0) + 1
}

console.log('\n=== MERGE RESULTS ===')
console.log(`Input entries: ${totalInput}`)
console.log(`After dedup + validation: ${Object.keys(merged).length}`)
console.log(`\nCEFR distribution:`)
for (const [k, v] of Object.entries(cefrDist).sort()) console.log(`  ${k}: ${v}`)
console.log(`\nPOS distribution:`)
for (const [k, v] of Object.entries(posDist).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`)
console.log(`\nLearner value:`)
for (const [k, v] of Object.entries(valueDist).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`)

if (issues.length > 0) {
  console.log(`\n=== ISSUES (${issues.length}) ===`)
  issues.slice(0, 30).forEach(i => console.log(`  ${i}`))
  if (issues.length > 30) console.log(`  ... and ${issues.length - 30} more`)
}

// Write final files
// word-entries.json: the full dictionary (like expression-entries-v2.json)
fs.writeFileSync('src/data/word-entries.json', JSON.stringify(merged, null, 2))
console.log(`\nWritten: src/data/word-entries.json (${Object.keys(merged).length} entries)`)

// word-dictionary.json: sorted array for reference
const sortedArray = Object.values(merged).sort((a, b) => {
  const cefrOrder = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 }
  return (cefrOrder[a.cefr] || 0) - (cefrOrder[b.cefr] || 0) || a.canonical.localeCompare(b.canonical)
})
fs.writeFileSync('src/data/word-dictionary.json', JSON.stringify(sortedArray, null, 2))
console.log(`Written: src/data/word-dictionary.json (sorted by CEFR + alphabetical)`)
