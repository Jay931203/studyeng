import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// ─── Irregular verb table ───────────────────────────────────────────────────
const IRREGULAR_VERBS = {
  be: ['am', 'is', 'are', 'was', 'were', 'been', 'being'],
  have: ['has', 'had', 'having'],
  do: ['does', 'did', 'done', 'doing'],
  go: ['goes', 'went', 'gone', 'going'],
  get: ['gets', 'got', 'gotten', 'getting'],
  make: ['makes', 'made', 'making'],
  take: ['takes', 'took', 'taken', 'taking'],
  come: ['comes', 'came', 'coming'],
  see: ['sees', 'saw', 'seen', 'seeing'],
  know: ['knows', 'knew', 'known', 'knowing'],
  think: ['thinks', 'thought', 'thinking'],
  give: ['gives', 'gave', 'given', 'giving'],
  find: ['finds', 'found', 'finding'],
  tell: ['tells', 'told', 'telling'],
  say: ['says', 'said', 'saying'],
  let: ['lets', 'letting'],
  put: ['puts', 'putting'],
  keep: ['keeps', 'kept', 'keeping'],
  leave: ['leaves', 'left', 'leaving'],
  feel: ['feels', 'felt', 'feeling'],
  bring: ['brings', 'brought', 'bringing'],
  begin: ['begins', 'began', 'begun', 'beginning'],
  hold: ['holds', 'held', 'holding'],
  write: ['writes', 'wrote', 'written', 'writing'],
  stand: ['stands', 'stood', 'standing'],
  hear: ['hears', 'heard', 'hearing'],
  meet: ['meets', 'met', 'meeting'],
  run: ['runs', 'ran', 'running'],
  pay: ['pays', 'paid', 'paying'],
  sit: ['sits', 'sat', 'sitting'],
  speak: ['speaks', 'spoke', 'spoken', 'speaking'],
  lie: ['lies', 'lay', 'lain', 'lying'],
  lead: ['leads', 'led', 'leading'],
  read: ['reads', 'reading'], // read (past) same spelling
  grow: ['grows', 'grew', 'grown', 'growing'],
  lose: ['loses', 'lost', 'losing'],
  fall: ['falls', 'fell', 'fallen', 'falling'],
  send: ['sends', 'sent', 'sending'],
  build: ['builds', 'built', 'building'],
  understand: ['understands', 'understood', 'understanding'],
  draw: ['draws', 'drew', 'drawn', 'drawing'],
  break: ['breaks', 'broke', 'broken', 'breaking'],
  spend: ['spends', 'spent', 'spending'],
  cut: ['cuts', 'cutting'],
  rise: ['rises', 'rose', 'risen', 'rising'],
  drive: ['drives', 'drove', 'driven', 'driving'],
  buy: ['buys', 'bought', 'buying'],
  wear: ['wears', 'wore', 'worn', 'wearing'],
  choose: ['chooses', 'chose', 'chosen', 'choosing'],
  catch: ['catches', 'caught', 'catching'],
  teach: ['teaches', 'taught', 'teaching'],
  throw: ['throws', 'threw', 'thrown', 'throwing'],
  fly: ['flies', 'flew', 'flown', 'flying'],
  forget: ['forgets', 'forgot', 'forgotten', 'forgetting'],
  forgive: ['forgives', 'forgave', 'forgiven', 'forgiving'],
  set: ['sets', 'setting'],
  hit: ['hits', 'hitting'],
  sell: ['sells', 'sold', 'selling'],
  win: ['wins', 'won', 'winning'],
  eat: ['eats', 'ate', 'eaten', 'eating'],
  drink: ['drinks', 'drank', 'drunk', 'drinking'],
  sleep: ['sleeps', 'slept', 'sleeping'],
  swim: ['swims', 'swam', 'swum', 'swimming'],
  sing: ['sings', 'sang', 'sung', 'singing'],
  ring: ['rings', 'rang', 'rung', 'ringing'],
  hang: ['hangs', 'hung', 'hanging'],
  fight: ['fights', 'fought', 'fighting'],
  shoot: ['shoots', 'shot', 'shooting'],
  bite: ['bites', 'bit', 'bitten', 'biting'],
  hide: ['hides', 'hid', 'hidden', 'hiding'],
  ride: ['rides', 'rode', 'ridden', 'riding'],
  shine: ['shines', 'shone', 'shining'],
  shake: ['shakes', 'shook', 'shaken', 'shaking'],
  steal: ['steals', 'stole', 'stolen', 'stealing'],
  sweep: ['sweeps', 'swept', 'sweeping'],
  swing: ['swings', 'swung', 'swinging'],
  wake: ['wakes', 'woke', 'woken', 'waking'],
  bear: ['bears', 'bore', 'born', 'bearing'],
  blow: ['blows', 'blew', 'blown', 'blowing'],
  deal: ['deals', 'dealt', 'dealing'],
  dig: ['digs', 'dug', 'digging'],
  feed: ['feeds', 'fed', 'feeding'],
  fit: ['fits', 'fitting'],
  freeze: ['freezes', 'froze', 'frozen', 'freezing'],
  lend: ['lends', 'lent', 'lending'],
  mean: ['means', 'meant', 'meaning'],
  meet: ['meets', 'met', 'meeting'],
  show: ['shows', 'showed', 'shown', 'showing'],
  shut: ['shuts', 'shutting'],
  stick: ['sticks', 'stuck', 'sticking'],
  strike: ['strikes', 'struck', 'striking'],
  swear: ['swears', 'swore', 'sworn', 'swearing'],
  tear: ['tears', 'tore', 'torn', 'tearing'],
  think: ['thinks', 'thought', 'thinking'],
  win: ['wins', 'won', 'winning'],
  wrap: ['wraps', 'wrapped', 'wrapping'],
};

