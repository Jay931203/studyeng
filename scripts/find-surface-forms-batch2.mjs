/**
 * surfaceForm finder for match-results-v3/batch-3.json → batch-2.json
 * Handles verb conjugations, particle insertions, and case-preservation.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ──────────────────────────────────────────────
// 1. Irregular verb table
// ──────────────────────────────────────────────
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
  keep: ['keeps', 'kept', 'keeping'],
  put: ['puts', 'putting'],
  bring: ['brings', 'brought', 'bringing'],
  run: ['runs', 'ran', 'running'],
  hold: ['holds', 'held', 'holding'],
  feel: ['feels', 'felt', 'feeling'],
  leave: ['leaves', 'left', 'leaving'],
  mean: ['means', 'meant', 'meaning'],
  let: ['lets', 'letting'],
  set: ['sets', 'setting'],
  hit: ['hits', 'hitting'],
  cut: ['cuts', 'cutting'],
  sit: ['sits', 'sat', 'sitting'],
  stand: ['stands', 'stood', 'standing'],
  lose: ['loses', 'lost', 'losing'],
  fall: ['falls', 'fell', 'fallen', 'falling'],
  pay: ['pays', 'paid', 'paying'],
  meet: ['meets', 'met', 'meeting'],
  send: ['sends', 'sent', 'sending'],
  build: ['builds', 'built', 'building'],
  spend: ['spends', 'spent', 'spending'],
  grow: ['grows', 'grew', 'grown', 'growing'],
  break: ['breaks', 'broke', 'broken', 'breaking'],
  wear: ['wears', 'wore', 'worn', 'wearing'],
  show: ['shows', 'showed', 'shown', 'showing'],
  read: ['reads', 'reading'], // past = read (same spelling)
  begin: ['begins', 'began', 'begun', 'beginning'],
  write: ['writes', 'wrote', 'written', 'writing'],
  drive: ['drives', 'drove', 'driven', 'driving'],
  ride: ['rides', 'rode', 'ridden', 'riding'],
  rise: ['rises', 'rose', 'risen', 'rising'],
  speak: ['speaks', 'spoke', 'spoken', 'speaking'],
  choose: ['chooses', 'chose', 'chosen', 'choosing'],
  catch: ['catches', 'caught', 'catching'],
  buy: ['buys', 'bought', 'buying'],
  sell: ['sells', 'sold', 'selling'],
  teach: ['teaches', 'taught', 'teaching'],
  win: ['wins', 'won', 'winning'],
  fight: ['fights', 'fought', 'fighting'],
  throw: ['throws', 'threw', 'thrown', 'throwing'],
  fly: ['flies', 'flew', 'flown', 'flying'],
  draw: ['draws', 'drew', 'drawn', 'drawing'],
  eat: ['eats', 'ate', 'eaten', 'eating'],
  drink: ['drinks', 'drank', 'drunk', 'drinking'],
  wake: ['wakes', 'woke', 'woken', 'waking'],
  shake: ['shakes', 'shook', 'shaken', 'shaking'],
  forget: ['forgets', 'forgot', 'forgotten', 'forgetting'],
  forgive: ['forgives', 'forgave', 'forgiven', 'forgiving'],
  hide: ['hides', 'hid', 'hidden', 'hiding'],
  lay: ['lays', 'laid', 'laying'],
  lie: ['lies', 'lay', 'lain', 'lying'],
  lead: ['leads', 'led', 'leading'],
  steal: ['steals', 'stole', 'stolen', 'stealing'],
  deal: ['deals', 'dealt', 'dealing'],
  hear: ['hears', 'heard', 'hearing'],
  hold: ['holds', 'held', 'holding'],
  lend: ['lends', 'lent', 'lending'],
  spend: ['spends', 'spent', 'spending'],
  understand: ['understands', 'understood', 'understanding'],
  stand: ['stands', 'stood', 'standing'],
  tear: ['tears', 'tore', 'torn', 'tearing'],
  wear: ['wears', 'wore', 'worn', 'wearing'],
  swear: ['swears', 'swore', 'sworn', 'swearing'],
  bear: ['bears', 'bore', 'borne', 'bearing'],
  care: ['cares', 'cared', 'caring'],
  dare: ['dares', 'dared', 'daring'],
  share: ['shares', 'shared', 'sharing'],
  stare: ['stares', 'stared', 'staring'],
  compare: ['compares', 'compared', 'comparing'],
  prepare: ['prepares', 'prepared', 'preparing'],
  turn: ['turns', 'turned', 'turning'],
  look: ['looks', 'looked', 'looking'],
  use: ['uses', 'used', 'using'],
  try: ['tries', 'tried', 'trying'],
  call: ['calls', 'called', 'calling'],
  ask: ['asks', 'asked', 'asking'],
  need: ['needs', 'needed', 'needing'],
  seem: ['seems', 'seemed', 'seeming'],
  help: ['helps', 'helped', 'helping'],
  talk: ['talks', 'talked', 'talking'],
  start: ['starts', 'started', 'starting'],
  show: ['shows', 'showed', 'shown', 'showing'],
  live: ['lives', 'lived', 'living'],
  play: ['plays', 'played', 'playing'],
  move: ['moves', 'moved', 'moving'],
  like: ['likes', 'liked', 'liking'],
  work: ['works', 'worked', 'working'],
  end: ['ends', 'ended', 'ending'],
  open: ['opens', 'opened', 'opening'],
  close: ['closes', 'closed', 'closing'],
  wait: ['waits', 'waited', 'waiting'],
  point: ['points', 'pointed', 'pointing'],
  pull: ['pulls', 'pulled', 'pulling'],
  push: ['pushes', 'pushed', 'pushing'],
  walk: ['walks', 'walked', 'walking'],
  follow: ['follows', 'followed', 'following'],
  stop: ['stops', 'stopped', 'stopping'],
  pass: ['passes', 'passed', 'passing'],
  pick: ['picks', 'picked', 'picking'],
  add: ['adds', 'added', 'adding'],
  check: ['checks', 'checked', 'checking'],
  change: ['changes', 'changed', 'changing'],
  allow: ['allows', 'allowed', 'allowing'],
  agree: ['agrees', 'agreed', 'agreeing'],
  believe: ['believes', 'believed', 'believing'],
  carry: ['carries', 'carried', 'carrying'],
  cover: ['covers', 'covered', 'covering'],
  count: ['counts', 'counted', 'counting'],
  reach: ['reaches', 'reached', 'reaching'],
  raise: ['raises', 'raised', 'raising'],
  remove: ['removes', 'removed', 'removing'],
  offer: ['offers', 'offered', 'offering'],
  remember: ['remembers', 'remembered', 'remembering'],
  love: ['loves', 'loved', 'loving'],
  miss: ['misses', 'missed', 'missing'],
  include: ['includes', 'included', 'including'],
  continue: ['continues', 'continued', 'continuing'],
  expect: ['expects', 'expected', 'expecting'],
  want: ['wants', 'wanted', 'wanting'],
  watch: ['watches', 'watched', 'watching'],
  realize: ['realizes', 'realized', 'realizing'],
  become: ['becomes', 'became', 'becoming'],
  happen: ['happens', 'happened', 'happening'],
  decide: ['decides', 'decided', 'deciding'],
  support: ['supports', 'supported', 'supporting'],
  stay: ['stays', 'stayed', 'staying'],
  create: ['creates', 'created', 'creating'],
  learn: ['learns', 'learned', 'learning'],
  receive: ['receives', 'received', 'receiving'],
  remain: ['remains', 'remained', 'remaining'],
  suggest: ['suggests', 'suggested', 'suggesting'],
  assume: ['assumes', 'assumed', 'assuming'],
  prove: ['proves', 'proved', 'proven', 'proving'],
  represent: ['represents', 'represented', 'representing'],
  accept: ['accepts', 'accepted', 'accepting'],
  consider: ['considers', 'considered', 'considering'],
  appear: ['appears', 'appeared', 'appearing'],
  develop: ['develops', 'developed', 'developing'],
  produce: ['produces', 'produced', 'producing'],
  involve: ['involves', 'involved', 'involving'],
  apply: ['applies', 'applied', 'applying'],
  manage: ['manages', 'managed', 'managing'],
  provide: ['provides', 'provided', 'providing'],
  reduce: ['reduces', 'reduced', 'reducing'],
  increase: ['increases', 'increased', 'increasing'],
  improve: ['improves', 'improved', 'improving'],
  prevent: ['prevents', 'prevented', 'preventing'],
  protect: ['protects', 'protected', 'protecting'],
  replace: ['replaces', 'replaced', 'replacing'],
  maintain: ['maintains', 'maintained', 'maintaining'],
  save: ['saves', 'saved', 'saving'],
  serve: ['serves', 'served', 'serving'],
  complete: ['completes', 'completed', 'completing'],
  achieve: ['achieves', 'achieved', 'achieving'],
  connect: ['connects', 'connected', 'connecting'],
  collect: ['collects', 'collected', 'collecting'],
  treat: ['treats', 'treated', 'treating'],
  imagine: ['imagines', 'imagined', 'imagining'],
  trust: ['trusts', 'trusted', 'trusting'],
  avoid: ['avoids', 'avoided', 'avoiding'],
  fail: ['fails', 'failed', 'failing'],
  notice: ['notices', 'noticed', 'noticing'],
  prepare: ['prepares', 'prepared', 'preparing'],
  respond: ['responds', 'responded', 'responding'],
  satisfy: ['satisfies', 'satisfied', 'satisfying'],
  suffer: ['suffers', 'suffered', 'suffering'],
  survive: ['survives', 'survived', 'surviving'],
  choose: ['chooses', 'chose', 'chosen', 'choosing'],
  force: ['forces', 'forced', 'forcing'],
  refuse: ['refuses', 'refused', 'refusing'],
  respect: ['respects', 'respected', 'respecting'],
  require: ['requires', 'required', 'requiring'],
  risk: ['risks', 'risked', 'risking'],
  reach: ['reaches', 'reached', 'reaching'],
  identify: ['identifies', 'identified', 'identifying'],
  describe: ['describes', 'described', 'describing'],
  determine: ['determines', 'determined', 'determining'],
  establish: ['establishes', 'established', 'establishing'],
  examine: ['examines', 'examined', 'examining'],
  fix: ['fixes', 'fixed', 'fixing'],
  focus: ['focuses', 'focused', 'focusing'],
  follow: ['follows', 'followed', 'following'],
  generate: ['generates', 'generated', 'generating'],
  intend: ['intends', 'intended', 'intending'],
  introduce: ['introduces', 'introduced', 'introducing'],
  involve: ['involves', 'involved', 'involving'],
  mention: ['mentions', 'mentioned', 'mentioning'],
  obtain: ['obtains', 'obtained', 'obtaining'],
  perform: ['performs', 'performed', 'performing'],
  possess: ['possesses', 'possessed', 'possessing'],
  realize: ['realizes', 'realized', 'realizing'],
  recognize: ['recognizes', 'recognized', 'recognizing'],
  relate: ['relates', 'related', 'relating'],
  release: ['releases', 'released', 'releasing'],
  reveal: ['reveals', 'revealed', 'revealing'],
  support: ['supports', 'supported', 'supporting'],
  transfer: ['transfers', 'transferred', 'transferring'],
  understand: ['understands', 'understood', 'understanding'],
  vary: ['varies', 'varied', 'varying'],
};

// Build reverse map: form → [base forms]
const formToBase = new Map();
for (const [base, forms] of Object.entries(IRREGULAR_VERBS)) {
  for (const form of forms) {
    if (!formToBase.has(form)) formToBase.set(form, []);
    formToBase.get(form).push(base);
  }
  // base itself maps to itself
  if (!formToBase.has(base)) formToBase.set(base, []);
  formToBase.get(base).push(base);
}

// ──────────────────────────────────────────────
// 2. Regular verb conjugation
// ──────────────────────────────────────────────
function regularForms(base) {
  const forms = [base];
  // 3rd person singular
  if (base.endsWith('o') || base.endsWith('s') || base.endsWith('x') ||
      base.endsWith('z') || base.endsWith('ch') || base.endsWith('sh')) {
    forms.push(base + 'es');
  } else if (base.endsWith('y') && !/[aeiou]y$/.test(base)) {
    forms.push(base.slice(0, -1) + 'ies');
  } else {
    forms.push(base + 's');
  }
  // past / past participle
  if (base.endsWith('e')) {
    forms.push(base + 'd');
    forms.push(base.slice(0, -1) + 'ing');
  } else if (base.endsWith('y') && !/[aeiou]y$/.test(base)) {
    forms.push(base.slice(0, -1) + 'ied');
    forms.push(base + 'ing');
  } else {
    // Double consonant check (simple heuristic: ends in CVC with single vowel)
    const doubled = /[^aeiou][aeiou][^aeiouwxy]$/.test(base);
    forms.push(base + 'ed');
    forms.push(base + 'ing');
    if (doubled) {
      forms.push(base + base.slice(-1) + 'ed');
      forms.push(base + base.slice(-1) + 'ing');
    }
  }
  return forms;
}

// Given a word, return all possible base forms it could be
function possibleBases(word) {
  const w = word.toLowerCase();
  const bases = new Set();

  // From irregular table
  if (formToBase.has(w)) {
    for (const b of formToBase.get(w)) bases.add(b);
  }

  // Simple regular endings
  bases.add(w); // identity
  if (w.endsWith('ing')) {
    bases.add(w.slice(0, -3));         // walking → walk
    bases.add(w.slice(0, -3) + 'e');  // making → make
    if (w.length > 4 && w[w.length-4] === w[w.length-3]) {
      bases.add(w.slice(0, -4));       // running → run
    }
  }
  if (w.endsWith('ed')) {
    bases.add(w.slice(0, -2));         // walked → walk  (if base ends in e, walked→walke)
    bases.add(w.slice(0, -1));         // liked → like (already has e)
    bases.add(w.slice(0, -2) + 'e');  // used → use
    if (w.length > 3 && w[w.length-3] === w[w.length-4]) {
      bases.add(w.slice(0, -3));       // stopped → stop
    }
  }
  if (w.endsWith('ies')) bases.add(w.slice(0, -3) + 'y');   // tries → try
  if (w.endsWith('ied')) bases.add(w.slice(0, -3) + 'y');   // tried → try
  if (w.endsWith('es')) bases.add(w.slice(0, -2));           // watches → watch
  if (w.endsWith('s') && !w.endsWith('ss')) bases.add(w.slice(0, -1));  // runs → run

  return bases;
}

// ──────────────────────────────────────────────
// 3. Core matching logic
// ──────────────────────────────────────────────

/**
 * Try to find the surfaceForm of exprId in the sentence en.
 * Returns the actual matched text (preserving original case) or null.
 */
