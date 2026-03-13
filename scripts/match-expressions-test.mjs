import fs from 'fs';
import path from 'path';

// ---- SETUP ----
const dict = JSON.parse(fs.readFileSync('src/data/expression-dictionary-v2.json', 'utf8'));
const transcript = JSON.parse(fs.readFileSync('public/transcripts/2swCX5-GE9E.json', 'utf8'));

const canonicals = dict.map(e => e.canonical);

// ---- LEMMATIZATION HELPERS ----
const irregularVerbs = {
  drove: 'drive', driven: 'drive',
  came: 'come',
  went: 'go', gone: 'go',
  saw: 'see', seen: 'see',
  took: 'take', taken: 'take',
  made: 'make',
  had: 'have',
  got: 'get', gotten: 'get',
  said: 'say',
  knew: 'know', known: 'know',
  thought: 'think',
  told: 'tell',
  found: 'find',
  gave: 'give', given: 'give',
  put: 'put',
  felt: 'feel',
  left: 'leave',
  kept: 'keep',
  broke: 'break', broken: 'break',
  brought: 'bring',
  heard: 'hear',
  meant: 'mean',
  became: 'become',
  held: 'hold',
  ran: 'run',
  fell: 'fall', fallen: 'fall',
  paid: 'pay',
  caught: 'catch',
  spent: 'spend',
  sat: 'sit',
  stood: 'stand',
  lost: 'lose',
  met: 'meet',
  built: 'build',
  lit: 'light',
  hung: 'hang',
  grew: 'grow', grown: 'grow',
  drew: 'draw', drawn: 'draw',
  threw: 'throw', thrown: 'throw',
  wore: 'wear', worn: 'wear',
  chose: 'choose', chosen: 'choose',
  woke: 'wake', woken: 'wake',
  spoke: 'speak', spoken: 'speak',
  wrote: 'write', written: 'write',
  ate: 'eat', eaten: 'eat',
  drank: 'drink', drunk: 'drink',
  sang: 'sing', sung: 'sing',
  swam: 'swim', swum: 'swim',
  began: 'begin', begun: 'begin',
  hid: 'hide', hidden: 'hide',
  rode: 'ride', ridden: 'ride',
  shot: 'shoot',
  shut: 'shut',
  bought: 'buy',
  taught: 'teach',
  fought: 'fight',
  sought: 'seek',
  sold: 'sell',
  sent: 'send',
  slept: 'sleep',
  swept: 'sweep',
  wept: 'weep',
  swore: 'swear', sworn: 'swear',
  bore: 'bear', born: 'bear',
  tore: 'tear', torn: 'tear',
  lent: 'lend',
  bent: 'bend',
  dealt: 'deal',
  leaned: 'lean',
  leapt: 'leap',
  dreamt: 'dream',
  learnt: 'learn',
  burnt: 'burn',
  spilt: 'spill',
  spoilt: 'spoil',
  knelt: 'kneel',
  dwelt: 'dwell',
  smelt: 'smell',
  bound: 'bind',
  ground: 'grind',
  wound: 'wind',
  understood: 'understand',
  withstood: 'withstand',
  overcame: 'overcome',
  underwent: 'undergo',
  undertook: 'undertake', undertaken: 'undertake',
  forgot: 'forget', forgotten: 'forget',
  forgave: 'forgive', forgiven: 'forgive',
  misunderstood: 'misunderstand',
  withdrew: 'withdraw', withdrawn: 'withdraw',
  supposed: 'suppose',
  watched: 'watch',
  started: 'start',
  punched: 'punch',
};

function lemmatize(word) {
  const lower = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!lower) return lower;
  if (irregularVerbs[lower]) return irregularVerbs[lower];

  // -ing: running->run, keeping->keep, driving->drive
  if (lower.endsWith('ing') && lower.length > 5) {
    const stem = lower.slice(0, -3);
    // Double consonant: running -> run
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2] && !'aeiou'.includes(stem[stem.length - 1])) {
      return stem.slice(0, -1);
    }
    // -eing: being -> be
    if (stem.endsWith('e')) return stem; // keeping -> keep
    return stem; // start -> start (starting -> start)
  }

  // -ed: stopped->stop, watched->watch, loved->love
  if (lower.endsWith('ed') && lower.length > 4) {
    const stem = lower.slice(0, -2);
    if (stem.endsWith('e')) return stem; // loved -> love (loveD -> love)
    // Double consonant: stopped -> stop
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2] && !'aeiou'.includes(stem[stem.length - 1])) {
      return stem.slice(0, -1);
    }
    return stem;
  }

  // -es: goes->go, watches->watch
  if (lower.endsWith('es') && lower.length > 4) return lower.slice(0, -2);
  // -s: keeps->keep, runs->run
  if (lower.endsWith('s') && lower.length > 3 && !lower.endsWith('ss') && !lower.endsWith('us') && !lower.endsWith('is')) {
    return lower.slice(0, -1);
  }

  return lower;
}

