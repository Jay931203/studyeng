import fs from 'fs'
import path from 'path'

// ============================================================
// Phase 1: Recategorize existing dictionary with proper rules
// ============================================================

const FILLERS = new Set(['um', 'uh', 'uh-huh', 'hmm', 'huh', 'mm', 'mhm', 'ah'])
const EXCLAMATIONS = new Set(['oh', 'oh my god', 'oh my gosh', 'wow', 'hey', 'whoa', 'damn', 'holy cow', 'holy shit', 'no way', 'yay', 'ooh', 'geez', 'gee', 'jeez', 'good grief', 'good lord', 'my god', 'oh boy', 'oh man', 'oh no', 'oh dear', 'oh god', 'oh wow', 'oh gee', 'oh shoot', 'oh snap', 'oh crap'])
const SLANG = new Set(['gonna', 'wanna', 'gotta', "ain't", 'dude', 'bro', 'nah', "y'all", 'yo', 'chill', 'cool', 'sick', 'lit', 'fire', 'dope', 'legit', 'lowkey', 'highkey', 'no cap', 'bet', 'slay', 'vibe', 'flex', 'ghost', 'shade', 'tea', 'fam', 'sus', 'bussin', 'salty', 'clap back', 'stan', 'simp', "i'mma", 'bruh', 'dawg', 'homie', 'aight', 'bout to', 'finna', "oughta"])
const DISCOURSE_MARKERS = new Set(['you know', 'i mean', 'the thing is', 'anyway', 'so', 'well', 'now', 'see', 'look', 'listen', 'right', 'okay', 'you know what', "i'm saying", 'you see', 'thing is', 'here is the thing', 'point is', 'basically', 'honestly', 'literally', 'seriously', 'obviously', 'clearly', 'apparently', 'supposedly', 'frankly', 'essentially', 'technically'])
const HEDGING = new Set(['kind of', 'sort of', 'maybe', 'perhaps', 'probably', 'possibly', 'might', 'could be', 'i think', 'i guess', 'i suppose', 'i believe', 'it seems', 'a little', 'a bit', 'somewhat', 'more or less', 'in a way', 'not really', 'not exactly', 'pretty much'])

// Known phrasal verbs (canonical forms)
const PHRASAL_VERBS = new Set([
  'figure out', 'find out', 'come up with', 'look into', 'look up', 'look out',
  'look after', 'look forward to', 'turn out', 'turn up', 'turn down', 'turn off',
  'turn on', 'give up', 'give in', 'give back', 'give away', 'come on', 'come back',
  'come up', 'come down', 'come along', 'come across', 'come over', 'go on', 'go out',
  'go ahead', 'go through', 'go over', 'go back', 'go off', 'go away', 'go along',
  'get out', 'get up', 'get over', 'get through', 'get along', 'get away', 'get back',
  'get off', 'get into', 'get rid of', 'get used to', 'get around to',
  'take off', 'take on', 'take out', 'take over', 'take up', 'take back', 'take care of',
  'take down', 'take apart', 'put on', 'put off', 'put up with', 'put down', 'put away',
  'put together', 'put out', 'set up', 'set off', 'set out', 'set apart',
  'break down', 'break up', 'break in', 'break out', 'break through', 'break off',
  'bring up', 'bring back', 'bring out', 'bring down', 'bring in', 'bring about',
  'make up', 'make out', 'make up for', 'make it', 'make sure',
  'pick up', 'pick out', 'pick on', 'drop off', 'drop out', 'drop by',
  'hold on', 'hold up', 'hold back', 'hold off', 'keep up', 'keep on', 'keep out',
  'run into', 'run out', 'run away', 'run over', 'run through',
  'work out', 'work on', 'work up', 'check out', 'check in', 'check up on',
  'show up', 'show off', 'shut up', 'shut down', 'shut off',
  'hang out', 'hang on', 'hang up', 'hang in there',
  'stand up', 'stand out', 'stand for', 'sit down',
  'throw away', 'throw out', 'throw up', 'blow up', 'blow off',
  'pay off', 'pay for', 'pay back', 'pull off', 'pull over', 'pull through',
  'cut off', 'cut out', 'cut down', 'cut back',
  'fill in', 'fill out', 'fill up', 'point out', 'point at',
  'pass out', 'pass away', 'pass by', 'pass on',
  'end up', 'wind up', 'mix up', 'mess up', 'screw up',
  'step up', 'step back', 'step in', 'step down',
  'call off', 'call out', 'call back', 'call up',
  'back up', 'back off', 'back down',
  'move on', 'move in', 'move out',
  'freak out', 'chill out', 'zone out', 'space out',
  'calm down', 'cool down', 'slow down', 'settle down',
  'speed up', 'catch up', 'grow up', 'wake up',
  'sign up', 'sign in', 'sign out', 'log in', 'log out',
  'try on', 'try out', 'carry on', 'carry out',
  'deal with', 'stick with', 'stick to', 'stick around',
  'count on', 'rely on', 'depend on', 'insist on',
  'fall for', 'fall apart', 'fall behind', 'fall through',
  'think about', 'think over', 'think through',
  'talk about', 'talk to', 'talk into',
  'ask for', 'ask out', 'ask around',
  'come down the pipe', 'give it a shot', 'give it a try',
])

