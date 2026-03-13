/**
 * Surface Form Finder v3
 * For each match {videoId, exprId, sentenceIdx, en, ko},
 * find the exact surface form of exprId in the `en` sentence.
 */
import fs from 'fs';
import path from 'path';

// ── Irregular verb table ──────────────────────────────────────────────────────
const IRREGULARS = {
  be: ['am', 'is', 'are', 'was', 'were', 'been', 'being'],
  beat: ['beat', 'beaten', 'beating', 'beats'],
  become: ['became', 'become', 'becoming', 'becomes'],
  begin: ['began', 'begun', 'beginning', 'begins'],
  blow: ['blew', 'blown', 'blowing', 'blows'],
  break: ['broke', 'broken', 'breaking', 'breaks'],
  bring: ['brought', 'bringing', 'brings'],
  build: ['built', 'building', 'builds'],
  burn: ['burnt', 'burned', 'burning', 'burns'],
  buy: ['bought', 'buying', 'buys'],
  catch: ['caught', 'catching', 'catches'],
  choose: ['chose', 'chosen', 'choosing', 'chooses'],
  come: ['came', 'come', 'coming', 'comes'],
  cost: ['cost', 'costing', 'costs'],
  cut: ['cut', 'cutting', 'cuts'],
  deal: ['dealt', 'dealing', 'deals'],
  do: ['did', 'done', 'doing', 'does'],
  draw: ['drew', 'drawn', 'drawing', 'draws'],
  dream: ['dreamt', 'dreamed', 'dreaming', 'dreams'],
  drink: ['drank', 'drunk', 'drinking', 'drinks'],
  drive: ['drove', 'driven', 'driving', 'drives'],
  eat: ['ate', 'eaten', 'eating', 'eats'],
  fall: ['fell', 'fallen', 'falling', 'falls'],
  feel: ['felt', 'feeling', 'feels'],
  fight: ['fought', 'fighting', 'fights'],
  find: ['found', 'finding', 'finds'],
  fly: ['flew', 'flown', 'flying', 'flies'],
  forget: ['forgot', 'forgotten', 'forgetting', 'forgets'],
  forgive: ['forgave', 'forgiven', 'forgiving', 'forgives'],
  freeze: ['froze', 'frozen', 'freezing', 'freezes'],
  get: ['got', 'gotten', 'getting', 'gets'],
  give: ['gave', 'given', 'giving', 'gives'],
  go: ['went', 'gone', 'going', 'goes'],
  grow: ['grew', 'grown', 'growing', 'grows'],
  hang: ['hung', 'hanging', 'hangs'],
  have: ['had', 'having', 'has'],
  hear: ['heard', 'hearing', 'hears'],
  hide: ['hid', 'hidden', 'hiding', 'hides'],
  hit: ['hit', 'hitting', 'hits'],
  hold: ['held', 'holding', 'holds'],
  hurt: ['hurt', 'hurting', 'hurts'],
  keep: ['kept', 'keeping', 'keeps'],
  know: ['knew', 'known', 'knowing', 'knows'],
  lay: ['laid', 'laying', 'lays'],
  lead: ['led', 'leading', 'leads'],
  leave: ['left', 'leaving', 'leaves'],
  lend: ['lent', 'lending', 'lends'],
  let: ['let', 'letting', 'lets'],
  lie: ['lay', 'lain', 'lying', 'lies'],
  lose: ['lost', 'losing', 'loses'],
  make: ['made', 'making', 'makes'],
  mean: ['meant', 'meaning', 'means'],
  meet: ['met', 'meeting', 'meets'],
  pay: ['paid', 'paying', 'pays'],
  put: ['put', 'putting', 'puts'],
  quit: ['quit', 'quitting', 'quits'],
  read: ['read', 'reading', 'reads'],
  ride: ['rode', 'ridden', 'riding', 'rides'],
  ring: ['rang', 'rung', 'ringing', 'rings'],
  rise: ['rose', 'risen', 'rising', 'rises'],
  run: ['ran', 'run', 'running', 'runs'],
  say: ['said', 'saying', 'says'],
  see: ['saw', 'seen', 'seeing', 'sees'],
  sell: ['sold', 'selling', 'sells'],
  send: ['sent', 'sending', 'sends'],
  set: ['set', 'setting', 'sets'],
  shake: ['shook', 'shaken', 'shaking', 'shakes'],
  show: ['showed', 'shown', 'showing', 'shows'],
  shut: ['shut', 'shutting', 'shuts'],
  sing: ['sang', 'sung', 'singing', 'sings'],
  sit: ['sat', 'sitting', 'sits'],
  sleep: ['slept', 'sleeping', 'sleeps'],
  speak: ['spoke', 'spoken', 'speaking', 'speaks'],
  spend: ['spent', 'spending', 'spends'],
  stand: ['stood', 'standing', 'stands'],
  steal: ['stole', 'stolen', 'stealing', 'steals'],
  stick: ['stuck', 'sticking', 'sticks'],
  stop: ['stopped', 'stopping', 'stops'],
  strike: ['struck', 'stricken', 'striking', 'strikes'],
  swear: ['swore', 'sworn', 'swearing', 'swears'],
  swim: ['swam', 'swum', 'swimming', 'swims'],
  swing: ['swung', 'swinging', 'swings'],
  take: ['took', 'taken', 'taking', 'takes'],
  teach: ['taught', 'teaching', 'teaches'],
  tear: ['tore', 'torn', 'tearing', 'tears'],
  tell: ['told', 'telling', 'tells'],
  think: ['thought', 'thinking', 'thinks'],
  throw: ['threw', 'thrown', 'throwing', 'throws'],
  understand: ['understood', 'understanding', 'understands'],
  wake: ['woke', 'woken', 'waking', 'wakes'],
  wear: ['wore', 'worn', 'wearing', 'wears'],
  win: ['won', 'winning', 'wins'],
  write: ['wrote', 'written', 'writing', 'writes'],
};

