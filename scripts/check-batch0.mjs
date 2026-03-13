import fs from 'fs'
const data = JSON.parse(fs.readFileSync('src/data/match-results-v3/batch-0.json','utf-8'))
const entries = JSON.parse(fs.readFileSync('src/data/expression-entries-v2.json','utf-8'))

let inflected = 0, exact = 0
for (const r of data) {
  const canonical = (entries[r.exprId]?.canonical || '').toLowerCase()
  if (r.surfaceForm.toLowerCase() === canonical) exact++
  else inflected++
}

console.log(`Total: ${data.length} | Exact: ${exact} | Inflected: ${inflected} | Rate: ${(inflected/data.length*100).toFixed(1)}%`)

console.log('\n--- Inflected samples ---')
const samples = data.filter(r => {
  const c = (entries[r.exprId]?.canonical || '').toLowerCase()
  return r.surfaceForm.toLowerCase() !== c
}).slice(0, 10)

for (const s of samples) {
  const c = entries[s.exprId]?.canonical
  console.log(`  ${c}  ->  ${s.surfaceForm}  |  ${s.en.substring(0, 80)}`)
}
