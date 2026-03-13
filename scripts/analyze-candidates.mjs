import fs from 'fs'
const d = JSON.parse(fs.readFileSync('src/data/expression-candidates.json','utf-8'))
const entries = JSON.parse(fs.readFileSync('src/data/expression-entries-v2.json','utf-8'))

const singleWord = d.filter(c => c.canonical.indexOf(' ') === -1)
const multiWord = d.filter(c => c.canonical.indexOf(' ') !== -1)

console.log('Single-word expressions:', singleWord.length)
console.log('Multi-word expressions:', multiWord.length)

// Top single-word by count
const byCanonical = {}
singleWord.forEach(c => {
  if (!byCanonical[c.canonical]) byCanonical[c.canonical] = 0
  byCanonical[c.canonical]++
})
const sorted = Object.entries(byCanonical).sort((a,b) => b[1]-a[1])
console.log('\nTop 30 single-word expressions:')
sorted.slice(0,30).forEach(([w,n]) => {
  const e = entries[w] || {}
  console.log(`  ${w}: ${n} matches (${e.category}, ${e.meaning_ko})`)
})

// Multi-word top by count
const byMulti = {}
multiWord.forEach(c => {
  if (!byMulti[c.canonical]) byMulti[c.canonical] = 0
  byMulti[c.canonical]++
})
const sortedMulti = Object.entries(byMulti).sort((a,b) => b[1]-a[1])
console.log('\nTop 20 multi-word expressions:')
sortedMulti.slice(0,20).forEach(([w,n]) => {
  const e = entries[w] || {}
  console.log(`  ${w}: ${n} matches (${e.category})`)
})

console.log('\nUnique single-word:', Object.keys(byCanonical).length)
console.log('Unique multi-word:', Object.keys(byMulti).length)