// Build reverse lookup: conjugated form → [base, ...]
const conjToBase = new Map();
for (const [base, forms] of Object.entries(IRREGULARS)) {
  for (const f of forms) {
    if (!conjToBase.has(f)) conjToBase.set(f, []);
    conjToBase.get(f).push(base);
  }
  if (!conjToBase.has(base)) conjToBase.set(base, []);
  conjToBase.get(base).push(base);
}

function getVariants(base) {
  const variants = new Set([base]);
  const irreg = IRREGULARS[base] || [];
  for (const f of irreg) variants.add(f);
  // regular conjugations
  if (base.endsWith('y') && !/[aeiou]y$/.test(base)) {
    variants.add(base.slice(0, -1) + 'ies');
    variants.add(base.slice(0, -1) + 'ied');
  } else if (/([sxzh]|ch|sh)$/.test(base)) {
    variants.add(base + 'es');
    variants.add(base + 'ed');
  } else {
    variants.add(base + 's');
    variants.add(base + 'ed');
  }
  if (base.endsWith('e') && !base.endsWith('ee')) {
    variants.add(base.slice(0, -1) + 'ing');
    variants.add(base + 'd');
  } else {
    variants.add(base + 'ing');
  }
  return [...variants];
}

// ── Contraction / colloquial expansion table ──────────────────────────────────
const COLLOQUIAL_EXPANSIONS = {
  "i'm": [["i", "am"], ["i", "m"]],
  "i'll": [["i", "will"], ["i", "ll"]],
  "i'd": [["i", "would"], ["i", "had"], ["i", "d"]],
  "i've": [["i", "have"], ["i", "ve"]],
  "you're": [["you", "are"], ["you", "re"]],
  "you'll": [["you", "will"], ["you", "ll"]],
  "you'd": [["you", "would"], ["you", "d"]],
  "you've": [["you", "have"], ["you", "ve"]],
  "we're": [["we", "are"], ["we", "re"]],
  "we'll": [["we", "will"], ["we", "ll"]],
  "we'd": [["we", "would"], ["we", "d"]],
  "we've": [["we", "have"], ["we", "ve"]],
  "they're": [["they", "are"], ["they", "re"]],
  "they'll": [["they", "will"], ["they", "ll"]],
  "it's": [["it", "is"], ["it", "s"]],
  "it'll": [["it", "will"], ["it", "ll"]],
  "that's": [["that", "is"], ["that", "s"]],
  "there's": [["there", "is"], ["there", "s"]],
  "here's": [["here", "is"], ["here", "s"]],
  "what's": [["what", "is"], ["what", "s"]],
  "who's": [["who", "is"], ["who", "s"]],
  "he's": [["he", "is"], ["he", "s"]],
  "she's": [["she", "is"], ["she", "s"]],
  "can't": [["can", "not"], ["cannot"]],
  "won't": [["will", "not"]],
  "don't": [["do", "not"]],
  "doesn't": [["does", "not"]],
  "didn't": [["did", "not"]],
  "isn't": [["is", "not"]],
  "aren't": [["are", "not"]],
  "wasn't": [["was", "not"]],
  "weren't": [["were", "not"]],
  "haven't": [["have", "not"]],
  "hasn't": [["has", "not"]],
  "hadn't": [["had", "not"]],
  "wouldn't": [["would", "not"]],
  "shouldn't": [["should", "not"]],
  "couldn't": [["could", "not"]],
  "mustn't": [["must", "not"]],
  "let's": [["let", "us"]],
  // colloquial forms
  "gonna": [["going", "to"], ["go", "to"]],
  "gotta": [["got", "to"], ["have", "to"], ["got", "a"], ["gotta"]],
  "wanna": [["want", "to"]],
  "kinda": [["kind", "of"]],
  "sorta": [["sort", "of"]],
  "hafta": [["have", "to"]],
  "lemme": [["let", "me"]],
  "gimme": [["give", "me"]],
  "tryna": [["trying", "to"]],
  "shoulda": [["should", "have"]],
  "coulda": [["could", "have"]],
  "woulda": [["would", "have"]],
};

