import { readFileSync, writeFileSync } from 'fs';

// Irregular verb table: base → [forms]
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
  say: ['says', 'said', 'saying'],
  tell: ['tells', 'told', 'telling'],
  give: ['gives', 'gave', 'given', 'giving'],
  find: ['finds', 'found', 'finding'],
  feel: ['feels', 'felt', 'feeling'],
  keep: ['keeps', 'kept', 'keeping'],
  leave: ['leaves', 'left', 'leaving'],
  put: ['puts', 'putting'],
  bring: ['brings', 'brought', 'bringing'],
  hold: ['holds', 'held', 'holding'],
  turn: ['turns', 'turned', 'turning'],
  set: ['sets', 'setting'],
  run: ['runs', 'ran', 'running'],
  show: ['shows', 'showed', 'shown', 'showing'],
  hear: ['hears', 'heard', 'hearing'],
  play: ['plays', 'played', 'playing'],
  stand: ['stands', 'stood', 'standing'],
  lose: ['loses', 'lost', 'losing'],
  pay: ['pays', 'paid', 'paying'],
  meet: ['meets', 'met', 'meeting'],
  sit: ['sits', 'sat', 'sitting'],
  speak: ['speaks', 'spoke', 'spoken', 'speaking'],
  spend: ['spends', 'spent', 'spending'],
  grow: ['grows', 'grew', 'grown', 'growing'],
  break: ['breaks', 'broke', 'broken', 'breaking'],
  fall: ['falls', 'fell', 'fallen', 'falling'],
  begin: ['begins', 'began', 'begun', 'beginning'],
  write: ['writes', 'wrote', 'written', 'writing'],
  read: ['reads', 'reading'],
  send: ['sends', 'sent', 'sending'],
  build: ['builds', 'built', 'building'],
  buy: ['buys', 'bought', 'buying'],
  sell: ['sells', 'sold', 'selling'],
  cut: ['cuts', 'cutting'],
  hit: ['hits', 'hitting'],
  let: ['lets', 'letting'],
  eat: ['eats', 'ate', 'eaten', 'eating'],
  drink: ['drinks', 'drank', 'drunk', 'drinking'],
  drive: ['drives', 'drove', 'driven', 'driving'],
  fly: ['flies', 'flew', 'flown', 'flying'],
  ride: ['rides', 'rode', 'ridden', 'riding'],
  wake: ['wakes', 'woke', 'woken', 'waking'],
  wear: ['wears', 'wore', 'worn', 'wearing'],
  win: ['wins', 'won', 'winning'],
  catch: ['catches', 'caught', 'catching'],
  choose: ['chooses', 'chose', 'chosen', 'choosing'],
  draw: ['draws', 'drew', 'drawn', 'drawing'],
  fight: ['fights', 'fought', 'fighting'],
  forget: ['forgets', 'forgot', 'forgotten', 'forgetting'],
  forgive: ['forgives', 'forgave', 'forgiven', 'forgiving'],
  freeze: ['freezes', 'froze', 'frozen', 'freezing'],
  hang: ['hangs', 'hung', 'hanging'],
  hide: ['hides', 'hid', 'hidden', 'hiding'],
  lead: ['leads', 'led', 'leading'],
  mean: ['means', 'meant', 'meaning'],
  rise: ['rises', 'rose', 'risen', 'rising'],
  ring: ['rings', 'rang', 'rung', 'ringing'],
  shake: ['shakes', 'shook', 'shaken', 'shaking'],
  shine: ['shines', 'shone', 'shining'],
  shoot: ['shoots', 'shot', 'shooting'],
  sing: ['sings', 'sang', 'sung', 'singing'],
  sleep: ['sleeps', 'slept', 'sleeping'],
  slide: ['slides', 'slid', 'sliding'],
  steal: ['steals', 'stole', 'stolen', 'stealing'],
  stick: ['sticks', 'stuck', 'sticking'],
  strike: ['strikes', 'struck', 'striking'],
  swear: ['swears', 'swore', 'sworn', 'swearing'],
  sweep: ['sweeps', 'swept', 'sweeping'],
  swim: ['swims', 'swam', 'swum', 'swimming'],
  swing: ['swings', 'swung', 'swinging'],
  teach: ['teaches', 'taught', 'teaching'],
  tear: ['tears', 'tore', 'torn', 'tearing'],
  throw: ['throws', 'threw', 'thrown', 'throwing'],
  understand: ['understands', 'understood', 'understanding'],
  withdraw: ['withdraws', 'withdrew', 'withdrawn', 'withdrawing'],
};

