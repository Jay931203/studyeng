import fs from 'fs'

const entries = JSON.parse(fs.readFileSync('src/data/expression-entries-v2.json', 'utf-8'))

let fixed = 0, removed = 0, deduped = 0

for (let i = 0; i < 10; i++) {
  const data = JSON.parse(fs.readFileSync(`src/data/match-results-v3/batch-${i}.json`, 'utf-8'))

  // Deduplicate
  const seen = new Set()
  const cleaned = []

  for (const d of data) {
    const key = `${d.videoId}|${d.sentenceIdx}|${d.exprId}`
    if (seen.has(key)) { deduped++; continue }
    seen.add(key)

    // Fix TOO LONG surfaceForm: if surfaceForm word count > expr word count * 2,
    // try to extract just the matching part
    if (d.surfaceForm) {
      const exprWords = d.exprId.split(/\s+/).length
      const sfWords = d.surfaceForm.split(/\s+/).length

      if (sfWords > exprWords * 2) {
        // Try simple case-insensitive substring match of canonical
        const idx = d.en.toLowerCase().indexOf(d.exprId.toLowerCase())
        if (idx >= 0) {
          d.surfaceForm = d.en.slice(idx, idx + d.exprId.length)
          fixed++
        } else {
          // Can't fix, set null
          d.surfaceForm = null
          fixed++
        }
      }
    }

    // Remove entries with null surfaceForm
    if (d.surfaceForm == null) {
      removed++
      continue
    }

    // Verify surfaceForm exists in sentence
    if (!d.en.toLowerCase().includes(d.surfaceForm.toLowerCase())) {
      removed++
      continue
    }

    cleaned.push(d)
  }

  fs.writeFileSync(`src/data/match-results-v3/batch-${i}.json`, JSON.stringify(cleaned, null, 2))
  console.log(`Batch ${i}: ${data.length} -> ${cleaned.length}`)
}

console.log(`\nFixed: ${fixed}, Removed: ${removed}, Deduped: ${deduped}`)