function findSurfaceForm(exprId, en) {
  const exprTokens = exprId.trim().toLowerCase().split(/\s+/);
  const enLower = en.toLowerCase();

  // Strategy 1: Direct substring match (case-insensitive)
  const directIdx = enLower.indexOf(exprId.toLowerCase());
  if (directIdx !== -1) {
    return en.slice(directIdx, directIdx + exprId.length);
  }

  // Strategy 2: Word boundary search for direct match
  const directRe = new RegExp(
    exprTokens.map(t => escapeRegex(t)).join('[\\s\\-\']+'),
    'i'
  );
  const directMatch = en.match(directRe);
  if (directMatch) return directMatch[0];

  // Strategy 3: Conjugated verb forms
  // For each exprToken that is a verb, try all conjugated forms.
  // We try to match the full expression with verb conjugation in the text.
  const result = tryConjugatedMatch(exprTokens, en);
  if (result) return result;

  // Strategy 4: Particle-insertion (phrasal verbs like "tear apart" → "tear you apart")
  // Allow up to 5 words inserted between first and last token
  const insertResult = tryInsertionMatch(exprTokens, en);
  if (insertResult) return insertResult;

  return null;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tryConjugatedMatch(exprTokens, en) {
  // Try replacing each token with possible conjugated forms
  // For efficiency, only try replacing the first verb-like token
  const tokenVariants = exprTokens.map((token, idx) => {
    const bases = possibleBases(token);
    const variants = new Set([token]);
    for (const base of bases) {
      // Add direct irregular forms
      if (IRREGULAR_VERBS[base]) {
        for (const f of IRREGULAR_VERBS[base]) variants.add(f);
      }
      // Add regular forms
      for (const f of regularForms(base)) variants.add(f);
    }
    return [...variants];
  });

  // Build a regex that tries all combinations (product), but limit to first verb replacement
  // to avoid combinatorial explosion
  // Strategy: try replacing token[0] with its variants, keep rest literal
  for (let i = 0; i < exprTokens.length; i++) {
    for (const variant of tokenVariants[i]) {
      const parts = [...exprTokens];
      parts[i] = variant;
      const re = new RegExp(
        parts.map(t => escapeRegex(t)).join('[\\s\\-\']+'),
        'i'
      );
      const m = en.match(re);
      if (m) return m[0];
    }
  }
  return null;
}

function tryInsertionMatch(exprTokens, en) {
  if (exprTokens.length < 2) return null;

  // Build a regex with optional word group between each pair of adjacent tokens
  // Allow up to 6 words inserted
  const WORD_PAT = '[\\w\'\\-]+';
  const INSERT_PAT = `(?:\\s+${WORD_PAT}){0,6}`;

  // For phrasal verbs: pattern = token[0] ... token[-1], allowing insertions
  // Also conjugate the first verb
  const firstToken = exprTokens[0];
  const firstBases = possibleBases(firstToken);
  const firstVariants = new Set([firstToken]);
  for (const base of firstBases) {
    if (IRREGULAR_VERBS[base]) {
      for (const f of IRREGULAR_VERBS[base]) firstVariants.add(f);
    }
    for (const f of regularForms(base)) firstVariants.add(f);
  }

  for (const variant of firstVariants) {
    const parts = [variant, ...exprTokens.slice(1)];
    // Insert pattern between consecutive tokens
    const pattern = parts.map(t => escapeRegex(t)).join(`\\s+(?:${WORD_PAT}\\s+){0,5}`);
    const re = new RegExp(pattern, 'i');
    const m = en.match(re);
    if (m) return m[0];
  }
  return null;
}

// ──────────────────────────────────────────────
// 4. Main
// ──────────────────────────────────────────────

const INPUT_PATH = 'C:/Users/hyunj/studyeng/src/data/match-results-v3/batch-3.json';
const OUTPUT_PATH = 'C:/Users/hyunj/studyeng/src/data/match-results-v3/batch-2.json';

const matches = JSON.parse(readFileSync(INPUT_PATH, 'utf8'));
console.log(`Processing ${matches.length} matches...`);

let found = 0;
let nullCount = 0;

const results = matches.map((item) => {
  const { exprId, en } = item;
  const sf = findSurfaceForm(exprId, en);

  if (sf !== null) {
    found++;
  } else {
    nullCount++;
  }

  return { ...item, surfaceForm: sf };
});

// Ensure output directory exists
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2), 'utf8');

console.log(`\nDone.`);
console.log(`Total: ${matches.length}`);
console.log(`surfaceForm found: ${found}`);
console.log(`surfaceForm null: ${nullCount}`);

// Show some null examples
const nullExamples = results.filter(x => x.surfaceForm === null).slice(0, 10);
if (nullExamples.length > 0) {
  console.log('\nNull examples:');
  nullExamples.forEach(x => console.log(`  exprId="${x.exprId}" | en="${x.en}"`));
}

// Show some fixed examples (where surfaceForm changed from original)
const improved = results.filter(x => x.surfaceForm && x.surfaceForm !== x.en && x.surfaceForm.toLowerCase() !== x.exprId.toLowerCase());
console.log(`\nImproved matches (not simple direct): ${improved.length}`);
improved.slice(0, 10).forEach(x => console.log(`  exprId="${x.exprId}" | sf="${x.surfaceForm}"`));
