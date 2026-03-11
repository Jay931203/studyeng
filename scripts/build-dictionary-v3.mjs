import fs from 'fs'

// Load current dictionary
const dict = JSON.parse(fs.readFileSync('./src/data/expression-dictionary.json', 'utf8'))
console.log(`Current: ${dict.expressions.length} expressions`)

// Load cleanup results
const cleanup = JSON.parse(fs.readFileSync('./scripts/fixed-expr-cleanup.json', 'utf8'))
const deleteSet = new Set(cleanup.delete.map(e => e.toLowerCase().trim()))
const reclassifyMap = new Map()
for (const item of cleanup.reclassify) {
  reclassifyMap.set(item.expr.toLowerCase().trim(), item.newCategory)
}

// Load new idiom and collocation matches
const idiomMatches = JSON.parse(fs.readFileSync('./scripts/idiom-matches.json', 'utf8'))
const collocationMatches = JSON.parse(fs.readFileSync('./scripts/collocation-matches.json', 'utf8'))

console.log(`Cleanup: ${deleteSet.size} delete, ${reclassifyMap.size} reclassify`)
console.log(`New idiom matches: ${idiomMatches.length}`)
console.log(`New collocation matches: ${collocationMatches.length}`)

// Step 1: Apply cleanup to existing entries
const exprMap = new Map()

for (const entry of dict.expressions) {
  const canonical = entry.canonical.toLowerCase().trim()

  // Delete garbage
  if (deleteSet.has(canonical)) continue

  // Reclassify
  if (reclassifyMap.has(canonical)) {
    entry.category = reclassifyMap.get(canonical)
  }

  exprMap.set(canonical, entry)
}

console.log(`After cleanup: ${exprMap.size} expressions`)