// ── Filler words allowed in gaps ──────────────────────────────────────────────
const FILLER_WORDS = new Set([
  'a', 'an', 'the', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those', 'some', 'any',
  'i', 'me', 'you', 'he', 'him', 'she', 'it', 'we', 'us', 'they', 'them',
  'not', 'just', 'only', 'even', 'still', 'really', 'very', 'quite', 'so',
  'too', 'also', 'already', 'always', 'never', 'ever', 'yet', 'again',
  'up', 'down', 'out', 'off', 'away', 'back', 'around', 'together', 'over',
  'to', 'of', 'in', 'at', 'by', 'on', 'with', 'for', 'as',
  "n't", 'all', 'each', 'every', 'own', 'same', 'such',
]);

function isFillerWord(w) {
  return FILLER_WORDS.has(w.toLowerCase());
}

// ── Pronoun substitution ──────────────────────────────────────────────────────
const PRONOUNS = new Set(["i", "you", "he", "she", "we", "they"]);

function isPronounVariant(a, b) {
  return PRONOUNS.has(a.toLowerCase()) && PRONOUNS.has(b.toLowerCase());
}

// ── Get all surface variants of an expression word ────────────────────────────
function wordVariants(w) {
  const vars = new Set([w]);
  const bases = conjToBase.get(w) || [];
  for (const base of bases) {
    for (const v of getVariants(base)) vars.add(v);
  }
  for (const v of getVariants(w)) vars.add(v);
  return vars;
}

