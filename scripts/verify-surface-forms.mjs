import fs from 'fs'

const entries = JSON.parse(fs.readFileSync('src/data/expression-entries-v2.json', 'utf-8'))

let total = 0, nullCount = 0, exact = 0, inflected = 0
const issues = []
const inflectedSamples = []
const allResults = []

for (let i = 0; i < 10; i++) {
  const data = JSON.parse(fs.readFileSync(`src/data/match-results-v3/batch-${i}.json`, 'utf-8'))
  allResults.push(...data)
}

for (const d of allResults) {
  total++

  // 1. null check
  if (d.surfaceForm == null) {
    nullCount++
    issues.push(`NULL: exprId="${d.exprId}" en="${d.en.substring(0, 60)}"`)
    continue
  }

  // 2. surfaceForm이 실제 문장에 존재하는지 확인
  if (!d.en.includes(d.surfaceForm)) {
    // case-insensitive check
    if (!d.en.toLowerCase().includes(d.surfaceForm.toLowerCase())) {
      issues.push(`NOT IN SENTENCE: sf="${d.surfaceForm}" en="${d.en.substring(0, 60)}"`)
    }
  }

  // 3. exact vs inflected
  const canonical = (entries[d.exprId]?.canonical || d.exprId).toLowerCase()
  if (d.surfaceForm.toLowerCase() === canonical) {
    exact++
  } else {
    inflected++
    if (inflectedSamples.length < 30) {
      inflectedSamples.push({
        canonical: d.exprId,
        surface: d.surfaceForm,
        en: d.en.substring(0, 80)
      })
    }
  }

  // 4. surfaceForm이 너무 길지 않은지 (표현보다 2배 이상 길면 의심)
  const exprWordCount = d.exprId.split(/\s+/).length
  const sfWordCount = d.surfaceForm.split(/\s+/).length
  if (sfWordCount > exprWordCount * 3) {
    issues.push(`TOO LONG: expr="${d.exprId}"(${exprWordCount}w) sf="${d.surfaceForm}"(${sfWordCount}w)`)
  }

  // 5. 필수 필드 존재 확인
  if (!d.videoId || d.sentenceIdx == null || !d.en || !d.exprId) {
    issues.push(`MISSING FIELD: ${JSON.stringify(d).substring(0, 100)}`)
  }
}

console.log('=== SurfaceForm 품질 검증 ===')
console.log(`Total: ${total}`)
console.log(`Null: ${nullCount}`)
console.log(`Exact match: ${exact}`)
console.log(`Inflected: ${inflected} (${(inflected/total*100).toFixed(1)}%)`)
console.log(`Issues found: ${issues.length}`)

if (issues.length > 0) {
  console.log('\n--- Issues (max 20) ---')
  issues.slice(0, 20).forEach(i => console.log('  ' + i))
}

console.log('\n--- Inflected samples (max 30) ---')
inflectedSamples.forEach(s => {
  console.log(`  "${s.canonical}" -> "${s.surface}" | ${s.en}`)
})

// Check for duplicates
const dupeKey = new Set()
let dupes = 0
for (const d of allResults) {
  const key = `${d.videoId}|${d.sentenceIdx}|${d.exprId}`
  if (dupeKey.has(key)) dupes++
  dupeKey.add(key)
}
console.log(`\nDuplicates: ${dupes}`)

// Check v3 index file
const v3 = JSON.parse(fs.readFileSync('src/data/expression-index-v3.json', 'utf-8'))
const v3Total = Object.values(v3).reduce((sum, arr) => sum + arr.length, 0)
console.log(`\nexpression-index-v3.json: ${Object.keys(v3).length} videos, ${v3Total} matches`)
console.log(`Batch total: ${total} vs v3 total: ${v3Total}`)