// Build reverse map: inflected form -> base form
const inflectedToBase = {};
for (const [base, forms] of Object.entries(IRREGULAR_VERBS)) {
  for (const form of forms) {
    if (!inflectedToBase[form]) inflectedToBase[form] = [];
    inflectedToBase[form].push(base);
  }
}

// Regular verb inflections
function getRegularInflections(verb) {
  const forms = [verb];
  // -s / -es
  if (verb.endsWith('s') || verb.endsWith('x') || verb.endsWith('z') || verb.endsWith('ch') || verb.endsWith('sh')) {
    forms.push(verb + 'es');
  } else if (verb.endsWith('y') && !/[aeiou]y$/.test(verb)) {
    forms.push(verb.slice(0, -1) + 'ies');
  } else {
    forms.push(verb + 's');
  }
  // -ed
  if (verb.endsWith('e')) {
    forms.push(verb + 'd');
  } else if (verb.endsWith('y') && !/[aeiou]y$/.test(verb)) {
    forms.push(verb.slice(0, -1) + 'ied');
  } else {
    forms.push(verb + 'ed');
  }
  // -ing
  if (verb.endsWith('e') && !verb.endsWith('ee') && !verb.endsWith('ie')) {
    forms.push(verb.slice(0, -1) + 'ing');
  } else if (/[^aeiou][aeiou][^aeiouwxy]$/.test(verb)) {
    forms.push(verb + verb.slice(-1) + 'ing');
  } else {
    forms.push(verb + 'ing');
  }
  return [...new Set(forms)];
}

// Get all forms for a word (handles irregular + regular)
function getAllForms(word) {
  const lower = word.toLowerCase();
  const forms = new Set([lower]);

  // Direct irregular
  if (IRREGULAR_VERBS[lower]) {
    for (const f of IRREGULAR_VERBS[lower]) forms.add(f);
  }

  // If this word IS an irregular form, add base and siblings
  if (inflectedToBase[lower]) {
    for (const base of inflectedToBase[lower]) {
      forms.add(base);
      if (IRREGULAR_VERBS[base]) {
        for (const f of IRREGULAR_VERBS[base]) forms.add(f);
      }
    }
  }

  // Regular forms
  for (const f of getRegularInflections(lower)) forms.add(f);

  return [...forms];
}

// ─── Core matching logic ─────────────────────────────────────────────────────

/**
 * Given a canonical expression and a sentence, find the surface form.
 * Returns the matched substring (preserving original case) or null.
 */
