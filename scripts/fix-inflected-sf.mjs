import fs from 'fs'

const entries = JSON.parse(fs.readFileSync('src/data/expression-entries-v2.json', 'utf-8'))
let fixCount = 0

for (let i = 0; i < 10; i++) {
  const data = JSON.parse(fs.readFileSync(`src/data/match-results-v3/batch-${i}.json`, 'utf-8'))
  let batchFixes = 0

  for (const d of data) {
    if (!d.surfaceForm) continue
    const canonical = (entries[d.exprId]?.canonical || d.exprId).toLowerCase()
    const sf = d.surfaceForm.toLowerCase()

    // If surfaceForm differs from canonical, check if canonical exists as exact substring
    if (sf !== canonical) {
      // Try to find a better (shorter) match that's closer to canonical
      const idx = d.en.toLowerCase().indexOf(canonical)
      if (idx >= 0) {
        // canonical exists exactly in sentence, use that instead
        d.surfaceForm = d.en.slice(idx, idx + canonical.length)
        batchFixes++
        fixCount++
      }
    }
  }

  if (batchFixes > 0) {
    fs.writeFileSync(`src/data/match-results-v3/batch-${i}.json`, JSON.stringify(data, null, 2))
  }
  if (batchFixes > 0) console.log(`Batch ${i}: ${batchFixes} fixes`)
}

console.log(`Total fixes: ${fixCount}`)