// Step 2: Add new idiom matches
let newIdioms = 0
for (const match of idiomMatches) {
  const canonical = match.expr.toLowerCase().trim()
  if (!exprMap.has(canonical)) {
    // New entry
    exprMap.set(canonical, {
      id: canonical.replace(/\s+/g, '_').replace(/[^a-z0-9_']/g, ''),
      canonical,
      meaning_ko: '',
      category: 'idiom',
      cefr: 'B2',
      theme: ['general'],
      register: 'neutral',
      learner_value: 'useful',
      videoCount: 0,
      occurrenceCount: 0,
      occurrences: [],
    })
    newIdioms++
  }
  const entry = exprMap.get(canonical)
  // Ensure category is idiom
  if (entry.category !== 'idiom') entry.category = 'idiom'

  // Add occurrence if not duplicate
  const exists = entry.occurrences.some(
    o => o.videoId === match.videoId && o.sentenceIdx === match.idx
  )
  if (!exists) {
    entry.occurrences.push({
      videoId: match.videoId,
      sentenceIdx: match.idx,
      en: match.en,
      ko: match.ko,
    })
  }
}
console.log(`New idiom entries added: ${newIdioms}`)

// Step 3: Add new collocation matches
let newCollocations = 0
for (const match of collocationMatches) {
  const canonical = match.expr.toLowerCase().trim()
  if (!exprMap.has(canonical)) {
    exprMap.set(canonical, {
      id: canonical.replace(/\s+/g, '_').replace(/[^a-z0-9_']/g, ''),
      canonical,
      meaning_ko: '',
      category: 'collocation',
      cefr: 'B1',
      theme: ['general'],
      register: 'neutral',
      learner_value: 'useful',
      videoCount: 0,
      occurrenceCount: 0,
      occurrences: [],
    })
    newCollocations++
  }
  const entry = exprMap.get(canonical)
  if (entry.category !== 'collocation' && entry.category !== 'idiom') {
    entry.category = 'collocation'
  }

  const exists = entry.occurrences.some(
    o => o.videoId === match.videoId && o.sentenceIdx === match.idx
  )
  if (!exists) {
    entry.occurrences.push({
      videoId: match.videoId,
      sentenceIdx: match.idx,
      en: match.en,
      ko: match.ko,
    })
  }
}
console.log(`New collocation entries added: ${newCollocations}`)

// Step 4: Recalculate all counts and learner values
const CEFR_MAP = {
  'cup of tea': 'B2', 'break the ice': 'B2', 'piece of cake': 'B2',
  'no big deal': 'B1', 'big deal': 'B1', 'get the hang of': 'B2',
  'give it a shot': 'B1', 'give it a try': 'B1', 'hang in there': 'B1',
  'in a nutshell': 'B2', 'long story short': 'B2', 'no wonder': 'B1',
  'out of the blue': 'B2', 'time flies': 'B1', 'worth it': 'B1',
  'for real': 'A2', 'for sure': 'A2', 'for good': 'B1',
  'make sense': 'B1', 'never mind': 'A2', 'on purpose': 'B1',
  'how dare you': 'B1', 'believe it or not': 'B2',
  'at the end of the day': 'B2', 'by all means': 'B2',
  'from scratch': 'B2', 'behind the scenes': 'B2',
  'make a decision': 'B1', 'make a difference': 'B1', 'make sure': 'A2',
  'take a look': 'A2', 'take a break': 'A2', 'take care of': 'B1',
  'pay attention': 'B1', 'have no idea': 'A2', 'have a good time': 'A2',
  'catch up': 'B1', 'tell the truth': 'A2', 'waste time': 'B1',
  'make money': 'A2', 'run out of': 'B1', 'keep in mind': 'B1',
  'figure out': 'B1', 'give up': 'B1', 'come on': 'A2',
  'beat around the bush': 'C1', 'read between the lines': 'C1',
  'go the extra mile': 'C1', 'take for granted': 'B2',
  'the elephant in the room': 'C1', 'play it by ear': 'B2',
  'sleep on it': 'B2', 'once and for all': 'B2',
}

for (const [, entry] of exprMap) {
  // Recalculate videoCount
  const videoIds = new Set(entry.occurrences.map(o => o.videoId))
  entry.videoCount = videoIds.size
  entry.occurrenceCount = entry.occurrences.length

  // Apply known CEFR
  if (CEFR_MAP[entry.canonical]) {
    entry.cefr = CEFR_MAP[entry.canonical]
  }

  // Recalculate learner_value
  if (entry.category === 'filler') {
    entry.learner_value = 'enrichment'
  } else if (entry.category === 'exclamation') {
    entry.learner_value = entry.videoCount >= 10 ? 'useful' : 'enrichment'
  } else if (entry.category === 'discourse_marker' || entry.category === 'hedging') {
    entry.learner_value = entry.videoCount >= 30 ? 'essential' : entry.videoCount >= 10 ? 'useful' : 'enrichment'
  } else if (entry.category === 'slang') {
    if (['gonna', 'wanna', 'gotta', "ain't"].includes(entry.canonical)) {
      entry.learner_value = 'essential'
    } else {
      entry.learner_value = entry.videoCount >= 10 ? 'useful' : 'enrichment'
    }
  } else {
    // phrasal_verb, idiom, collocation, fixed_expression
    if (entry.videoCount >= 15) entry.learner_value = 'essential'
    else if (entry.videoCount >= 5) entry.learner_value = 'useful'
    else entry.learner_value = 'enrichment'
  }
}

// Step 5: Sort and output
const entries = [...exprMap.values()].sort((a, b) => b.videoCount - a.videoCount)

const result = {
  version: '3.0.0',
  generatedAt: new Date().toISOString(),
  totalExpressions: entries.length,
  totalOccurrences: entries.reduce((sum, e) => sum + e.occurrenceCount, 0),
  expressions: entries,
}

fs.writeFileSync('./src/data/expression-dictionary.json', JSON.stringify(result, null, 2))

// Stats
console.log(`\n=== Dictionary v3.0 ===`)
console.log(`Total expressions: ${result.totalExpressions}`)
console.log(`Total occurrences: ${result.totalOccurrences}`)

const cats = {}
for (const e of entries) cats[e.category] = (cats[e.category] || 0) + 1
console.log(`\nBy category:`)
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`))

const values = {}
for (const e of entries) values[e.learner_value] = (values[e.learner_value] || 0) + 1
console.log(`\nBy learner value:`)
Object.entries(values).sort((a, b) => b[1] - a[1]).forEach(([v, n]) => console.log(`  ${v}: ${n}`))

const cefrs = {}
for (const e of entries) cefrs[e.cefr] = (cefrs[e.cefr] || 0) + 1
console.log(`\nBy CEFR:`)
Object.entries(cefrs).sort().forEach(([c, n]) => console.log(`  ${c}: ${n}`))

// Per category top entries
for (const cat of ['idiom', 'collocation', 'phrasal_verb', 'fixed_expression', 'slang', 'discourse_marker', 'hedging', 'exclamation']) {
  const items = entries.filter(e => e.category === cat)
  if (items.length === 0) continue
  console.log(`\nTop 15 ${cat} (${items.length} total):`)
  items.slice(0, 15).forEach((e, i) =>
    console.log(`  ${i + 1}. "${e.canonical}" — ${e.videoCount} videos, ${e.cefr}, ${e.learner_value}`)
  )
}