// Known idioms
const IDIOMS = new Set([
  'cup of tea', 'break the ice', 'piece of cake', 'on the same page',
  'hit the nail on the head', 'bite the bullet', 'spill the beans',
  'let the cat out of the bag', 'kill two birds with one stone',
  'beat around the bush', 'cost an arm and a leg', 'once in a blue moon',
  'when pigs fly', 'the ball is in your court', 'stab in the back',
  'blessing in disguise', 'burning the midnight oil',
  'under the weather', 'over the moon', 'in the dark',
  'on cloud nine', 'raining cats and dogs', 'hit the road',
  'back to square one', 'the last straw', 'a long shot',
  'not my cup of tea', 'big deal', 'no big deal', 'no wonder',
  'at the end of the day', 'better late than never', 'better safe than sorry',
  'easier said than done', 'hard to come by', 'in the same boat',
  'it takes two to tango', 'keep your chin up', 'let it go',
  'long story short', 'miss the boat', 'on thin ice',
  'read between the lines', 'save the day', 'the whole nine yards',
  'time flies', 'tip of the iceberg', 'turn a blind eye',
  'worth it', 'son of a bitch', 'what the hell', 'what the heck',
  'how dare you', 'never mind', 'rain check',
  'get the hang of', 'get over it', 'get a grip',
  'in a nutshell', 'from scratch', 'behind the scenes',
  'all of a sudden', 'at the drop of a hat', 'by all means',
  'for good', 'for real', 'for sure', 'for the record',
  'go the extra mile', 'in the long run', 'in the meantime',
  'make a living', 'make ends meet', 'make sense',
  'off the top of my head', 'on purpose', 'on the other hand',
  'out of the blue', 'out of nowhere', 'out of the question',
  'rule of thumb', 'sick and tired', 'take for granted',
  'the bottom line', 'to be honest', 'up to you',
])

// Known fixed expressions
const FIXED_EXPRESSIONS = new Set([
  'by the way', 'as a matter of fact', 'in fact', 'in other words',
  'on the other hand', 'first of all', 'after all', 'all in all',
  'as long as', 'as far as', 'as well as', 'as if', 'as though',
  'even though', 'even if', 'in case', 'in order to', 'in terms of',
  'not only but also', 'whether or not', 'more or less',
  'sooner or later', 'once upon a time', 'believe it or not',
  'here we go', 'there you go', 'there we go', 'what about',
  'how about', 'what if', 'how come', 'no matter what',
  'it depends', 'that is to say', 'needless to say',
  'of course', 'for instance', 'for example',
  'on the contrary', 'to be fair', 'to tell the truth',
  'i can assure you', 'if you ask me', 'as far as i know',
  "i'm just saying", "all i'm saying is", 'the point is',
  'at least', 'at most', 'at last', 'at first',
  'in the end', 'in the beginning', 'in general',
  'thank you', "you're welcome", 'excuse me', 'i beg your pardon',
  'congratulations', 'good luck', 'take care',
  'nice to meet you', 'how are you', 'what do you do',
  "i'm sorry", 'my pleasure', 'no problem', 'no worries',
  'that makes sense', "that's the point", "what's the point",
  "what's up", "what's going on", "what's wrong",
  "i don't care", "i don't mind", "it doesn't matter",
  'never mind', 'not at all', 'not necessarily',
])

