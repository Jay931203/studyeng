import fs from 'fs'

const idx = JSON.parse(fs.readFileSync('src/data/expression-index-v2.json', 'utf-8'))
const entries = JSON.parse(fs.readFileSync('src/data/expression-entries-v2.json', 'utf-8'))

function norm(t) { return (t || '').trim().toLowerCase().replace(/\s+/g, ' ') }

function hasWord(text, word) {
  const n = norm(text)
  const escaped = norm(word).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp('\\b' + escaped + '\\b').test(n)
}

let falsePositives = 0, total = 0
const badByExpr = {}

for (const [vid, rows] of Object.entries(idx)) {
  for (const r of rows) {
    total++
    const entry = entries[r.exprId]
    const canonical = entry ? entry.canonical : r.exprId
    if (!hasWord(r.en, canonical)) {
      falsePositives++
      if (!badByExpr[canonical]) badByExpr[canonical] = 0
      badByExpr[canonical]++
    }
  }
}

console.log(`Total rows: ${total}`)
console.log(`False positives: ${falsePositives} (${(falsePositives/total*100).toFixed(1)}%)`)
console.log(`\nTop false positive expressions:`)
const sorted = Object.entries(badByExpr).sort((a, b) => b[1] - a[1])
sorted.slice(0, 30).forEach(([expr, count]) => {
  console.log(`  "${expr}": ${count} false matches`)
})