// Build reverse map: form → base
const formToBase = new Map();
for (const [base, forms] of Object.entries(IRREGULAR_VERBS)) {
  formToBase.set(base, base);
  for (const form of forms) {
    formToBase.set(form, base);
  }
}

// Regular verb suffixes for normalized comparison
function getRegularForms(word) {
  const forms = [word];
  // -s, -es
  forms.push(word + 's');
  forms.push(word + 'es');
  // -ed
  forms.push(word + 'ed');
  if (word.endsWith('e')) forms.push(word + 'd');
  // -ing
  forms.push(word + 'ing');
  if (word.endsWith('e')) forms.push(word.slice(0, -1) + 'ing');
  // double consonant
  const last = word[word.length - 1];
  const secondLast = word[word.length - 2];
  if (last && secondLast && 'bcdfghjklmnpqrstvwxyz'.includes(last) && !'aeiou'.includes(secondLast)) {
    forms.push(word + last + 'ing');
    forms.push(word + last + 'ed');
  }
  return forms;
}

// Check if word matches a canonical token (handles inflection)
function tokenMatches(sentenceToken, exprToken) {
  const st = sentenceToken.toLowerCase();
  const et = exprToken.toLowerCase();
  if (st === et) return true;

  // Check irregular forms
  const stBase = formToBase.get(st);
  const etBase = formToBase.get(et);
  if (stBase && etBase && stBase === etBase) return true;
  if (stBase && stBase === et) return true;
  if (etBase && etBase === st) return true;

  // Check regular forms
  const regularForms = getRegularForms(et);
  if (regularForms.includes(st)) return true;

  // Handle -y → -ies (e.g. try → tries)
  if (et.endsWith('y')) {
    const stem = et.slice(0, -1);
    if (st === stem + 'ies' || st === stem + 'ied') return true;
  }

  return false;
}

// Try to match expression tokens starting from startIdx, with limited gap allowance
function tryMatch(exprTokens, wordMatches, startIdx) {
  const n = exprTokens.length;
  const indices = [];
  let wIdx = startIdx;

  for (let eIdx = 0; eIdx < n; eIdx++) {
    const et = exprTokens[eIdx];
    let found = false;

    // Allow up to 5 words gap for object insertion (only between non-first tokens for multi-word)
    const maxGap = eIdx === 0 ? 0 : 5;
    const searchEnd = Math.min(wIdx + maxGap + 1, wordMatches.length);

    for (let i = wIdx; i < searchEnd; i++) {
      if (tokenMatches(wordMatches[i].word, et)) {
        indices.push(i);
        wIdx = i + 1;
        found = true;
        break;
      }
    }

    if (!found) return null;
  }

  return indices;
}

