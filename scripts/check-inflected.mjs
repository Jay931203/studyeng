import fs from 'fs'

const entries = JSON.parse(fs.readFileSync('src/data/expression-entries-v2.json','utf-8'))

let total = 0, inflected = 0
const samples = []

for (let i = 0; i < 10; i++) {
  const data = JSON.parse(fs.readFileSync(`src/data/match-results-v3/batch-${i}.json`,'utf-8'))
  for (const d of data) {
    total++
    const canonical = (entries[d.exprId]?.canonical || d.exprId).toLowerCase()
    const sf = (d.surfaceForm || '').toLowerCase()
    if (sf && sf !== canonical) {
      inflected++
      if (samples.length < 20) {
        samples.push({ canonical: d.exprId, surface: d.surfaceForm, en: d.en.substring(0, 70) })
      }
    }
  }
}

console.log(`Total: ${total}, Inflected: ${inflected} (${(inflected/total*100).toFixed(1)}%)`)
console.log('\nInflected samples:')
for (const s of samples) {
  console.log(`  ${s.canonical} -> ${s.surface} | ${s.en}`)
}
