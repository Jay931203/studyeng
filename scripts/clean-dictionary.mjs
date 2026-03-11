import fs from 'fs'

const dict = JSON.parse(fs.readFileSync('./src/data/expression-dictionary.json', 'utf8'))
console.log(`Before cleanup: ${dict.expressions.length} expressions, ${dict.totalOccurrences} occurrences`)

// Remove garbage: single common words that are NOT real expressions
const GARBAGE_SINGLE_WORDS = new Set([
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their',
  'the', 'a', 'an', 'this', 'that', 'these', 'those',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'not', 'no', 'yes', 'and', 'or', 'but', 'if', 'then', 'so', 'than',
  'to', 'of', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'up', 'out',
  'about', 'into', 'through', 'after', 'before', 'above', 'below',
  'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
  'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
  'just', 'also', 'very', 'too', 'quite', 'rather', 'really', 'still', 'already',
  'here', 'there', 'then', 'now', 'today', 'tomorrow', 'yesterday',
  'again', 'ever', 'never', 'always', 'often', 'sometimes',
  'new', 'old', 'good', 'bad', 'big', 'small', 'long', 'short',
  'first', 'last', 'next', 'only', 'own', 'same', 'different',
  'go', 'get', 'make', 'take', 'come', 'give', 'say', 'tell', 'know', 'think',
  'see', 'look', 'find', 'want', 'need', 'try', 'ask', 'work', 'call',
  'let', 'put', 'keep', 'turn', 'start', 'show', 'hear', 'play', 'run', 'move',
  'like', 'love', 'live', 'feel', 'leave', 'mean', 'end', 'help', 'talk', 'read',
  'hand', 'high', 'far', 'point', 'set', 'end', 'back', 'home',
  'man', 'people', 'time', 'way', 'day', 'thing', 'world', 'life',
  'boy', 'girl', 'sir', 'baby', 'miss',
  'one', 'two', 'three',
  'damn', 'ass', 'hell', 'shit', 'crap', 'god',
  'please', 'thanks', 'sure', 'fine', 'great', 'nice', 'right',
  'yeah', 'yep', 'nope', 'hm', 'hmm',
])

// Remove not-real-expressions: too basic contractions and verb forms
const GARBAGE_MULTI = new Set([
  "i'm", "it's", "don't", "that's", "we're", "they're", "i've", "you're",
  "he's", "she's", "we've", "can't", "won't", "didn't", "isn't", "aren't",
  "wasn't", "weren't", "hasn't", "haven't", "hadn't", "couldn't", "wouldn't",
  "shouldn't", "mustn't", "let's", "here's", "there's", "what's", "who's",
  "i'll", "you'll", "he'll", "she'll", "we'll", "they'll",
  "i'd", "you'd", "he'd", "she'd", "we'd", "they'd",
  "going to", "got to", "want to", "need to", "have to", "used to",
  "trying to", "about to", "supposed to",
  "i'm going to", "i'm gonna",
  "come to", "go to", "get to",
  "look at", "talk to", "talk about", "talking about", "think about",
  "looking at", "thinking about", "looking for",
  "get in", "get on", "get it",
  "not going to", "going to be over",
  // Basic 2-word phrases that aren't teachable expressions
  "a little", "a lot", "a bit",
  "too much", "so much", "very much",
])

const cleaned = dict.expressions.filter(e => {
  const canonical = e.canonical.toLowerCase().trim()

  // Remove single-word garbage
  if (canonical.split(' ').length === 1 && GARBAGE_SINGLE_WORDS.has(canonical)) {
    return false
  }

  // Remove multi-word garbage
  if (GARBAGE_MULTI.has(canonical)) {
    return false
  }

  // Remove expressions that are just single common words misclassified
  if (canonical.split(' ').length === 1 && e.category === 'fixed_expression') {
    // Only keep single-word fixed expressions if they're slang/exclamation-worthy
    return false
  }

  return true
})

// Recount
const totalOcc = cleaned.reduce((sum, e) => sum + e.occurrenceCount, 0)

// Reassign learner_value based on cleaned data
for (const e of cleaned) {
  if (e.category === 'filler') {
    e.learner_value = 'enrichment'
  } else if (e.category === 'exclamation') {
    e.learner_value = e.videoCount >= 10 ? 'useful' : 'enrichment'
  } else if (e.category === 'discourse_marker' || e.category === 'hedging') {
    e.learner_value = e.videoCount >= 30 ? 'essential' : e.videoCount >= 10 ? 'useful' : 'enrichment'
  } else if (e.category === 'slang') {
    if (['gonna', 'wanna', 'gotta', "ain't"].includes(e.canonical)) {
      e.learner_value = 'essential'
    } else {
      e.learner_value = e.videoCount >= 10 ? 'useful' : 'enrichment'
    }
  } else {
    // phrasal_verb, idiom, collocation, fixed_expression
    if (e.videoCount >= 15) e.learner_value = 'essential'
    else if (e.videoCount >= 5) e.learner_value = 'useful'
    else e.learner_value = 'enrichment'
  }
}

const result = {
  version: '2.0.0',
  generatedAt: new Date().toISOString(),
  totalExpressions: cleaned.length,
  totalOccurrences: totalOcc,
  expressions: cleaned,
}

fs.writeFileSync('./src/data/expression-dictionary.json', JSON.stringify(result, null, 2))

console.log(`\nAfter cleanup: ${cleaned.length} expressions, ${totalOcc} occurrences`)
console.log(`Removed: ${dict.expressions.length - cleaned.length} garbage entries`)

// Stats
const cats = {}
for (const e of cleaned) cats[e.category] = (cats[e.category] || 0) + 1
console.log(`\nBy category:`)
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`))

const values = {}
for (const e of cleaned) values[e.learner_value] = (values[e.learner_value] || 0) + 1
console.log(`\nBy learner value:`)
Object.entries(values).sort((a, b) => b[1] - a[1]).forEach(([v, n]) => console.log(`  ${v}: ${n}`))

// Top per category
for (const cat of ['phrasal_verb', 'idiom', 'collocation', 'fixed_expression', 'slang', 'discourse_marker', 'hedging', 'exclamation']) {
  const items = cleaned.filter(e => e.category === cat)
  if (items.length === 0) continue
  console.log(`\nTop 10 ${cat} (${items.length} total):`)
  items.slice(0, 10).forEach((e, i) =>
    console.log(`  ${i + 1}. "${e.canonical}" — ${e.videoCount} videos, ${e.cefr}, ${e.learner_value}`)
  )
}

// Essential expressions
const essentials = cleaned.filter(e => e.learner_value === 'essential')
console.log(`\n=== ESSENTIAL expressions (${essentials.length}): ===`)
essentials.forEach((e, i) =>
  console.log(`  ${i + 1}. "${e.canonical}" — ${e.videoCount} videos, ${e.category}, ${e.cefr}`)
)
