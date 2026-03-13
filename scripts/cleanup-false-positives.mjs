/**
 * cleanup-false-positives.mjs
 *
 * Targeted removal of remaining false positives after semantic validation.
 * These are expressions where GPT-4o-mini didn't fully distinguish the intended meaning.
 */

import fs from 'fs'

const INDEX_PATH = 'src/data/expression-index-v2.json'
const idx = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'))

let removed = 0
let kept = 0
const removedByExpr = {}

function track(exprId) {
  if (!removedByExpr[exprId]) removedByExpr[exprId] = 0
  removedByExpr[exprId]++
  removed++
}

function norm(t) { return (t || '').trim().toLowerCase() }

for (const [vid, rows] of Object.entries(idx)) {
  idx[vid] = rows.filter(r => {
    const en = norm(r.en)

    // "about" as hedging (약, 대략) — only valid when meaning "approximately"
    // "about to [verb]" = going to, "about [topic]" = regarding → reject
    if (r.exprId === 'about') {
      // Keep: "about 5 minutes", "about three hundred"
      // Reject: everything else (about to, about him, about it, about these)
      if (/about \d/.test(en) || /about (a |an |one |two |three|four|five|six|seven|eight|nine|ten|twenty|thirty|hundred|thousand|million)/.test(en)) {
        kept++
        return true
      }
      track('about')
      return false
    }

    // "dead" as slang (웃겨 죽겠다) — only valid for exaggeration/humor
    // "i'm dead", "dead serious" (slang), NOT physical death
    if (r.exprId === 'dead') {
      if (/i'm dead|i am dead|he's dead serious|dead ass|deadass|dead serious/.test(en) && !/actually dead|really dead|is dead|was dead|are dead/.test(en)) {
        kept++
        return true
      }
      track('dead')
      return false
    }

    // "around" as hedging (약, 대략) — only valid when meaning "approximately"
    if (r.exprId === 'around') {
      if (/around \d/.test(en) || /around (a |an |one |two |three|four|five|six|seven|eight|nine|ten|twenty|thirty|hundred|thousand|million)/.test(en)) {
        kept++
        return true
      }
      track('around')
      return false
    }

    // "some" as hedging (좀, 어느 정도) — only valid when meaning "approximately" or softener
    if (r.exprId === 'some') {
      if (/some \d/.test(en) || /some (two|three|four|five|six|seven|eight|nine|ten|twenty|thirty|hundred|thousand|million)/.test(en)) {
        kept++
        return true
      }
      track('some')
      return false
    }

    // "kind of" — keep hedging (kinda), reject "type of"
    if (r.exprId === 'kind of') {
      // Reject: "the kind of", "a kind of", "my kind of", "some kind of", "what kind of", "this kind of", "that kind of"
      if (/(the|a|my|his|her|your|our|their|its|some|any|what|this|that|every|no) kind of/.test(en)) {
        track('kind of')
        return false
      }
      kept++
      return true
    }

    kept++
    return true
  })

  if (idx[vid].length === 0) delete idx[vid]
}

console.log(`Kept: ${kept}`)
console.log(`Removed: ${removed}`)
console.log('Removed by expression:')
for (const [expr, count] of Object.entries(removedByExpr).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${expr}: ${count}`)
}

fs.writeFileSync(INDEX_PATH, JSON.stringify(idx))
const vids = Object.keys(idx)
let total = 0
vids.forEach(v => total += idx[v].length)
console.log(`\nFinal index: ${total} matches, ${vids.length} videos`)