// Known collocations
const COLLOCATIONS = new Set([
  'make a decision', 'make a difference', 'make a mistake', 'make an effort',
  'make progress', 'make money', 'make sense', 'make friends', 'make sure',
  'take a break', 'take a look', 'take a chance', 'take a seat',
  'take action', 'take advantage of', 'take care of', 'take notes',
  'take place', 'take time', 'take turns',
  'pay attention', 'pay a visit', 'pay a compliment', 'pay the price',
  'do homework', 'do business', 'do a favor', 'do your best',
  'have a good time', 'have a point', 'have no idea', 'have a seat',
  'keep in mind', 'keep a secret', 'keep an eye on', 'keep in touch',
  'catch up', 'catch fire', 'catch a cold',
  'come to a conclusion', 'come to terms with',
  'go crazy', 'go wrong', 'go viral', 'go nuts',
  'run a business', 'run errands', 'run late', 'run out of',
  'play a role', 'play it safe', 'save time', 'save money',
  'spend time', 'waste time', 'kill time',
  'tell the truth', 'tell a lie', 'tell a joke', 'tell a story',
  'commit a crime', 'serve a purpose', 'raise awareness',
  'set a goal', 'reach a goal', 'achieve a goal',
  'heavy rain', 'strong wind', 'deep breath', 'bright future',
  'raise a question', 'pose a threat', 'meet a deadline',
])

function classify(expr) {
  const lower = expr.toLowerCase().trim()
  if (FILLERS.has(lower)) return 'filler'
  if (EXCLAMATIONS.has(lower)) return 'exclamation'
  if (SLANG.has(lower)) return 'slang'
  if (IDIOMS.has(lower)) return 'idiom'
  if (PHRASAL_VERBS.has(lower)) return 'phrasal_verb'
  if (COLLOCATIONS.has(lower)) return 'collocation'
  if (FIXED_EXPRESSIONS.has(lower)) return 'fixed_expression'
  if (DISCOURSE_MARKERS.has(lower)) return 'discourse_marker'
  if (HEDGING.has(lower)) return 'hedging'
  // Heuristic: 2-3 word with common verb → likely phrasal verb
  const words = lower.split(' ')
  if (words.length >= 2 && words.length <= 4) {
    const particles = new Set(['up', 'out', 'off', 'on', 'in', 'down', 'over', 'away', 'back', 'through', 'into', 'along', 'around', 'about', 'after', 'for', 'with', 'to', 'at'])
    if (particles.has(words[words.length - 1]) || (words.length >= 3 && particles.has(words[1]))) {
      return 'phrasal_verb'
    }
  }
  return 'fixed_expression'
}

function assignCefr(expr, category) {
  if (category === 'filler') return 'A2'
  if (category === 'exclamation') return 'A2'
  if (category === 'slang') {
    if (['gonna', 'wanna', 'gotta'].includes(expr)) return 'A2'
    return 'B1'
  }
  // Known level assignments
  const cefrMap = {
    'figure out': 'B1', 'come up with': 'B1', 'give up': 'B1', 'turn out': 'B1',
    'break down': 'B1', 'get over': 'B1', 'get rid of': 'B1', 'make up': 'B1',
    'cup of tea': 'B2', 'break the ice': 'B2', 'hard to come by': 'B2',
    'beat around the bush': 'C1', 'read between the lines': 'C1',
    'you know': 'A2', 'i mean': 'A2', 'come on': 'A2', 'all right': 'A2',
    'by the way': 'A2', 'of course': 'A2', 'no problem': 'A1',
    'thank you': 'A1', 'excuse me': 'A1', 'how are you': 'A1',
  }
  if (cefrMap[expr]) return cefrMap[expr]
  if (category === 'discourse_marker') return 'A2'
  if (category === 'hedging') return 'B1'
  if (category === 'idiom') return 'B2'
  if (category === 'phrasal_verb') return 'B1'
  if (category === 'collocation') return 'B1'
  if (category === 'fixed_expression') return 'B1'
  return 'B1'
}