function tokenize(sentence) {
  return sentence.toLowerCase().replace(/[^a-z' ]/g, ' ').split(/\s+/).filter(Boolean);
}

// Check if an expression is present in a sentence
// Handles: contiguous match, phrasal verbs with objects in between (gap <= maxGap words)
function expressionMatchesSentence(exprCanonical, sentenceText) {
  const exprTokens = tokenize(exprCanonical);
  const sentTokens = tokenize(sentenceText);

  // Lemmatize everything
  const exprLemmas = exprTokens.map(t => lemmatize(t));
  const sentLemmas = sentTokens.map(t => lemmatize(t));

  const maxGap = 6; // allow up to 6-word gaps (for "keep everyone's spirits up" matching "keep up")

  // Find all positions where first expr lemma matches in sentence
  for (let i = 0; i < sentLemmas.length; i++) {
    if (sentLemmas[i] === exprLemmas[0]) {
      if (exprLemmas.length === 1) return true;

      // Try to match remaining lemmas as ordered subsequence within window
      let lastMatchPos = i;
      let matched = 1;

      for (let j = 1; j < exprLemmas.length; j++) {
        let found = false;
        for (let k = lastMatchPos + 1; k <= lastMatchPos + maxGap + 1 && k < sentLemmas.length; k++) {
          if (sentLemmas[k] === exprLemmas[j]) {
            lastMatchPos = k;
            matched++;
            found = true;
            break;
          }
        }
        if (!found) break;
      }

      if (matched === exprLemmas.length) return true;
    }
  }
  return false;
}

// ---- SEMANTIC DISAMBIGUATION ----
// Some single-word canonicals have a specific meaning that differs from their common use.
// We post-filter these to avoid false positives where the word appears but with a different meaning.

const semanticFalsePositiveFilter = (canonical, sentenceText) => {
  const lower = sentenceText.toLowerCase();
  if (canonical === 'ate') {
    // Dictionary "ate" = slang for "did something perfectly" (internet slang)
    // Filter out literal food-eating contexts
    if (/ate\s+(junk\s+food|food|breakfast|lunch|dinner|a\s+meal|something|it|pizza|cake|burger|sushi)/i.test(sentenceText)) return false;
    if (/i\s+ate\b/i.test(sentenceText) && /food|meal|junk|breakfast|lunch|dinner|ate\s+\w+\s+food/i.test(sentenceText)) return false;
  }
  if (canonical === 'broke') {
    // Dictionary "broke" = slang for "having no money"
    // Filter out "broken" used as an adjective (broke only matches via lemma='break', but broken also lemmatizes to break)
    // Only allow if the actual word "broke" appears in the sentence
    if (!/\bbroke\b/i.test(sentenceText)) return false;
  }
  if (canonical === 'about') {
    // Dictionary "about" = approximation (about 5 miles, about 10 minutes)
    // Filter out "about" used as a preposition meaning "regarding/concerning"
    // Approximation usage: followed by a number or quantity
    if (!/about\s+(\d|a\s+few|several|half|many|most|some\s+\d)/i.test(sentenceText)) return false;
  }
  return true;
};

// ---- MATCHING ----
const results = [];
let totalMatches = 0;
const allMatchedExpressions = new Set();

for (let idx = 0; idx < transcript.length; idx++) {
  const sentence = transcript[idx];
  const matches = [];

  for (const canonical of canonicals) {
    if (expressionMatchesSentence(canonical, sentence.en)) {
      // Apply semantic disambiguation filter
      if (semanticFalsePositiveFilter(canonical, sentence.en)) {
        matches.push(canonical);
      }
    }
  }

  if (matches.length > 0) {
    results.push({
      sentenceIdx: idx,
      en: sentence.en,
      matches: matches
    });
    totalMatches += matches.length;
    matches.forEach(m => allMatchedExpressions.add(m));
  }
}

// Write result
fs.mkdirSync('src/data/dict-parts', { recursive: true });
fs.writeFileSync('src/data/dict-parts/test-match-result.json', JSON.stringify(results, null, 2));

console.log('=== SUMMARY ===');
console.log('Sentences matched:', results.length, '/', transcript.length);
console.log('Total matches found:', totalMatches);
console.log('Unique expressions matched:', allMatchedExpressions.size);
console.log('');
console.log('=== MATCHED EXPRESSIONS ===');
Array.from(allMatchedExpressions).sort().forEach(e => console.log(' -', e));
console.log('');
console.log('=== MATCH DETAILS ===');
results.forEach(r => {
  console.log(`[${r.sentenceIdx}] "${r.en}"`);
  r.matches.forEach(m => console.log(`     -> ${m}`));
});
