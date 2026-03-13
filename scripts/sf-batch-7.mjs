/**
 * Surface Form Finder - Batch 7
 * Builds input from match-results/batch-7.json + transcript-fix-batches/batch-7.json,
 * then finds surfaceForm for each match.
 */
import fs from 'fs';
import path from 'path';

const matchDir = 'C:/Users/hyunj/studyeng/src/data/match-results';
const transFixDir = 'C:/Users/hyunj/studyeng/src/data/transcript-fix-batches';
const outputDir = 'C:/Users/hyunj/studyeng/src/data/match-results-v3';

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

// Build reverse lookup: conjugated form → base
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
  if (!IRREGULARS[base]) {
    if (base.endsWith('y') && !/[aeiou]y$/.test(base)) {
      variants.add(base.slice(0, -1) + 'ies');
    } else if (/[sxzh]$/.test(base) || base.endsWith('ch') || base.endsWith('sh')) {
      variants.add(base + 'es');
    } else {
      variants.add(base + 's');
    }
    if (base.endsWith('e')) {
      variants.add(base + 'd');
    } else if (base.endsWith('y') && !/[aeiou]y$/.test(base)) {
      variants.add(base.slice(0, -1) + 'ied');
    } else {
      variants.add(base + 'ed');
    }
    if (base.endsWith('e') && !base.endsWith('ee')) {
      variants.add(base.slice(0, -1) + 'ing');
    } else {
      variants.add(base + 'ing');
    }
  }
  return [...variants];
}

function tokenize(text) {
  const tokens = [];
  const re = /[a-zA-Z']+/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ word: m[0].toLowerCase(), original: m[0], start: m.index, end: m.index + m[0].length });
  }
  return tokens;
}

function exprWords(exprId) {
  return exprId.toLowerCase().match(/[a-zA-Z']+/g) || [];
}

function findSurfaceForm(exprId, sentence) {
  if (!sentence || !exprId) return null;

  const words = exprWords(exprId);
  if (words.length === 0) return null;

  const tokens = tokenize(sentence);
  if (tokens.length === 0) return null;

  function wordVariants(w) {
    const vars = new Set([w]);
    const bases = conjToBase.get(w) || [];
    for (const base of bases) {
      for (const v of getVariants(base)) vars.add(v);
    }
    for (const v of getVariants(w)) vars.add(v);
    return vars;
  }

  // Strategy 1: strict sequential match (no gaps, allow verb conjugation)
  for (let ti = 0; ti < tokens.length; ti++) {
    const w0 = words[0];
    const tok = tokens[ti];
    const vars0 = wordVariants(w0);
    if (!vars0.has(tok.word) && !vars0.has(tok.word.replace(/\u2019/g, "'"))) continue;

    if (words.length === 1) {
      return tok.original;
    }

    let matched = true;
    let endTi = ti;
    for (let wi = 1; wi < words.length; wi++) {
      const nextTi = endTi + 1;
      if (nextTi >= tokens.length) { matched = false; break; }
      const nextTok = tokens[nextTi];
      const wI = words[wi];
      const varsI = wordVariants(wI);
      if (!varsI.has(nextTok.word) && !varsI.has(nextTok.word.replace(/\u2019/g, "'"))) {
        matched = false;
        break;
      }
      endTi = nextTi;
    }
    if (matched) {
      const startChar = tokens[ti].start;
      const endChar = tokens[endTi].end;
      return sentence.slice(startChar, endChar);
    }
  }

  // Strategy 2: allow 1-3 filler words between tokens (for "tear apart" → "tear you apart")
  for (const maxGap of [1, 2, 3]) {
    for (let ti = 0; ti < tokens.length; ti++) {
      const w0 = words[0];
      const tok = tokens[ti];
      const vars0 = wordVariants(w0);
      if (!vars0.has(tok.word) && !vars0.has(tok.word.replace(/\u2019/g, "'"))) continue;

      if (words.length === 1) {
        return tok.original;
      }

      let matched = true;
      let positions = [ti];
      let curTi = ti;

      for (let wi = 1; wi < words.length; wi++) {
        const wI = words[wi];
        const varsI = wordVariants(wI);
        let found = false;
        for (let gap = 1; gap <= maxGap + 1; gap++) {
          const checkTi = curTi + gap;
          if (checkTi >= tokens.length) break;
          const checkTok = tokens[checkTi];
          if (varsI.has(checkTok.word) || varsI.has(checkTok.word.replace(/\u2019/g, "'"))) {
            positions.push(checkTi);
            curTi = checkTi;
            found = true;
            break;
          }
        }
        if (!found) { matched = false; break; }
      }

      if (matched) {
        const startChar = tokens[positions[0]].start;
        const endChar = tokens[positions[positions.length - 1]].end;
        return sentence.slice(startChar, endChar);
      }
    }
  }

  return null;
}

// ── Step 1: Build input from match-results/batch-7 + transcript-fix-batches/batch-7 ──
const matches = JSON.parse(fs.readFileSync(path.join(matchDir, 'batch-7.json'), 'utf8'));
const fixTrans = JSON.parse(fs.readFileSync(path.join(transFixDir, 'batch-7.json'), 'utf8'));

const input = [];
for (const [videoId, vidMatches] of Object.entries(matches)) {
  const fixVid = fixTrans[videoId] || [];
  for (const m of vidMatches) {
    const sent = fixVid[m.sentenceIdx];
    if (!sent) continue;
    input.push({
      videoId,
      exprId: m.canonical,
      sentenceIdx: m.sentenceIdx,
      en: sent.en || null,
      ko: sent.ko || null
    });
  }
}

console.log(`Built input: ${input.length} matches`);

// ── Step 2: Find surface forms ────────────────────────────────────────────────
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let found = 0;
let notFound = 0;

const output = input.map(item => {
  const sf = findSurfaceForm(item.exprId, item.en);
  if (sf !== null) found++;
  else notFound++;
  return { ...item, surfaceForm: sf };
});

const outputPath = path.join(outputDir, 'batch-7.json');
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\nTotal matches: ${output.length}`);
console.log(`surfaceForm found: ${found}`);
console.log(`surfaceForm null: ${notFound}`);
console.log(`Coverage: ${((found / output.length) * 100).toFixed(1)}%`);
console.log(`Output: ${outputPath}`);

// Show some null samples
const nullSamples = output.filter(x => x.surfaceForm === null).slice(0, 10);
console.log('\n--- NULL samples (first 10) ---');
for (const s of nullSamples) {
  console.log(`  exprId: "${s.exprId}" | en: "${s.en?.slice(0, 80)}"`);
}

const foundSamples = output.filter(x => x.surfaceForm !== null).slice(0, 10);
console.log('\n--- FOUND samples (first 10) ---');
for (const s of foundSamples) {
  console.log(`  exprId: "${s.exprId}" -> surfaceForm: "${s.surfaceForm}" | en: "${s.en?.slice(0, 60)}"`);
}