function findSurfaceForm(exprId, sentence) {
  if (!exprId || !sentence) return null;

  const tokens = exprId.toLowerCase().trim().split(/\s+/);
  const sentenceLower = sentence.toLowerCase();

  // Strategy 1: Direct substring match (handles multi-word, fixed phrases)
  const directIdx = sentenceLower.indexOf(exprId.toLowerCase());
  if (directIdx !== -1) {
    return sentence.slice(directIdx, directIdx + exprId.length);
  }

  // Strategy 2: Token-level flexible match
  // Build a regex that allows:
  //   - Each token matched as a word (with inflections)
  //   - Between tokens: 1-3 words may appear (for object insertion)
  //   - Contractions: "i'm" matches "i am", "it's" matches "it is", etc.

  const tokenPatterns = tokens.map(token => {
    // get all inflected forms
    const forms = getAllForms(token);
    // sort longer first to avoid partial matches
    forms.sort((a, b) => b.length - a.length);
    // escape regex specials
    const escaped = forms.map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return '(' + escaped.join('|') + ')';
  });

  let pattern;
  if (tokenPatterns.length === 1) {
    pattern = '\\b' + tokenPatterns[0] + '\\b';
  } else {
    // Allow up to 3 words between each token pair (object insertion)
    pattern = '\\b' + tokenPatterns.join('(?:\\s+\\S+){0,3}\\s+') + '\\b';
  }

  try {
    const regex = new RegExp(pattern, 'gi');
    const match = regex.exec(sentence);
    if (match) {
      return match[0];
    }
  } catch (e) {
    // regex error - skip
  }

  // Strategy 3: contraction expansion
  // e.g. "i'm" -> "i am", "it's" -> "it is", "can't" -> "cannot"
  const expansions = {
    "i'm": "i am",
    "it's": "it is",
    "that's": "that is",
    "he's": "he is",
    "she's": "she is",
    "we're": "we are",
    "they're": "they are",
    "you're": "you are",
    "i've": "i have",
    "we've": "we have",
    "you've": "you have",
    "they've": "they have",
    "i'd": "i would",
    "he'd": "he would",
    "she'd": "she would",
    "we'd": "we would",
    "you'd": "you would",
    "they'd": "they would",
    "can't": "cannot",
    "couldn't": "could not",
    "don't": "do not",
    "doesn't": "does not",
    "didn't": "did not",
    "won't": "will not",
    "wouldn't": "would not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "haven't": "have not",
    "hasn't": "has not",
    "hadn't": "had not",
    "i'll": "i will",
    "we'll": "we will",
    "you'll": "you will",
    "he'll": "he will",
    "she'll": "she will",
    "they'll": "they will",
    "gonna": "going to",
    "wanna": "want to",
    "gotta": "got to",
    "kinda": "kind of",
    "sorta": "sort of",
    "lemme": "let me",
    "gimme": "give me",
    "ya": "you",
    "ain't": "am not",
  };

  // Try matching after expanding contractions in sentence
  let expandedSentence = sentenceLower;
  const contractionPositions = []; // track original positions
  for (const [contracted, expanded] of Object.entries(expansions)) {
    expandedSentence = expandedSentence.replace(new RegExp(contracted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), expanded);
  }

  // Try matching the expr in the expanded sentence
  const directIdx2 = expandedSentence.indexOf(exprId.toLowerCase());
  if (directIdx2 !== -1) {
    // Find the corresponding original text - approximate by finding a matching window
    // Use a word-boundary search in original
    const words = exprId.toLowerCase().split(/\s+/);
    const firstWord = words[0];
    const lastWord = words[words.length - 1];

    // Find first word in original
    const firstWordRegex = new RegExp('\\b' + firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    const firstMatch = firstWordRegex.exec(sentence);
    if (firstMatch) {
      // Greedily grab tokens until we've matched all expr words
      const remaining = sentence.slice(firstMatch.index);
      // Return a reasonable chunk
      const exprWordCount = words.length;
      const sentenceWordsFromHere = remaining.split(/\s+/).slice(0, exprWordCount + 2);
      // Build tentative surface: try exact word count first
      return sentenceWordsFromHere.slice(0, exprWordCount).join(' ');
    }
  }

  // Strategy 4: partial match - find at least the first token as a whole word
  const firstToken = tokens[0];
  const firstForms = getAllForms(firstToken);
  for (const form of firstForms) {
    const regex = new RegExp('\\b' + form.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
    const m = regex.exec(sentence);
    if (m) {
      // Return just this first token match if no better match found
      // Only do this for single-word expressions
      if (tokens.length === 1) {
        return m[0];
      }
    }
  }

  return null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const inputPath = 'C:\\tmp\\sf-batch-6.json';
const outputPath = 'C:\\Users\\hyunj\\studyeng\\src\\data\\match-results-v3\\batch-6.json';

const matches = JSON.parse(readFileSync(inputPath, 'utf8'));
console.log(`Loaded ${matches.length} matches`);

let found = 0;
let notFound = 0;

const results = matches.map((m, i) => {
  const sf = findSurfaceForm(m.exprId, m.en);
  if (sf !== null) {
    found++;
  } else {
    notFound++;
  }
  return { ...m, surfaceForm: sf };
});

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');

console.log(`\nDone.`);
console.log(`Total matches: ${matches.length}`);
console.log(`surfaceForm found: ${found}`);
console.log(`surfaceForm null:  ${notFound}`);
console.log(`Coverage: ${((found / matches.length) * 100).toFixed(1)}%`);
console.log(`Output written to: ${outputPath}`);

// Sample of nulls for review
const nullSamples = results.filter(r => r.surfaceForm === null).slice(0, 10);
if (nullSamples.length > 0) {
  console.log('\nSample unmatched:');
  for (const s of nullSamples) {
    console.log(`  exprId="${s.exprId}" | en="${s.en}"`);
  }
}