function assignLearnerValue(expr, category, videoCount) {
  if (category === 'filler') return 'enrichment'
  if (category === 'exclamation' && videoCount < 10) return 'enrichment'
  if (category === 'slang' && ['gonna', 'wanna', 'gotta', "ain't"].includes(expr)) return 'essential'
  if (category === 'slang') return 'useful'
  if (videoCount >= 20) return 'essential'
  if (videoCount >= 5) return 'useful'
  return 'enrichment'
}

function assignTheme(expr, category) {
  const themes = []
  const lower = expr.toLowerCase()

  // Greeting/farewell
  if (['hello', 'hi', 'hey', 'how are you', 'nice to meet you', 'goodbye', 'see you', 'take care', 'good luck'].some(g => lower.includes(g))) themes.push('greeting')
  // Opinion
  if (['i think', 'i believe', 'i guess', 'i suppose', 'in my opinion', 'if you ask me', 'to be honest'].some(o => lower === o)) themes.push('opinion')
  // Agreement/disagreement
  if (['of course', 'absolutely', 'exactly', 'no way', 'no doubt', 'for sure', 'not at all', 'not really'].some(a => lower === a)) themes.push('agreement')
  // Surprise
  if (category === 'exclamation') themes.push('surprise')
  // Encouragement
  if (['come on', 'go for it', 'hang in there', 'keep it up', 'you can do it', "don't give up", 'cheer up'].some(e => lower === e)) themes.push('encouragement')
  // Conversation
  if (category === 'discourse_marker' || category === 'hedging' || category === 'filler') themes.push('conversation')
  // Work
  if (['meet a deadline', 'run a business', 'do business', 'make a living', 'make money', 'get promoted'].some(w => lower === w)) themes.push('work')
  // Relationship
  if (['break up', 'fall for', 'get along', 'ask out'].some(r => lower === r)) themes.push('relationships')

  if (themes.length === 0) themes.push('general')
  return themes
}

function assignRegister(expr, category) {
  if (category === 'slang' || category === 'filler') return 'casual'
  if (category === 'exclamation') return 'casual'
  if (['i beg your pardon', 'needless to say', 'as a matter of fact', 'if you will', 'i can assure you', 'in terms of', 'with regard to', 'nevertheless'].some(f => expr === f)) return 'formal'
  return 'neutral'
}

// ============================================================
// Phase 2: Reverse match ALL sentences
// ============================================================

function buildMatchPatterns(expressions) {
  // For each expression, create regex patterns that match variations
  const patterns = []
  for (const expr of expressions) {
    const canonical = expr.canonical
    const words = canonical.split(' ')

    let pattern
    if (expr.category === 'phrasal_verb' && words.length >= 2) {
      // Allow words between verb and particle: "figure it out", "turn the lights off"
      const verb = words[0]
      const rest = words.slice(1).join('\\s+')
      // Match verb forms: base, -s, -ed, -ing, irregular
      const verbPattern = makeVerbPattern(verb)
      pattern = new RegExp(`\\b${verbPattern}(?:\\s+\\w+){0,3}\\s+${rest}\\b`, 'i')
    } else {
      // Direct substring match with word boundaries
      const escaped = canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      pattern = new RegExp(`\\b${escaped}\\b`, 'i')
    }

    patterns.push({ canonical, pattern, category: expr.category })
  }
  return patterns
}