// Try to find expression in sentence, allowing object insertion between parts
// Returns the matched surfaceForm string or null
function findSurfaceForm(exprId, sentence) {
  const exprTokens = exprId.toLowerCase().split(/\s+/);

  if (!sentence) return null;

  const regex = /[\w']+/g;
  let m;
  const wordMatches = [];
  while ((m = regex.exec(sentence)) !== null) {
    wordMatches.push({ word: m[0], index: m.index });
  }

  if (wordMatches.length === 0) return null;

  const n = exprTokens.length;

  // Try each starting position
  for (let start = 0; start <= wordMatches.length - n; start++) {
    const matched = tryMatch(exprTokens, wordMatches, start);
    if (matched) {
      // Extract the surface form from the sentence
      const firstWord = wordMatches[matched[0]];
      const lastWord = wordMatches[matched[matched.length - 1]];
      const surface = sentence.slice(firstWord.index, lastWord.index + lastWord.word.length);
      return surface;
    }
  }
  return null;
}

// Normalize apostrophe-s possessives and hyphens for matching
function normalizeSentence(sentence) {
  return sentence.replace(/'\s*s\b/gi, '').replace(/[\u2018\u2019]/g, "'");
}

// Colloquial → expanded form mappings for reverse lookup
const COLLOQUIAL_TO_EXPANDED = {
  'wanna': 'want to',
  'gonna': 'going to',
  'gotta': 'got to',
};

// Extended surface form finder with fallback strategies
function findSurfaceFormExtended(exprId, sentence) {
  if (!sentence) return null;

  // Direct search
  let result = findSurfaceForm(exprId, sentence);
  if (result) return result;

  // Try colloquial → expanded form (e.g. "wanna" → "want to", "gonna" → "going to")
  const expandedExpr = COLLOQUIAL_TO_EXPANDED[exprId.toLowerCase()];
  if (expandedExpr) {
    result = findSurfaceForm(expandedExpr, sentence);
    if (result) return result;
  }

  // Try with hyphenated expr as single token (e.g. "uh-oh" → token "uh-oh")
  if (exprId.includes('-')) {
    const exprNoDash = exprId.replace(/-/g, ' ');
    result = findSurfaceForm(exprNoDash, sentence);
    if (result) return result;

    // Also try direct substring match for hyphenated words
    const escaped = exprId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'i');
    const m = sentence.match(re);
    if (m) return m[0];
  }

  // Try with possessive-stripped sentence
  const normalized = normalizeSentence(sentence);
  if (normalized !== sentence) {
    result = findSurfaceForm(exprId, normalized);
    if (result) {
      // Map back: find the first word of result in original sentence
      const firstWord = result.split(/\s+/)[0];
      const origRe = new RegExp(firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const origMatch = sentence.match(origRe);
      if (origMatch) {
        const startIdx = sentence.toLowerCase().indexOf(origMatch[0].toLowerCase());
        const resultWords = result.split(/\s+/);
        const lastWord = resultWords[resultWords.length - 1];
        const lastRe = new RegExp(lastWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "(?:'s)?", 'i');
        const m2 = sentence.slice(startIdx).match(lastRe);
        if (m2) {
          return sentence.slice(startIdx, startIdx + sentence.slice(startIdx).indexOf(m2[0]) + m2[0].length);
        }
      }
      return result;
    }
  }

  // Try one's / someone's placeholder patterns (e.g. "on one's own" → "on my own")
  const placeholderExpr = exprId.replace(/\bone's\b/g, "(?:my|your|his|her|its|our|their|one's)");
  if (placeholderExpr !== exprId) {
    try {
      const re = new RegExp(placeholderExpr, 'i');
      const m = sentence.match(re);
      if (m) return m[0];
    } catch(e) {}
  }

  // Try someone/something placeholder
  const someonePlaceholder = exprId.replace(/\bsomeone\b/g, "(?:someone|somebody|anyone|anybody|him|her|me|you|them|us|it)");
  if (someonePlaceholder !== exprId) {
    try {
      const re = new RegExp(someonePlaceholder, 'i');
      const m = sentence.match(re);
      if (m) return m[0];
    } catch(e) {}
  }

  return null;
}

// Main
const input = JSON.parse(readFileSync('C:/tmp/sf-batch-9.json', 'utf-8'));
let found = 0;
let notFound = 0;

const output = input.map(match => {
  const surfaceForm = findSurfaceFormExtended(match.exprId, match.en);
  if (surfaceForm) found++;
  else notFound++;
  return { ...match, surfaceForm };
});

writeFileSync(
  'C:/Users/hyunj/studyeng/src/data/match-results-v3/batch-9.json',
  JSON.stringify(output, null, 2),
  'utf-8'
);

console.log(`Total: ${output.length}`);
console.log(`Found: ${found}`);
console.log(`Not found (null): ${notFound}`);

// Show some null cases for inspection
const nullCases = output.filter(m => m.surfaceForm === null).slice(0, 15);
console.log('\nSample null cases:');
for (const c of nullCases) {
  console.log(`  exprId: "${c.exprId}" | en: "${c.en}"`);
}