// ── Tokenize ──────────────────────────────────────────────────────────────────
function tokenize(text) {
  const tokens = [];
  const re = /[a-zA-Z][a-zA-Z']*/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    tokens.push({
      word: m[0].toLowerCase(),
      original: m[0],
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return tokens;
}

// ── Expand expression words ───────────────────────────────────────────────────
function expandExprWords(words) {
  let sequences = [[]];

  for (const w of words) {
    const expansions = COLLOQUIAL_EXPANSIONS[w];
    if (expansions) {
      const newSequences = [];
      for (const seq of sequences) {
        // Keep as single word
        newSequences.push([...seq, new Set([w, ...wordVariants(w)])]);
        // Expand into multiple words
        for (const exp of expansions) {
          const expanded = [...seq, ...exp.map(ew => new Set([ew, ...wordVariants(ew)]))];
          newSequences.push(expanded);
        }
      }
      sequences = newSequences;
    } else {
      for (const seq of sequences) {
        seq.push(wordVariants(w));
      }
    }
  }

  return sequences;
}

// ── Try to match a word sequence in tokens ────────────────────────────────────
function tryMatchSequence(seq, tokens, maxGap, pronounFlex) {
  if (seq.length === 0) return null;

  function tokMatches(tok, wordSet) {
    const w = tok.word;
    if (wordSet.has(w)) return true;
    // Strip possessive 's or trailing contraction (mother's → mother)
    const stripped = w.replace(/'s$/, '').replace(/'[a-z]+$/, '');
    if (stripped !== w && wordSet.has(stripped)) return true;
    if (pronounFlex && PRONOUNS.has(w)) {
      for (const sw of wordSet) {
        if (PRONOUNS.has(sw)) return true;
      }
    }
    return false;
  }

  const limit = tokens.length - seq.length;
  for (let startTi = 0; startTi <= limit; startTi++) {
    if (!tokMatches(tokens[startTi], seq[0])) continue;
    if (seq.length === 1) return { startTok: startTi, endTok: startTi + 1 };

    const positions = [startTi];
    let curTi = startTi;
    let failed = false;

    for (let wi = 1; wi < seq.length; wi++) {
      let found = false;
      const searchEnd = Math.min(tokens.length, curTi + 1 + maxGap + 1);
      for (let checkTi = curTi + 1; checkTi < searchEnd; checkTi++) {
        // Verify gap contains only filler words
        if (checkTi > curTi + 1) {
          let gapOk = true;
          for (let gi = curTi + 1; gi < checkTi; gi++) {
            if (!isFillerWord(tokens[gi].word)) { gapOk = false; break; }
          }
          if (!gapOk) continue;
        }
        if (tokMatches(tokens[checkTi], seq[wi])) {
          positions.push(checkTi);
          curTi = checkTi;
          found = true;
          break;
        }
      }
      if (!found) { failed = true; break; }
    }

    if (!failed) {
      return { startTok: positions[0], endTok: positions[positions.length - 1] + 1 };
    }
  }

  return null;
}

// ── Main surface form finder ──────────────────────────────────────────────────
function findSurfaceForm(exprId, sentence) {
  if (!sentence || !exprId) return null;

  const rawWords = exprId.toLowerCase().match(/[a-z']+/g) || [];
  if (rawWords.length === 0) return null;

  const tokens = tokenize(sentence);
  if (tokens.length === 0) return null;

  const sequences = expandExprWords(rawWords);

  // Try strict first (no gap), then with increasing gap
  for (const maxGap of [0, 1, 2, 3]) {
    for (const pronounFlex of [false, true]) {
      for (const seq of sequences) {
        const result = tryMatchSequence(seq, tokens, maxGap, pronounFlex);
        if (result) {
          const startChar = tokens[result.startTok].start;
          const endChar = tokens[result.endTok - 1].end;
          return sentence.slice(startChar, endChar);
        }
      }
    }
  }

  return null;
}

// ── Entry point ───────────────────────────────────────────────────────────────
const inputPath = '/tmp/sf-batch-0.json';
const outputDir = 'C:/Users/hyunj/studyeng/src/data/match-results-v3';
const outputPath = path.join(outputDir, 'batch-0.json');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
let found = 0;
let notFound = 0;

const output = input.map(item => {
  const sf = findSurfaceForm(item.exprId, item.en);
  if (sf !== null) found++;
  else notFound++;
  return { ...item, surfaceForm: sf };
});

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`Total matches: ${output.length}`);
console.log(`surfaceForm found: ${found}`);
console.log(`surfaceForm null: ${notFound}`);
console.log(`Coverage: ${((found / output.length) * 100).toFixed(1)}%`);
console.log(`Output: ${outputPath}`);

// Show some null examples
const nullSamples = output.filter(x => x.surfaceForm === null).slice(0, 10);
console.log('\n--- NULL samples (first 10) ---');
for (const s of nullSamples) {
  console.log(`  exprId: "${s.exprId}" | en: "${s.en?.slice(0, 80)}"`);
}

// Show some found examples
const foundSamples = output.filter(x => x.surfaceForm !== null).slice(0, 15);
console.log('\n--- FOUND samples (first 15) ---');
for (const s of foundSamples) {
  console.log(`  exprId: "${s.exprId}" → sf: "${s.surfaceForm}" | en: "${s.en?.slice(0, 60)}"`);
}

// Quality check: flag wide matches
const wide = output.filter(x => {
  if (!x.surfaceForm) return false;
  const exprWC = (x.exprId.match(/[a-z']+/gi) || []).length;
  const sfWC = (x.surfaceForm.match(/[a-z']+/gi) || []).length;
  return sfWC - exprWC > 3;
});
if (wide.length > 0) {
  console.log(`\n--- Wide matches (>3 extra words): ${wide.length} ---`);
  for (const w of wide) {
    console.log(`  exprId: "${w.exprId}" → sf: "${w.surfaceForm}"`);
  }
}
