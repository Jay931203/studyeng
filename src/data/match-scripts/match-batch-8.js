/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

// Load canonical list
const canonicalRaw = fs.readFileSync('C:/Users/hyunj/studyeng/src/data/canonical-list.txt', 'utf8');
const canonicals = canonicalRaw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

// Load batch
const batch = JSON.parse(fs.readFileSync('C:/Users/hyunj/studyeng/src/data/transcript-batches/batch-8.json', 'utf8'));

function normalize(s) {
  return s.toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^a-z0-9' ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandContractions(s) {
  return s
    .replace(/\bi'm\b/g, 'i am')
    .replace(/\byou're\b/g, 'you are')
    .replace(/\bwe're\b/g, 'we are')
    .replace(/\bthey're\b/g, 'they are')
    .replace(/\bhe's\b/g, 'he is')
    .replace(/\bshe's\b/g, 'she is')
    .replace(/\bit's\b/g, 'it is')
    .replace(/\bthat's\b/g, 'that is')
    .replace(/\bthere's\b/g, 'there is')
    .replace(/\bhere's\b/g, 'here is')
    .replace(/\bwhat's\b/g, 'what is')
    .replace(/\bwho's\b/g, 'who is')
    .replace(/\bdon't\b/g, 'do not')
    .replace(/\bdoesn't\b/g, 'does not')
    .replace(/\bdidn't\b/g, 'did not')
    .replace(/\bwon't\b/g, 'will not')
    .replace(/\bcan't\b/g, 'cannot')
    .replace(/\bcannot\b/g, 'can not')
    .replace(/\bcouldn't\b/g, 'could not')
    .replace(/\bwouldn't\b/g, 'would not')
    .replace(/\bshouldn't\b/g, 'should not')
    .replace(/\bisn't\b/g, 'is not')
    .replace(/\baren't\b/g, 'are not')
    .replace(/\bwasn't\b/g, 'was not')
    .replace(/\bweren't\b/g, 'were not')
    .replace(/\bhaven't\b/g, 'have not')
    .replace(/\bhasn't\b/g, 'has not')
    .replace(/\bhadn't\b/g, 'had not')
    .replace(/\bi'll\b/g, 'i will')
    .replace(/\byou'll\b/g, 'you will')
    .replace(/\bwe'll\b/g, 'we will')
    .replace(/\bthey'll\b/g, 'they will')
    .replace(/\bi've\b/g, 'i have')
    .replace(/\byou've\b/g, 'you have')
    .replace(/\bwe've\b/g, 'we have')
    .replace(/\bthey've\b/g, 'they have')
    .replace(/\bi'd\b/g, 'i would')
    .replace(/\byou'd\b/g, 'you would')
    .replace(/\bhe'd\b/g, 'he would')
    .replace(/\bshe'd\b/g, 'she would')
    .replace(/\bwe'd\b/g, 'we would')
    .replace(/\bthey'd\b/g, 'they would')
    .replace(/\blet's\b/g, 'let us')
    .replace(/\bmustn't\b/g, 'must not')
    .replace(/\bneedn't\b/g, 'need not');
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Test if a variant appears in sentence with word boundaries
function variantInSentence(sentNorm, sentExpanded, v) {
  // Build a word-boundary-aware regex
  // \b doesn't work well with apostrophes, so we use space/start/end anchors
  const esc = escapeRegex(v);
  // Match: at start of string, after space, before space, or at end of string
  const re = new RegExp('(?:^|\\s)' + esc + '(?:\\s|$)', 'i');
  return re.test(sentNorm) || re.test(sentExpanded) ||
         // Also match if the expression appears as a contiguous phrase inside
         sentNorm.includes(' ' + v + ' ') || sentExpanded.includes(' ' + v + ' ') ||
         sentNorm.startsWith(v + ' ') || sentExpanded.startsWith(v + ' ') ||
         sentNorm.endsWith(' ' + v) || sentExpanded.endsWith(' ' + v) ||
         sentNorm === v || sentExpanded === v;
}

// Verb conjugation families
const verbFamilies = [
  ['be', 'is', 'am', 'are', 'was', 'were', 'been', 'being'],
  ['go', 'goes', 'went', 'gone', 'going'],
  ['have', 'has', 'had', 'having'],
  ['do', 'does', 'did', 'doing'],
  ['make', 'makes', 'made', 'making'],
  ['take', 'takes', 'took', 'taken', 'taking'],
  ['get', 'gets', 'got', 'gotten', 'getting'],
  ['give', 'gives', 'gave', 'given', 'giving'],
  ['come', 'comes', 'came', 'coming'],
  ['keep', 'keeps', 'kept', 'keeping'],
  ['think', 'thinks', 'thought', 'thinking'],
  ['know', 'knows', 'knew', 'known', 'knowing'],
  ['see', 'sees', 'saw', 'seen', 'seeing'],
  ['run', 'runs', 'ran', 'running'],
  ['hold', 'holds', 'held', 'holding'],
  ['break', 'breaks', 'broke', 'broken', 'breaking'],
  ['bring', 'brings', 'brought', 'bringing'],
  ['find', 'finds', 'found', 'finding'],
  ['turn', 'turns', 'turned', 'turning'],
  ['put', 'puts', 'putting'],
  ['look', 'looks', 'looked', 'looking'],
  ['set', 'sets', 'setting'],
  ['feel', 'feels', 'felt', 'feeling'],
  ['fall', 'falls', 'fell', 'fallen', 'falling'],
  ['stand', 'stands', 'stood', 'standing'],
  ['lose', 'loses', 'lost', 'losing'],
  ['leave', 'leaves', 'left', 'leaving'],
  ['call', 'calls', 'called', 'calling'],
  ['pick', 'picks', 'picked', 'picking'],
  ['pull', 'pulls', 'pulled', 'pulling'],
  ['push', 'pushes', 'pushed', 'pushing'],
  ['grow', 'grows', 'grew', 'grown', 'growing'],
  ['move', 'moves', 'moved', 'moving'],
  ['show', 'shows', 'showed', 'shown', 'showing'],
  ['work', 'works', 'worked', 'working'],
  ['play', 'plays', 'played', 'playing'],
  ['send', 'sends', 'sent', 'sending'],
  ['build', 'builds', 'built', 'building'],
  ['spend', 'spends', 'spent', 'spending'],
  ['cut', 'cuts', 'cutting'],
  ['lay', 'lays', 'laid', 'laying'],
  ['draw', 'draws', 'drew', 'drawn', 'drawing'],
  ['drive', 'drives', 'drove', 'driven', 'driving'],
  ['throw', 'throws', 'threw', 'thrown', 'throwing'],
  ['catch', 'catches', 'caught', 'catching'],
  ['carry', 'carries', 'carried', 'carrying'],
  ['blow', 'blows', 'blew', 'blown', 'blowing'],
  ['wear', 'wears', 'wore', 'worn', 'wearing'],
  ['hang', 'hangs', 'hung', 'hanging'],
  ['write', 'writes', 'wrote', 'written', 'writing'],
  ['speak', 'speaks', 'spoke', 'spoken', 'speaking'],
  ['sit', 'sits', 'sat', 'sitting'],
  ['raise', 'raises', 'raised', 'raising'],
  ['pass', 'passes', 'passed', 'passing'],
  ['follow', 'follows', 'followed', 'following'],
  ['fill', 'fills', 'filled', 'filling'],
  ['try', 'tries', 'tried', 'trying'],
  ['let', 'lets', 'letting'],
  ['start', 'starts', 'started', 'starting'],
  ['stop', 'stops', 'stopped', 'stopping'],
  ['buy', 'buys', 'bought', 'buying'],
  ['tell', 'tells', 'told', 'telling'],
  ['say', 'says', 'said', 'saying'],
  ['sell', 'sells', 'sold', 'selling'],
  ['hit', 'hits', 'hitting'],
  ['learn', 'learns', 'learned', 'learnt', 'learning'],
  ['mean', 'means', 'meant', 'meaning'],
  ['need', 'needs', 'needed', 'needing'],
  ['help', 'helps', 'helped', 'helping'],
  ['live', 'lives', 'lived', 'living'],
  ['lead', 'leads', 'led', 'leading'],
  ['hear', 'hears', 'heard', 'hearing'],
  ['forget', 'forgets', 'forgot', 'forgotten', 'forgetting'],
  ['win', 'wins', 'won', 'winning'],
  ['pay', 'pays', 'paid', 'paying'],
  ['meet', 'meets', 'met', 'meeting'],
  ['add', 'adds', 'added', 'adding'],
  ['ask', 'asks', 'asked', 'asking'],
  ['use', 'uses', 'used', 'using'],
  ['talk', 'talks', 'talked', 'talking'],
  ['walk', 'walks', 'walked', 'walking'],
  ['watch', 'watches', 'watched', 'watching'],
  ['eat', 'eats', 'ate', 'eaten', 'eating'],
  ['drink', 'drinks', 'drank', 'drunk', 'drinking'],
  ['sleep', 'sleeps', 'slept', 'sleeping'],
  ['wake', 'wakes', 'woke', 'woken', 'waking'],
  ['close', 'closes', 'closed', 'closing'],
  ['open', 'opens', 'opened', 'opening'],
  ['jump', 'jumps', 'jumped', 'jumping'],
  ['drop', 'drops', 'dropped', 'dropping'],
  ['place', 'places', 'placed', 'placing'],
  ['point', 'points', 'pointed', 'pointing'],
  ['press', 'presses', 'pressed', 'pressing'],
  ['save', 'saves', 'saved', 'saving'],
  ['change', 'changes', 'changed', 'changing'],
  ['continue', 'continues', 'continued', 'continuing'],
  ['end', 'ends', 'ended', 'ending'],
  ['begin', 'begins', 'began', 'begun', 'beginning'],
  ['finish', 'finishes', 'finished', 'finishing'],
  ['complete', 'completes', 'completed', 'completing'],
  ['achieve', 'achieves', 'achieved', 'achieving'],
  ['decide', 'decides', 'decided', 'deciding'],
  ['choose', 'chooses', 'chose', 'chosen', 'choosing'],
  ['accept', 'accepts', 'accepted', 'accepting'],
  ['reject', 'rejects', 'rejected', 'rejecting'],
  ['fail', 'fails', 'failed', 'failing'],
  ['succeed', 'succeeds', 'succeeded', 'succeeding'],
  ['fight', 'fights', 'fought', 'fighting'],
  ['beat', 'beats', 'beaten', 'beating'],
  ['kill', 'kills', 'killed', 'killing'],
  ['figure', 'figures', 'figured', 'figuring'],
  ['lay', 'lays', 'laid', 'laying'],
];

// Build lookup: word form -> all members of its family
const verbFormToFamily = new Map();
for (const family of verbFamilies) {
  for (const form of family) {
    if (!verbFormToFamily.has(form)) verbFormToFamily.set(form, []);
    verbFormToFamily.get(form).push(family);
  }
}

function generateVariants(canonical) {
  const canNorm = normalize(canonical);
  const variants = new Set([canNorm]);

  // Add contraction-expanded variant
  const expanded = expandContractions(canNorm);
  variants.add(expanded);

  // Replace each word with all forms in its verb family
  const words = canNorm.split(' ');
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const families = verbFormToFamily.get(word);
    if (families) {
      for (const family of families) {
        for (const form of family) {
          if (form !== word) {
            const newWords = [...words];
            newWords[i] = form;
            const newVariant = newWords.join(' ');
            variants.add(newVariant);
            variants.add(expandContractions(newVariant));
          }
        }
      }
    }
  }

  return variants;
}

// Precompute canonical variants
console.error('Precomputing canonical variants...');
const canonicalVariants = canonicals.map(c => ({
  canonical: c,
  variants: generateVariants(c),
  normCanonical: normalize(c),
}));
console.error('Done. Processing sentences...');

const particles = new Set(['up', 'down', 'out', 'in', 'on', 'off', 'away', 'back', 'over', 'through', 'around', 'forward', 'along', 'apart', 'aside', 'together', 'across']);

function sentenceMatchesCanonical(sentNorm, sentExpanded, { canonical, variants, normCanonical }) {
  // 1. Check all precomputed variants with word-boundary awareness
  for (const v of variants) {
    if (variantInSentence(sentNorm, sentExpanded, v)) return true;
  }

  // 2. Phrasal verb separation: "figure out" can match "figured it out"
  const canWords = normCanonical.split(' ');
  if (canWords.length === 2) {
    const [w1, w2] = canWords;
    // If second word is a particle, check for separated phrasal verb
    if (particles.has(w2)) {
      const families = verbFormToFamily.get(w1);
      const allForms = families ? [...new Set(families.flat())] : [w1];
      for (const form of allForms) {
        // form ... w2 with up to 20 chars in between (e.g. "figured the problem out")
        const re = new RegExp('(?:^|\\s)' + escapeRegex(form) + '\\b.{0,20}\\b' + escapeRegex(w2) + '(?:\\s|$)');
        if (re.test(sentNorm) || re.test(sentExpanded)) return true;
      }
    }
    // If first word is a particle and second is a verb (less common)
    if (particles.has(w1)) {
      const families = verbFormToFamily.get(w2);
      const allForms = families ? [...new Set(families.flat())] : [w2];
      for (const form of allForms) {
        if (variantInSentence(sentNorm, sentExpanded, w1 + ' ' + form)) return true;
      }
    }
  }

  // 3. For 3-word phrasal verbs with particle in middle: "come up with" -> "came up with"
  if (canWords.length === 3 && particles.has(canWords[1])) {
    const [w1, w2, w3] = canWords;
    const families = verbFormToFamily.get(w1);
    const allForms = families ? [...new Set(families.flat())] : [w1];
    for (const form of allForms) {
      if (variantInSentence(sentNorm, sentExpanded, form + ' ' + w2 + ' ' + w3)) return true;
    }
  }

  return false;
}

// Process all videos
const results = {};

for (const [videoId, sentences] of Object.entries(batch)) {
  const matches = [];
  const seen = new Set();

  for (const [sentIdx, sentence] of Object.entries(sentences)) {
    const idx = parseInt(sentIdx);
    const sentNorm = normalize(sentence);
    const sentExpanded = expandContractions(sentNorm);

    for (const cv of canonicalVariants) {
      const key = cv.canonical + '|' + idx;
      if (seen.has(key)) continue;

      if (sentenceMatchesCanonical(sentNorm, sentExpanded, cv)) {
        matches.push({ canonical: cv.canonical, sentenceIdx: idx });
        seen.add(key);
      }
    }
  }

  if (matches.length > 0) {
    results[videoId] = matches;
  }
}

// Write results
fs.writeFileSync('C:/Users/hyunj/studyeng/src/data/match-results/batch-8.json', JSON.stringify(results, null, 2));
console.log('Done! Videos with matches:', Object.keys(results).length);
console.log('Total matches:', Object.values(results).reduce((acc, v) => acc + v.length, 0));
