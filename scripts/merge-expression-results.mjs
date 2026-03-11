import fs from 'fs'

// Load chunks and results
const chunks = [0, 1, 2, 3].map(i =>
  JSON.parse(fs.readFileSync(`./scripts/expr-chunk-${i}.json`, 'utf8'))
)
const results = [0, 1, 2, 3].map(i =>
  JSON.parse(fs.readFileSync(`./scripts/expr-result-${i}.json`, 'utf8'))
)

// Merge results with original sentence data
const allEntries = []
for (let c = 0; c < 4; c++) {
  const chunk = chunks[c]
  const result = results[c]
  for (const r of result) {
    const sentence = chunk[r.i]
    if (!sentence) continue
    const expr = (r.expr || '').toLowerCase().trim()
    if (!expr || expr === 'skip') continue
    allEntries.push({
      expr,
      videoId: sentence.videoId,
      sentenceIdx: sentence.idx,
      en: sentence.en,
      ko: sentence.ko,
      cefr: sentence.cefr,
      types: sentence.types,
      power: sentence.power,
    })
  }
}

console.log(`Total expression occurrences: ${allEntries.length}`)

// Group by canonical expression
const groups = new Map()
for (const e of allEntries) {
  if (!groups.has(e.expr)) {
    groups.set(e.expr, {
      id: e.expr.replace(/\s+/g, '_').replace(/[^a-z0-9_']/g, ''),
      canonical: e.expr,
      category: mapCategory(e.types),
      cefrVotes: {},
      occurrences: [],
      videoIds: new Set(),
    })
  }
  const g = groups.get(e.expr)
  g.occurrences.push({
    videoId: e.videoId,
    sentenceIdx: e.sentenceIdx,
    en: e.en,
    ko: e.ko,
  })
  g.videoIds.add(e.videoId)
  g.cefrVotes[e.cefr] = (g.cefrVotes[e.cefr] || 0) + 1
  // Upgrade category if this occurrence has a better type
  const newCat = mapCategory(e.types)
  if (categoryPriority(newCat) < categoryPriority(g.category)) {
    g.category = newCat
  }
}

function mapCategory(types) {
  if (types.includes('X02')) return 'idiom'
  if (types.includes('X01')) return 'phrasal_verb'
  if (types.includes('X03')) return 'collocation'
  if (types.includes('X04')) return 'fixed_expression'
  if (types.includes('X05')) return 'slang'
  if (types.includes('X07')) return 'hedging'
  if (types.includes('X06')) return 'discourse_marker'
  return 'other'
}

function categoryPriority(cat) {
  const order = ['idiom', 'phrasal_verb', 'collocation', 'fixed_expression', 'slang', 'hedging', 'discourse_marker', 'other']
  return order.indexOf(cat)
}

// Finalize
const entries = [...groups.values()]
  .map(g => {
    // CEFR by majority vote
    const cefrEntries = Object.entries(g.cefrVotes)
    cefrEntries.sort((a, b) => b[1] - a[1])
    const cefr = cefrEntries[0][0]

    return {
      id: g.id,
      canonical: g.canonical,
      category: g.category,
      cefr,
      videoCount: g.videoIds.size,
      occurrenceCount: g.occurrences.length,
      occurrences: g.occurrences,
    }
  })
  .sort((a, b) => b.videoCount - a.videoCount)

const dictionary = {
  version: '1.0.0',
  generatedAt: new Date().toISOString(),
  totalExpressions: entries.length,
  totalOccurrences: allEntries.length,
  expressions: entries,
}

fs.writeFileSync('./src/data/expression-dictionary.json', JSON.stringify(dictionary, null, 2))

// Stats
console.log(`\nDictionary saved to src/data/expression-dictionary.json`)
console.log(`  Unique expressions: ${entries.length}`)
console.log(`  Total occurrences: ${allEntries.length}`)

// Category breakdown
const cats = {}
for (const e of entries) cats[e.category] = (cats[e.category] || 0) + 1
console.log(`\nBy category:`)
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`))

// CEFR breakdown
const cefrs = {}
for (const e of entries) cefrs[e.cefr] = (cefrs[e.cefr] || 0) + 1
console.log(`\nBy CEFR:`)
Object.entries(cefrs).sort().forEach(([c, n]) => console.log(`  ${c}: ${n}`))

// Top expressions by video count
console.log(`\nTop 30 by video count:`)
entries.slice(0, 30).forEach((e, i) =>
  console.log(`  ${i + 1}. "${e.canonical}" — ${e.videoCount} videos, ${e.occurrenceCount} times (${e.cefr}, ${e.category})`)
)

// Top phrasal verbs
console.log(`\nTop 20 phrasal verbs:`)
entries.filter(e => e.category === 'phrasal_verb').slice(0, 20).forEach((e, i) =>
  console.log(`  ${i + 1}. "${e.canonical}" — ${e.videoCount} videos`)
)

// Top idioms
console.log(`\nTop 20 idioms:`)
entries.filter(e => e.category === 'idiom').slice(0, 20).forEach((e, i) =>
  console.log(`  ${i + 1}. "${e.canonical}" — ${e.videoCount} videos`)
)

// Top collocations + fixed expressions
console.log(`\nTop 20 collocations + fixed:`)
entries.filter(e => e.category === 'collocation' || e.category === 'fixed_expression').slice(0, 20).forEach((e, i) =>
  console.log(`  ${i + 1}. "${e.canonical}" — ${e.videoCount} videos (${e.category})`)
)
