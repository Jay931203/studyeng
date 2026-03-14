#!/usr/bin/env node
/**
 * Promote Expression Match Candidates to Production Index
 *
 * Reads gap-analysis candidates, quality-filters them, and adds
 * accepted matches to expression-index-v3.json.
 */

import { readFileSync, readdirSync, writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dirname, '..');
const GAP_ANALYSIS = join(ROOT, 'output', 'expression-gap-analysis.json');
const EXPR_INDEX_PATH = join(ROOT, 'src', 'data', 'expression-index-v3.json');
const EXPR_ENTRIES = join(ROOT, 'src', 'data', 'expression-entries-v2.json');
const TRANSCRIPTS_DIR = join(ROOT, 'public', 'transcripts');
const BACKUP_PATH = join(ROOT, 'src', 'data', 'expression-index-v3.backup.json');

// ── Reject list: single generic words ──
const REJECT_SINGLE_WORDS = new Set([
  'about', 'some', 'around', 'just', 'like', 'well', 'right',
  'get', 'come', 'go', 'take', 'make', 'put', 'set', 'run',
  'let', 'keep', 'give', 'turn', 'hold', 'bring', 'look', 'see',
  'say', 'tell', 'think', 'know', 'want', 'need', 'try', 'mean',
  'feel', 'seem', 'work', 'help', 'call', 'ask', 'use', 'find',
  'show', 'play', 'move', 'live', 'leave', 'start', 'stop',
  'open', 'close',
  // Also reject very common single-word adverbs/adjectives/determiners
  'really', 'very', 'much', 'still', 'even', 'quite', 'almost',
  'already', 'always', 'never', 'often', 'soon', 'yet', 'also',
  'too', 'here', 'there', 'now', 'then', 'only', 'just',
  'rather', 'somehow', 'perhaps', 'maybe', 'enough', 'sure',
  'actually', 'probably', 'definitely', 'certainly', 'obviously',
  'apparently', 'seriously', 'honestly', 'literally', 'basically',
  'especially', 'exactly', 'simply', 'completely', 'absolutely',
  'totally', 'perfectly', 'truly', 'merely', 'hardly', 'barely',
]);

// ── Load data ──
console.log('Loading data...');
const gapData = JSON.parse(readFileSync(GAP_ANALYSIS, 'utf-8'));
const candidates = gapData.candidates;
console.log(`  ${candidates.length} candidates from gap analysis`);

const exprEntries = JSON.parse(readFileSync(EXPR_ENTRIES, 'utf-8'));
const exprIndex = JSON.parse(readFileSync(EXPR_INDEX_PATH, 'utf-8'));

// Back up the index
copyFileSync(EXPR_INDEX_PATH, BACKUP_PATH);
console.log(`  Backed up expression-index-v3.json`);

// ── Load transcripts ──
console.log('Loading transcripts...');
const transcriptFiles = readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'));
const transcripts = new Map();
for (const file of transcriptFiles) {
  const videoId = file.replace('.json', '');
  try {
    const data = JSON.parse(readFileSync(join(TRANSCRIPTS_DIR, file), 'utf-8'));
    transcripts.set(videoId, data); // array of {start, end, en, ko}
  } catch {
    // skip malformed
  }
}
console.log(`  Loaded ${transcripts.size} transcripts`);

// ── Reuse variation/matching logic from gap analysis ──
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

function getVariations(expr) {
  const variations = new Set();
  variations.add(expr.toLowerCase());
  const words = expr.toLowerCase().split(/\s+/);

  if (words.length >= 2) {
    const verb = words[0];
    const rest = words.slice(1).join(' ');
    const inflections = [];
    if (verb.endsWith('e')) {
      inflections.push(verb + 'd', verb.slice(0, -1) + 'ing', verb + 's');
    } else if (verb.endsWith('y') && !/[aeiou]y$/.test(verb)) {
      inflections.push(verb.slice(0, -1) + 'ies', verb.slice(0, -1) + 'ied', verb + 'ing');
    } else {
      inflections.push(verb + 's', verb + 'ed', verb + 'ing');
      if (/[^aeiou][aeiou][^aeiou]$/.test(verb) && verb.length <= 4) {
        const last = verb[verb.length - 1];
        inflections.push(verb + last + 'ed', verb + last + 'ing');
      }
    }
    for (const inf of inflections) variations.add(inf + ' ' + rest);
    if (irregulars[verb]) {
      for (const form of irregulars[verb]) variations.add(form + ' ' + rest);
    }
    const lastWord = words[words.length - 1];
    if (irregulars[lastWord]) {
      const prefix = words.slice(0, -1).join(' ');
      for (const form of irregulars[lastWord]) variations.add(prefix + ' ' + form);
    }
  }

  // "be X" expressions
  if (words[0] === 'be' && words.length >= 2) {
    const rest = words.slice(1).join(' ');
    for (const beForm of ["i'm", "i am", "you're", "you are", "he's", "he is",
      "she's", "she is", "we're", "we are", "they're", "they are", "it's", "it is",
      "is", "am", "are", "was", "were", "been", "being"]) {
      variations.add(beForm + ' ' + rest);
    }
  }

  return [...variations];
}

function findMatchInText(text, variations) {
  const lower = text.toLowerCase();
  for (const v of variations) {
    const escaped = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(lower)) {
      // Extract the actual surface form from the original text
      const match = text.match(new RegExp(`\\b${escaped}\\b`, 'i'));
      return match ? match[0] : null;
    }
  }
  return null;
}

// ── Quality filtering ──
console.log('\nApplying quality filters...');