function makeVerbPattern(verb) {
  const escaped = verb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Common irregular forms
  const irregulars = {
    'get': 'get|gets|got|gotten|getting',
    'go': 'go|goes|went|gone|going',
    'come': 'come|comes|came|coming',
    'take': 'take|takes|took|taken|taking',
    'make': 'make|makes|made|making',
    'give': 'give|gives|gave|given|giving',
    'break': 'break|breaks|broke|broken|breaking',
    'run': 'run|runs|ran|running',
    'find': 'find|finds|found|finding',
    'think': 'think|thinks|thought|thinking',
    'bring': 'bring|brings|brought|bringing',
    'put': 'put|puts|putting',
    'set': 'set|sets|setting',
    'turn': 'turn|turns|turned|turning',
    'look': 'look|looks|looked|looking',
    'keep': 'keep|keeps|kept|keeping',
    'hold': 'hold|holds|held|holding',
    'stand': 'stand|stands|stood|standing',
    'fall': 'fall|falls|fell|fallen|falling',
    'pick': 'pick|picks|picked|picking',
    'show': 'show|shows|showed|shown|showing',
    'hang': 'hang|hangs|hung|hanging',
    'shut': 'shut|shuts|shutting',
    'blow': 'blow|blows|blew|blown|blowing',
    'throw': 'throw|throws|threw|thrown|throwing',
    'cut': 'cut|cuts|cutting',
    'pull': 'pull|pulls|pulled|pulling',
    'call': 'call|calls|called|calling',
    'end': 'end|ends|ended|ending',
    'wind': 'wind|winds|wound|winding',
    'step': 'step|steps|stepped|stepping',
    'move': 'move|moves|moved|moving',
    'catch': 'catch|catches|caught|catching',
    'pay': 'pay|pays|paid|paying',
    'fill': 'fill|fills|filled|filling',
    'pass': 'pass|passes|passed|passing',
    'back': 'back|backs|backed|backing',
    'sign': 'sign|signs|signed|signing',
    'try': 'try|tries|tried|trying',
    'deal': 'deal|deals|dealt|dealing',
    'stick': 'stick|sticks|stuck|sticking',
    'ask': 'ask|asks|asked|asking',
    'talk': 'talk|talks|talked|talking',
    'work': 'work|works|worked|working',
    'check': 'check|checks|checked|checking',
    'drop': 'drop|drops|dropped|dropping',
    'mix': 'mix|mixes|mixed|mixing',
    'mess': 'mess|messes|messed|messing',
    'screw': 'screw|screws|screwed|screwing',
    'freak': 'freak|freaks|freaked|freaking',
    'chill': 'chill|chills|chilled|chilling',
    'calm': 'calm|calms|calmed|calming',
    'slow': 'slow|slows|slowed|slowing',
    'speed': 'speed|speeds|sped|speeding',
    'grow': 'grow|grows|grew|grown|growing',
    'wake': 'wake|wakes|woke|woken|waking',
    'carry': 'carry|carries|carried|carrying',
    'figure': 'figure|figures|figured|figuring',
    'settle': 'settle|settles|settled|settling',
  }
  return `(?:${irregulars[verb] || escaped + '|' + escaped + 's|' + escaped + 'ed|' + escaped + 'ing'})`
}

// ============================================================
// Main
// ============================================================

console.log('=== Expression Dictionary Rebuild v2.0 ===\n')

// Load v1 dictionary
const v1 = JSON.parse(fs.readFileSync('./src/data/expression-dictionary.json', 'utf8'))
console.log(`Loaded v1: ${v1.totalExpressions} expressions, ${v1.totalOccurrences} occurrences`)

// Phase 1: Reclassify
console.log('\n--- Phase 1: Reclassifying ---')
const reclassified = new Map()
for (const expr of v1.expressions) {
  const category = classify(expr.canonical)
  const cefr = assignCefr(expr.canonical, category)
  const learnerValue = assignLearnerValue(expr.canonical, category, expr.videoCount)
  const theme = assignTheme(expr.canonical, category)
  const register = assignRegister(expr.canonical, category)

  reclassified.set(expr.canonical, {
    id: expr.id,
    canonical: expr.canonical,
    meaning_ko: '',
    category,
    cefr,
    theme,
    register,
    learner_value: learnerValue,
    videoIds: new Set(expr.occurrences.map(o => o.videoId)),
    occurrences: expr.occurrences,
  })
}

