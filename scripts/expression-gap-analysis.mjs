#!/usr/bin/env node
/**
 * Expression Gap Analysis
 * Finds unmatched expressions that appear in transcripts but aren't in expression-index-v3.
 * READ-ONLY — does not modify any data files.
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts');
const EXPR_ENTRIES = join(ROOT, 'src', 'data', 'expression-entries-v2.json');
const EXPR_INDEX = join(ROOT, 'src', 'data', 'expression-index-v3.json');
const OUTPUT_FILE = join(ROOT, 'output', 'expression-gap-analysis.json');

// ── 1. Load expressions ──
console.log('Loading expression entries...');
const exprEntries = JSON.parse(readFileSync(EXPR_ENTRIES, 'utf-8'));
const allExprIds = Object.keys(exprEntries);
console.log(`  Total expressions: ${allExprIds.length}`);

// ── 2. Load current index to find matched expression IDs ──
console.log('Loading expression index v3...');
const exprIndex = JSON.parse(readFileSync(EXPR_INDEX, 'utf-8'));
const matchedExprIds = new Set();
for (const videoId of Object.keys(exprIndex)) {
  for (const match of exprIndex[videoId]) {
    matchedExprIds.add(match.exprId);
  }
}
console.log(`  Currently matched expressions: ${matchedExprIds.size}`);

// ── 3. Identify unmatched ──
const unmatchedExprs = allExprIds.filter(id => !matchedExprIds.has(id));
console.log(`  Unmatched expressions: ${unmatchedExprs.length}`);

// By level
const unmatchedByLevel = {};
for (const id of unmatchedExprs) {
  const level = exprEntries[id].cefr;
  unmatchedByLevel[level] = (unmatchedByLevel[level] || 0) + 1;
}
console.log('  Unmatched by level:', unmatchedByLevel);

// ── 4. Load ALL transcripts into memory (keyed by videoId) ──
console.log('Loading transcripts...');
const transcriptFiles = readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'));
console.log(`  Found ${transcriptFiles.length} transcript files`);

// Build a map: videoId -> array of {en (lowercased), idx, originalEn}
const transcripts = new Map();
let totalSentences = 0;
for (const file of transcriptFiles) {
  const videoId = file.replace('.json', '');
  try {
    const data = JSON.parse(readFileSync(join(TRANSCRIPTS_DIR, file), 'utf-8'));
    const sentences = data.map((seg, idx) => ({
      enLower: (seg.en || '').toLowerCase(),
      en: seg.en || '',
      idx,
    }));
    transcripts.set(videoId, sentences);
    totalSentences += sentences.length;
  } catch {
    // skip malformed
  }
}
console.log(`  Loaded ${transcripts.size} transcripts, ${totalSentences} sentences`);

// ── 5. For each unmatched expression, search all transcripts ──
console.log('Searching for unmatched expressions in transcripts...');

// Simple inflection generator for common verb forms
function getVariations(expr) {
  const variations = new Set();
  variations.add(expr.toLowerCase());

  const words = expr.toLowerCase().split(/\s+/);

  // If expression has a verb-like first word, try common inflections
  if (words.length >= 2) {
    const verb = words[0];
    const rest = words.slice(1).join(' ');

    // -s, -ed, -ing for first word
    const inflections = [];
    if (verb.endsWith('e')) {
      inflections.push(verb + 'd');       // make -> maked (irregular won't match but that's ok)
      inflections.push(verb.slice(0, -1) + 'ing'); // make -> making
      inflections.push(verb + 's');       // make -> makes
    } else if (verb.endsWith('y') && !/[aeiou]y$/.test(verb)) {
      inflections.push(verb.slice(0, -1) + 'ies');
      inflections.push(verb.slice(0, -1) + 'ied');
      inflections.push(verb + 'ing');
    } else {
      inflections.push(verb + 's');
      inflections.push(verb + 'ed');
      inflections.push(verb + 'ing');
      // double consonant for short verbs
      if (/[^aeiou][aeiou][^aeiou]$/.test(verb) && verb.length <= 4) {
        const last = verb[verb.length - 1];
        inflections.push(verb + last + 'ed');
        inflections.push(verb + last + 'ing');
      }
    }

    for (const inf of inflections) {
      variations.add(inf + ' ' + rest);
    }

    // Common irregular verbs mapping
    const irregulars = {
      'break': ['broke', 'broken', 'breaking', 'breaks'],
      'take': ['took', 'taken', 'taking', 'takes'],
      'make': ['made', 'making', 'makes'],
      'get': ['got', 'gotten', 'getting', 'gets'],
      'give': ['gave', 'given', 'giving', 'gives'],
      'go': ['went', 'gone', 'going', 'goes'],
      'come': ['came', 'coming', 'comes'],
      'have': ['had', 'having', 'has'],
      'do': ['did', 'done', 'doing', 'does'],
      'say': ['said', 'saying', 'says'],
      'tell': ['told', 'telling', 'tells'],
      'think': ['thought', 'thinking', 'thinks'],
      'know': ['knew', 'known', 'knowing', 'knows'],
      'see': ['saw', 'seen', 'seeing', 'sees'],
      'put': ['putting', 'puts'],
      'run': ['ran', 'running', 'runs'],
      'keep': ['kept', 'keeping', 'keeps'],
      'let': ['letting', 'lets'],
      'hold': ['held', 'holding', 'holds'],
      'bring': ['brought', 'bringing', 'brings'],
      'lose': ['lost', 'losing', 'loses'],
      'pay': ['paid', 'paying', 'pays'],
      'feel': ['felt', 'feeling', 'feels'],
      'leave': ['left', 'leaving', 'leaves'],
      'find': ['found', 'finding', 'finds'],
      'stand': ['stood', 'standing', 'stands'],
      'set': ['setting', 'sets'],
      'learn': ['learned', 'learnt', 'learning', 'learns'],
      'show': ['showed', 'shown', 'showing', 'shows'],
      'hear': ['heard', 'hearing', 'hears'],
      'play': ['played', 'playing', 'plays'],
      'turn': ['turned', 'turning', 'turns'],
      'move': ['moved', 'moving', 'moves'],
      'live': ['lived', 'living', 'lives'],
      'fall': ['fell', 'fallen', 'falling', 'falls'],
      'cut': ['cutting', 'cuts'],
      'reach': ['reached', 'reaching', 'reaches'],
      'sit': ['sat', 'sitting', 'sits'],
      'speak': ['spoke', 'spoken', 'speaking', 'speaks'],
      'grow': ['grew', 'grown', 'growing', 'grows'],
      'draw': ['drew', 'drawn', 'drawing', 'draws'],
      'walk': ['walked', 'walking', 'walks'],
      'pick': ['picked', 'picking', 'picks'],
      'look': ['looked', 'looking', 'looks'],
      'hang': ['hung', 'hanging', 'hangs'],
      'write': ['wrote', 'written', 'writing', 'writes'],
      'send': ['sent', 'sending', 'sends'],
      'build': ['built', 'building', 'builds'],
      'stay': ['stayed', 'staying', 'stays'],
      'throw': ['threw', 'thrown', 'throwing', 'throws'],
      'catch': ['caught', 'catching', 'catches'],
      'pull': ['pulled', 'pulling', 'pulls'],
      'blow': ['blew', 'blown', 'blowing', 'blows'],
      'wear': ['wore', 'worn', 'wearing', 'wears'],
      'eat': ['ate', 'eaten', 'eating', 'eats'],
      'drive': ['drove', 'driven', 'driving', 'drives'],
      'buy': ['bought', 'buying', 'buys'],
      'lead': ['led', 'leading', 'leads'],
      'read': ['reading', 'reads'],
      'spend': ['spent', 'spending', 'spends'],
      'win': ['won', 'winning', 'wins'],
      'lie': ['lay', 'lain', 'lying', 'lies', 'lied'],
      'beat': ['beaten', 'beating', 'beats'],
      'sing': ['sang', 'sung', 'singing', 'sings'],
      'bite': ['bit', 'bitten', 'biting', 'bites'],
      'sleep': ['slept', 'sleeping', 'sleeps'],
      'wake': ['woke', 'woken', 'waking', 'wakes'],
      'fly': ['flew', 'flown', 'flying', 'flies'],
      'ring': ['rang', 'rung', 'ringing', 'rings'],
      'ride': ['rode', 'ridden', 'riding', 'rides'],
      'forget': ['forgot', 'forgotten', 'forgetting', 'forgets'],
      'begin': ['began', 'begun', 'beginning', 'begins'],
      'drink': ['drank', 'drunk', 'drinking', 'drinks'],
      'swim': ['swam', 'swum', 'swimming', 'swims'],
      'shake': ['shook', 'shaken', 'shaking', 'shakes'],
      'stick': ['stuck', 'sticking', 'sticks'],
    };

    if (irregulars[verb]) {
      for (const form of irregulars[verb]) {
        variations.add(form + ' ' + rest);
      }
    }

    // Also try verb at end or middle for phrasal expressions
    const lastWord = words[words.length - 1];
    if (irregulars[lastWord]) {
      const prefix = words.slice(0, -1).join(' ');
      for (const form of irregulars[lastWord]) {
        variations.add(prefix + ' ' + form);
      }
    }
  }

  // For single-word expressions, also try inflections
  if (words.length === 1) {
    const word = words[0];
    const irregulars_single = {
      'whatever': [], 'absolutely': [], 'actually': [], 'basically': [],
    };
    // basic inflections
    if (word.endsWith('e')) {
      variations.add(word + 'd');
      variations.add(word.slice(0, -1) + 'ing');
      variations.add(word + 's');
    } else {
      variations.add(word + 's');
      variations.add(word + 'ed');
      variations.add(word + 'ing');
    }
  }

  // Also try with "be" forms for expressions starting with "be"
  if (words[0] === 'be' && words.length >= 2) {
    const rest = words.slice(1).join(' ');
    for (const beForm of ["i'm", "i am", "you're", "you are", "he's", "he is", "she's", "she is",
                           "we're", "we are", "they're", "they are", "it's", "it is",
                           "is", "am", "are", "was", "were", "been", "being"]) {
      variations.add(beForm + ' ' + rest);
    }
  }

  return [...variations];
}

// Word boundary check helper
function hasWordBoundaryMatch(text, searchTerm) {
  // Build a regex with word boundaries for multi-word expressions
  // Escape special regex chars
  const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(text);
}

const candidates = [];
const BATCH_SIZE = 200;
let processed = 0;

for (const exprId of unmatchedExprs) {
  const expr = exprEntries[exprId];
  const variations = getVariations(exprId);
  const foundInVideos = [];

  for (const [videoId, sentences] of transcripts) {
    let found = false;
    let sampleContext = '';

    for (const sent of sentences) {
      for (const variation of variations) {
        if (hasWordBoundaryMatch(sent.enLower, variation)) {
          found = true;
          sampleContext = sent.en;
          break;
        }
      }
      if (found) break;
    }

    if (found) {
      foundInVideos.push({ videoId, sampleContext });
    }
  }

  if (foundInVideos.length > 0) {
    candidates.push({
      exprId,
      level: expr.cefr,
      category: expr.category,
      videoCount: foundInVideos.length,
      foundInVideos: foundInVideos.slice(0, 5).map(v => v.videoId),
      sampleContext: foundInVideos[0].sampleContext,
    });
  }

  processed++;
  if (processed % BATCH_SIZE === 0) {
    console.log(`  Processed ${processed}/${unmatchedExprs.length} unmatched expressions, found ${candidates.length} candidates so far...`);
  }
}

console.log(`  Done! Processed ${processed} expressions, found ${candidates.length} candidates.`);

// ── 6. Build report ──
// Sort candidates by video count descending
candidates.sort((a, b) => b.videoCount - a.videoCount);

// Candidates by level
const candidatesByLevel = {};
for (const c of candidates) {
  candidatesByLevel[c.level] = (candidatesByLevel[c.level] || 0) + 1;
}

const report = {
  totalExpressions: allExprIds.length,
  currentlyMatched: matchedExprIds.size,
  matchRate: `${((matchedExprIds.size / allExprIds.length) * 100).toFixed(1)}%`,
  unmatchedTotal: unmatchedExprs.length,
  unmatchedByLevel,
  potentialNewMatches: candidates.length,
  potentialNewMatchesByLevel: candidatesByLevel,
  potentialNewMatchRate: `${(((matchedExprIds.size + candidates.length) / allExprIds.length) * 100).toFixed(1)}%`,
  top20ByCoverage: candidates.slice(0, 20),
  candidates,
};

mkdirSync(join(ROOT, 'output'), { recursive: true });
writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), 'utf-8');

console.log('\n═══ REPORT SUMMARY ═══');
console.log(`Total expressions:       ${report.totalExpressions}`);
console.log(`Currently matched:       ${report.currentlyMatched} (${report.matchRate})`);
console.log(`Unmatched:               ${report.unmatchedTotal}`);
console.log(`Unmatched by level:      ${JSON.stringify(unmatchedByLevel)}`);
console.log(`Potential new matches:   ${report.potentialNewMatches}`);
console.log(`New matches by level:    ${JSON.stringify(candidatesByLevel)}`);
console.log(`Potential match rate:    ${report.potentialNewMatchRate}`);
console.log(`\nReport saved to: ${OUTPUT_FILE}`);
console.log('\nTop 10 expressions with most video appearances:');
for (const c of candidates.slice(0, 10)) {
  console.log(`  ${c.exprId} (${c.level}) — found in ${c.videoCount} videos — "${c.sampleContext}"`);
}