const stats = {
  accepted: 0,
  rejected_generic_single: 0,
  rejected_false_positive: 0,
  rejected_no_transcript: 0,
  accepted_by_level: {},
  rejected_exprs: [],
  accepted_exprs: [],
};

// Track how many new entries per video (for the 5-per-video limit)
const newEntriesPerVideo = {};

// Count existing entries per video
for (const [videoId, entries] of Object.entries(exprIndex)) {
  // We only count new ones we're adding
  newEntriesPerVideo[videoId] = 0;
}

let totalNewEntries = 0;

for (const candidate of candidates) {
  const { exprId, level, category } = candidate;
  const wordCount = exprId.trim().split(/\s+/).length;

  // ── Rule 1: Reject generic single words ──
  if (wordCount === 1) {
    const lower = exprId.toLowerCase();
    if (REJECT_SINGLE_WORDS.has(lower)) {
      stats.rejected_generic_single++;
      stats.rejected_exprs.push({ exprId, reason: 'generic_single_word' });
      continue;
    }
    // Also reject if it's a very common English word (check if it appears in 50+ videos)
    if (candidate.videoCount > 50 && wordCount === 1) {
      stats.rejected_generic_single++;
      stats.rejected_exprs.push({ exprId, reason: 'too_common_single_word', videoCount: candidate.videoCount });
      continue;
    }
  }

  // ── Rule 3: Check for false positives (expression matched inside longer word) ──
  // We'll verify during transcript scanning

  // ── Get expression metadata ──
  const exprEntry = exprEntries[exprId];
  if (!exprEntry) {
    stats.rejected_no_transcript++;
    stats.rejected_exprs.push({ exprId, reason: 'no_entry_in_dictionary' });
    continue;
  }
  const meaningKo = exprEntry.meaning_ko || '';

  // ── Scan ALL transcripts for this expression ──
  const variations = getVariations(exprId);
  const videoMatches = [];

  for (const [videoId, segments] of transcripts) {
    // Skip if we've already hit 5 new for this video
    if ((newEntriesPerVideo[videoId] || 0) >= 5) continue;

    // Check if this exprId already exists for this video
    const existing = exprIndex[videoId] || [];
    if (existing.some(e => e.exprId === exprId)) continue;

    for (let idx = 0; idx < segments.length; idx++) {
      const seg = segments[idx];
      const en = seg.en || '';
      if (!en || en.length < 3) continue;

      const surfaceForm = findMatchInText(en, variations);
      if (surfaceForm) {
        videoMatches.push({
          videoId,
          sentenceIdx: idx,
          en,
          ko: seg.ko || '',
          surfaceForm,
        });
        break; // one match per video is enough
      }
    }
  }

  if (videoMatches.length === 0) {
    stats.rejected_false_positive++;
    stats.rejected_exprs.push({ exprId, reason: 'no_valid_matches_found' });
    continue;
  }

  // ── Accept: add to index ──
  stats.accepted++;
  stats.accepted_by_level[level] = (stats.accepted_by_level[level] || 0) + 1;
  stats.accepted_exprs.push({ exprId, level, matchCount: videoMatches.length });

  for (const match of videoMatches) {
    const { videoId } = match;
    // Enforce 5-per-video limit
    if ((newEntriesPerVideo[videoId] || 0) >= 5) continue;

    if (!exprIndex[videoId]) exprIndex[videoId] = [];
    exprIndex[videoId].push({
      exprId: match.exprId || exprId,
      sentenceIdx: match.sentenceIdx,
      en: match.en,
      ko: match.ko,
      surfaceForm: match.surfaceForm,
    });
    newEntriesPerVideo[videoId] = (newEntriesPerVideo[videoId] || 0) + 1;
    totalNewEntries++;
  }
}

// ── Save updated index ──
console.log('\nSaving updated expression-index-v3.json...');
writeFileSync(EXPR_INDEX_PATH, JSON.stringify(exprIndex, null, 2), 'utf-8');

// ── Print stats ──
console.log('\n══════════════════════════════════════');
console.log('  PROMOTION RESULTS');
console.log('══════════════════════════════════════');
console.log(`Total candidates:            ${candidates.length}`);
console.log(`Accepted expressions:        ${stats.accepted}`);
console.log(`Total new index entries:      ${totalNewEntries}`);
console.log(`Rejected (generic single):   ${stats.rejected_generic_single}`);
console.log(`Rejected (false positive):   ${stats.rejected_false_positive}`);
console.log(`Rejected (no entry):         ${stats.rejected_no_transcript}`);
console.log('');
console.log('Accepted by level:');
for (const [level, count] of Object.entries(stats.accepted_by_level).sort()) {
  console.log(`  ${level}: ${count}`);
}

console.log('\nAccepted expressions:');
for (const e of stats.accepted_exprs.slice(0, 30)) {
  console.log(`  ${e.exprId} (${e.level}) — ${e.matchCount} video matches`);
}
if (stats.accepted_exprs.length > 30) {
  console.log(`  ... and ${stats.accepted_exprs.length - 30} more`);
}

console.log('\nRejected expressions (sample):');
for (const e of stats.rejected_exprs.slice(0, 20)) {
  console.log(`  ${e.exprId} — ${e.reason}${e.videoCount ? ` (${e.videoCount} videos)` : ''}`);
}
if (stats.rejected_exprs.length > 20) {
  console.log(`  ... and ${stats.rejected_exprs.length - 20} more`);
}

// Videos with most new entries
const topVideos = Object.entries(newEntriesPerVideo)
  .filter(([, count]) => count > 0)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);
if (topVideos.length > 0) {
  console.log('\nVideos with most new entries:');
  for (const [videoId, count] of topVideos) {
    console.log(`  ${videoId}: +${count} entries`);
  }
}

console.log('\nDone!');