// Category stats after reclassification
const catStats = {}
for (const [, e] of reclassified) catStats[e.category] = (catStats[e.category] || 0) + 1
console.log('After reclassification:')
Object.entries(catStats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`))

// Phase 2: Reverse match all expression-tag sentences
console.log('\n--- Phase 2: Reverse matching all sentences ---')
const tagsDir = './public/expression-tags'
const files = fs.readdirSync(tagsDir).filter(f => f.endsWith('.json'))

// Build match patterns from reclassified dictionary
const exprList = [...reclassified.values()]
const patterns = buildMatchPatterns(exprList)
console.log(`Built ${patterns.length} match patterns`)

let matchedSentences = 0
let newExpressions = 0
let totalSentences = 0
let videosWithMatch = 0
let videosTotal = 0

for (let fi = 0; fi < files.length; fi++) {
  const data = JSON.parse(fs.readFileSync(path.join(tagsDir, files[fi]), 'utf8'))
  const videoId = data.videoId
  videosTotal++
  let videoHasMatch = false

  for (const s of data.sentences || []) {
    totalSentences++
    const en = s.en || ''
    const sentenceIdx = parseInt(s.id.split('-').pop(), 10)

    // Try matching against all patterns
    for (const p of patterns) {
      if (p.pattern.test(en)) {
        const entry = reclassified.get(p.canonical)
        if (entry) {
          // Check if this occurrence already exists
          const exists = entry.occurrences.some(
            o => o.videoId === videoId && o.sentenceIdx === sentenceIdx
          )
          if (!exists) {
            entry.occurrences.push({
              videoId,
              sentenceIdx,
              en,
              ko: s.ko || '',
            })
            entry.videoIds.add(videoId)
            matchedSentences++
          }
          videoHasMatch = true
        }
      }
    }
  }

  if (videoHasMatch) videosWithMatch++

  if ((fi + 1) % 200 === 0) {
    console.log(`  Processed ${fi + 1}/${files.length} files, ${matchedSentences} new matches`)
  }
}

console.log(`\nReverse matching complete:`)
console.log(`  Total sentences scanned: ${totalSentences}`)
console.log(`  New matches found: ${matchedSentences}`)
console.log(`  Videos with at least 1 match: ${videosWithMatch}/${videosTotal} (${(videosWithMatch/videosTotal*100).toFixed(1)}%)`)

// Phase 3: Build final dictionary
console.log('\n--- Phase 3: Building final dictionary ---')
const entries = [...reclassified.values()]
  .map(e => ({
    id: e.id,
    canonical: e.canonical,
    meaning_ko: e.meaning_ko,
    category: e.category,
    cefr: e.cefr,
    theme: e.theme,
    register: e.register,
    learner_value: e.learner_value,
    videoCount: e.videoIds.size,
    occurrenceCount: e.occurrences.length,
    occurrences: e.occurrences,
  }))
  .sort((a, b) => b.videoCount - a.videoCount)

const dictionary = {
  version: '2.0.0',
  generatedAt: new Date().toISOString(),
  totalExpressions: entries.length,
  totalOccurrences: entries.reduce((sum, e) => sum + e.occurrenceCount, 0),
  expressions: entries,
}

fs.writeFileSync('./src/data/expression-dictionary.json', JSON.stringify(dictionary, null, 2))
console.log(`\nDictionary v2.0 saved!`)
console.log(`  Unique expressions: ${entries.length}`)
console.log(`  Total occurrences: ${dictionary.totalOccurrences}`)

// Final stats
const finalCats = {}
for (const e of entries) finalCats[e.category] = (finalCats[e.category] || 0) + 1
console.log(`\nBy category:`)
Object.entries(finalCats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`))

const finalCefr = {}
for (const e of entries) finalCefr[e.cefr] = (finalCefr[e.cefr] || 0) + 1
console.log(`\nBy CEFR:`)
Object.entries(finalCefr).sort().forEach(([c, n]) => console.log(`  ${c}: ${n}`))

const finalValue = {}
for (const e of entries) finalValue[e.learner_value] = (finalValue[e.learner_value] || 0) + 1
console.log(`\nBy learner value:`)
Object.entries(finalValue).sort((a, b) => b[1] - a[1]).forEach(([v, n]) => console.log(`  ${v}: ${n}`))

// Top expressions per category
for (const cat of ['phrasal_verb', 'idiom', 'collocation', 'fixed_expression', 'slang', 'discourse_marker']) {
  console.log(`\nTop 15 ${cat}:`)
  entries.filter(e => e.category === cat).slice(0, 15).forEach((e, i) =>
    console.log(`  ${i + 1}. "${e.canonical}" — ${e.videoCount} videos, ${e.cefr}`)
  )
}

// Video coverage
console.log(`\n=== VIDEO COVERAGE ===`)
console.log(`Videos with expression match: ${videosWithMatch}/${videosTotal} (${(videosWithMatch/videosTotal*100).toFixed(1)}%)`)
