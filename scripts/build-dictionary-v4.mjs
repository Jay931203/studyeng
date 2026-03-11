import fs from 'fs'

// Load current dictionary (v3.0 with meaning_ko filled by agent)
const dict = JSON.parse(fs.readFileSync('./src/data/expression-dictionary.json', 'utf8'))
console.log(`Current dictionary: ${dict.expressions.length} expressions`)

// Load theme assignments
const themes = JSON.parse(fs.readFileSync('./scripts/theme-assignments.json', 'utf8'))
console.log(`Theme assignments: ${Object.keys(themes).length} entries`)

// Load additional idioms
const additionalIdioms = JSON.parse(fs.readFileSync('./scripts/additional-idioms.json', 'utf8'))
console.log(`Additional idioms: ${additionalIdioms.length} entries`)

// Step 1: Apply theme assignments to existing entries
let themeUpdated = 0
for (const entry of dict.expressions) {
  const canonical = entry.canonical.toLowerCase().trim()
  if (themes[canonical]) {
    entry.theme = themes[canonical]
    themeUpdated++
  } else if (themes[entry.canonical]) {
    entry.theme = themes[entry.canonical]
    themeUpdated++
  }
}
console.log(`Themes updated: ${themeUpdated}`)

// Step 2: Add additional idioms
const existingSet = new Set(dict.expressions.map(e => e.canonical.toLowerCase().trim()))
let added = 0
for (const idiom of additionalIdioms) {
  const canonical = idiom.canonical.toLowerCase().trim()
  if (existingSet.has(canonical)) continue

  dict.expressions.push({
    id: canonical.replace(/\s+/g, '_').replace(/[^a-z0-9_']/g, ''),
    canonical,
    meaning_ko: idiom.meaning_ko || '',
    category: 'idiom',
    cefr: idiom.cefr || 'B2',
    theme: idiom.theme ? (Array.isArray(idiom.theme) ? idiom.theme : [idiom.theme]) : ['general'],
    register: idiom.register || 'neutral',
    learner_value: 'useful',
    videoCount: 0,
    occurrenceCount: 0,
    occurrences: [],
  })
  added++
  existingSet.add(canonical)
}
console.log(`New idioms added: ${added}`)

// Step 3: Sort by videoCount descending, then alphabetically
dict.expressions.sort((a, b) => {
  if (b.videoCount !== a.videoCount) return b.videoCount - a.videoCount
  return a.canonical.localeCompare(b.canonical)
})

// Step 4: Update version and totals
dict.version = '4.0.0'
dict.generatedAt = new Date().toISOString()
dict.totalExpressions = dict.expressions.length
dict.totalOccurrences = dict.expressions.reduce((sum, e) => sum + e.occurrenceCount, 0)

fs.writeFileSync('./src/data/expression-dictionary.json', JSON.stringify(dict, null, 2))

// Stats
console.log(`\n=== Dictionary v4.0 ===`)
console.log(`Total expressions: ${dict.totalExpressions}`)
console.log(`Total occurrences: ${dict.totalOccurrences}`)

const cats = {}
for (const e of dict.expressions) cats[e.category] = (cats[e.category] || 0) + 1
console.log(`\nBy category:`)
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`))

const cefrs = {}
for (const e of dict.expressions) cefrs[e.cefr] = (cefrs[e.cefr] || 0) + 1
console.log(`\nBy CEFR:`)
Object.entries(cefrs).sort().forEach(([c, n]) => console.log(`  ${c}: ${n}`))

const values = {}
for (const e of dict.expressions) values[e.learner_value] = (values[e.learner_value] || 0) + 1
console.log(`\nBy learner value:`)
Object.entries(values).sort((a, b) => b[1] - a[1]).forEach(([v, n]) => console.log(`  ${v}: ${n}`))

// Theme distribution
const themeCount = {}
for (const e of dict.expressions) {
  for (const t of e.theme || []) themeCount[t] = (themeCount[t] || 0) + 1
}
console.log(`\nBy theme:`)
Object.entries(themeCount).sort((a, b) => b[1] - a[1]).forEach(([t, n]) => console.log(`  ${t}: ${n}`))

// meaning_ko coverage
const withKo = dict.expressions.filter(e => e.meaning_ko && e.meaning_ko.length > 0).length
console.log(`\nmeaning_ko filled: ${withKo}/${dict.totalExpressions} (${(withKo/dict.totalExpressions*100).toFixed(1)}%)`)

// Sample entries per category
for (const cat of ['idiom', 'collocation', 'phrasal_verb', 'fixed_expression']) {
  console.log(`\nSample ${cat}:`)
  dict.expressions.filter(e => e.category === cat).slice(0, 5).forEach(e =>
    console.log(`  "${e.canonical}" (${e.cefr}) — ${e.meaning_ko} — ${e.videoCount} videos — themes: ${e.theme.join(', ')}`)
  )
}

// Idioms with 0 occurrences (from additional)
const zeroIdioms = dict.expressions.filter(e => e.category === 'idiom' && e.videoCount === 0)
console.log(`\nIdioms with 0 video matches (reference only): ${zeroIdioms.length}`)
zeroIdioms.slice(0, 10).forEach(e =>
  console.log(`  "${e.canonical}" (${e.cefr}) — ${e.meaning_ko}`)
)
