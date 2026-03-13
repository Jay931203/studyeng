import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

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
  blow: ['blows', 'blew', 'blown', 'blowing'],
  lay: ['lays', 'laid', 'laying'],
  lie: ['lies', 'lay', 'lain', 'lying'],
  light: ['lights', 'lit', 'lighting'],
  bite: ['bites', 'bit', 'bitten', 'biting'],
  dig: ['digs', 'dug', 'digging'],
  seek: ['seeks', 'sought', 'seeking'],
  lend: ['lends', 'lent', 'lending'],
  bend: ['bends', 'bent', 'bending'],
  feed: ['feeds', 'fed', 'feeding'],
  bleed: ['bleeds', 'bled', 'bleeding'],
  bet: ['bets', 'betting'],
  burst: ['bursts', 'bursting'],
  cast: ['casts', 'casting'],
  cling: ['clings', 'clung', 'clinging'],
  creep: ['creeps', 'crept', 'creeping'],
  deal: ['deals', 'dealt', 'dealing'],
  flee: ['flees', 'fled', 'fleeing'],
  fling: ['flings', 'flung', 'flinging'],
  grind: ['grinds', 'ground', 'grinding'],
  leap: ['leaps', 'leapt', 'leaping'],
  sting: ['stings', 'stung', 'stinging'],
  stink: ['stinks', 'stank', 'stunk', 'stinking'],
  stride: ['strides', 'strode', 'stridden', 'striding'],
  weave: ['weaves', 'wove', 'woven', 'weaving'],
  wind: ['winds', 'wound', 'winding'],
  wring: ['wrings', 'wrung', 'wringing'],
};

const formToBase = new Map();
for (const [base, forms] of Object.entries(IRREGULAR_VERBS)) {
  formToBase.set(base, base);
  for (const form of forms) {
    formToBase.set(form, base);
  }
}

function getRegularForms(word) {
  const forms = [word];
  forms.push(word + 's');
  forms.push(word + 'es');
  forms.push(word + 'ed');
  if (word.endsWith('e')) forms.push(word + 'd');
  forms.push(word + 'ing');
  if (word.endsWith('e')) forms.push(word.slice(0, -1) + 'ing');
  const last = word[word.length - 1];
  const secondLast = word[word.length - 2];
  if (last && secondLast && 'bcdfghjklmnpqrstvwxyz'.includes(last) && 'aeiou'.includes(secondLast)) {
    forms.push(word + last + 'ing');
    forms.push(word + last + 'ed');
  }
  if (word.endsWith('y')) {
    const stem = word.slice(0, -1);
    forms.push(stem + 'ies');
    forms.push(stem + 'ied');
  }
  return forms;
}

function tokenMatches(sentenceToken, exprToken) {
  const st = sentenceToken.toLowerCase();
  const et = exprToken.toLowerCase();
  if (st === et) return true;

  const stBase = formToBase.get(st);
  const etBase = formToBase.get(et);
  if (stBase && etBase && stBase === etBase) return true;
  if (stBase && stBase === et) return true;
  if (etBase && etBase === st) return true;

  const regularForms = getRegularForms(et);
  if (regularForms.includes(st)) return true;

  // Contractions
  const contractions = {
    "i'm": ["i", "am"], "you're": ["you", "are"], "he's": ["he", "is"],
    "she's": ["she", "is"], "it's": ["it", "is"], "we're": ["we", "are"],
    "they're": ["they", "are"], "i've": ["i", "have"], "you've": ["you", "have"],
    "we've": ["we", "have"], "they've": ["they", "have"], "i'll": ["i", "will"],
    "you'll": ["you", "will"], "he'll": ["he", "will"], "she'll": ["she", "will"],
    "we'll": ["we", "will"], "they'll": ["they", "will"], "i'd": ["i", "would"],
    "you'd": ["you", "would"], "he'd": ["he", "would"], "she'd": ["she", "would"],
    "we'd": ["we", "would"], "they'd": ["they", "would"],
    "can't": ["can", "not"], "won't": ["will", "not"], "don't": ["do", "not"],
    "doesn't": ["does", "not"], "didn't": ["did", "not"], "isn't": ["is", "not"],
    "aren't": ["are", "not"], "wasn't": ["was", "not"], "weren't": ["were", "not"],
    "hasn't": ["has", "not"], "haven't": ["have", "not"], "hadn't": ["had", "not"],
    "wouldn't": ["would", "not"], "couldn't": ["could", "not"],
    "shouldn't": ["should", "not"],
    "gonna": ["going", "to"], "wanna": ["want", "to"], "gotta": ["got", "to"],
  };

  if (contractions[st]) {
    for (const expanded of contractions[st]) {
      if (expanded === et || formToBase.get(expanded) === et || formToBase.get(et) === expanded) return true;
    }
  }

  return false;
}

function findSurfaceForm(exprId, sentence) {
  const exprTokens = exprId.toLowerCase().split(/\s+/);
  const regex = /[\w']+/g;
  const wordMatches = [];
  let m;
  while ((m = regex.exec(sentence)) !== null) {
    wordMatches.push({ word: m[0], index: m.index });
  }
  if (wordMatches.length === 0) return null;

  for (let start = 0; start <= wordMatches.length - exprTokens.length; start++) {
    const matched = tryMatch(exprTokens, wordMatches, start);
    if (matched) {
      const firstWord = wordMatches[matched[0]];
      const lastWord = wordMatches[matched[matched.length - 1]];
      return sentence.slice(firstWord.index, lastWord.index + lastWord.word.length);
    }
  }
  return null;
}

function tryMatch(exprTokens, wordMatches, startIdx) {
  const indices = [];
  let wIdx = startIdx;

  for (let eIdx = 0; eIdx < exprTokens.length; eIdx++) {
    const et = exprTokens[eIdx];
    let found = false;
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

function findSurfaceFormExtended(exprId, sentence) {
  let result = findSurfaceForm(exprId, sentence);
  if (result) return result;

  // Hyphenated expressions
  if (exprId.includes('-')) {
    const exprNoDash = exprId.replace(/-/g, ' ');
    result = findSurfaceForm(exprNoDash, sentence);
    if (result) return result;

    const escaped = exprId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, 'i');
    const m = sentence.match(re);
    if (m) return m[0];
  }

  // Direct case-insensitive substring match as fallback
  const idx = sentence.toLowerCase().indexOf(exprId.toLowerCase());
  if (idx >= 0) return sentence.slice(idx, idx + exprId.length);

  return null;
}

// Main - process specified batches
const outDir = 'src/data/match-results-v3';
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const batchesToRun = process.argv.slice(2).map(Number);
if (batchesToRun.length === 0) {
  console.log('Usage: node run-all-surface-forms.mjs 0 1 2 4 5 7 8 9');
  process.exit(1);
}

for (const i of batchesToRun) {
  const inputPath = `/tmp/sf-batch-${i}.json`;
  const outputPath = `${outDir}/batch-${i}.json`;

  const input = JSON.parse(readFileSync(inputPath, 'utf-8'));
  let found = 0;
  let notFound = 0;

  const output = input.map(match => {
    const surfaceForm = findSurfaceFormExtended(match.exprId, match.en);
    if (surfaceForm) found++;
    else notFound++;
    return { ...match, surfaceForm };
  });

  writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Batch ${i}: ${output.length} total, ${found} found, ${notFound} null`);
}
