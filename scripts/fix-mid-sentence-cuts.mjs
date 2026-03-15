#!/usr/bin/env node
/**
 * Fix transcripts with mid-sentence cuts.
 *
 * Strategy:
 * 1. Find transcripts with 3+ mid-sentence cuts (not in reseg commit bad95bf1)
 * 2. For files with raw whisper data in logs/whisper-raw/:
 *    - Get full punctuated text from raw segments
 *    - Split into sentences
 *    - Use word-level timestamps (stripped of punctuation) to map sentence boundaries
 *    - Group sentences into 4-6 second segments
 *    - Preserve existing ko translations by time overlap mapping
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const TRANSCRIPTS_DIR = join(process.cwd(), 'public', 'transcripts');
const RAW_DIR = join(process.cwd(), 'logs', 'whisper-raw');

const TARGET_DURATION = 5;
const MIN_DURATION = 2.5;
const MAX_DURATION = 10;

const ABBREVIATIONS = /(?:Dr|Mr|Mrs|Ms|U\.S|St|Jr|Sr|vs|Prof|Gen|Gov|Lt|Sgt|Rev|Inc|Ltd|Corp|No|etc|i\.e|e\.g)$/;

// ─── Utility ────────────────────────────────────────────────────────────

function round(n) {
  return Math.round(n * 100) / 100;
}

function normalize(w) {
  return w.toLowerCase().replace(/[^a-z0-9']/g, '');
}

function countMidSentenceCuts(data) {
  let cuts = 0;
  for (let i = 0; i < data.length - 1; i++) {
    const curr = data[i].en?.trim();
    const next = data[i + 1].en?.trim();
    if (!curr || !next || curr.length < 5 || next.length < 5) continue;
    if (!/[.!?;:'"]$/.test(curr) && /^[a-z]/.test(next)) cuts++;
  }
  return cuts;
}

function findBadFiles() {
  const files = readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'));
  const bad = [];
  for (const f of files) {
    try {
      const data = JSON.parse(readFileSync(join(TRANSCRIPTS_DIR, f), 'utf-8'));
      if (data.length < 3) continue;
      const cuts = countMidSentenceCuts(data);
      if (cuts >= 3) bad.push({ file: f, cuts });
    } catch { /* skip */ }
  }
  return bad;
}

function getResegFiles() {
  try {
    const out = execSync('git ls-tree --name-only bad95bf1 public/transcripts/', {
      encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe']
    });
    return new Set(out.trim().split('\n').map(p => p.replace('public/transcripts/', '')));
  } catch (e) {
    console.error('Warning: Could not read reseg commit:', e.message);
    return new Set();
  }
}

// ─── Sentence splitting ─────────────────────────────────────────────────

function splitIntoSentences(text) {
  const sentences = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    current += text[i];
    if ('.!?'.includes(text[i])) {
      // Skip ellipsis
      if (text[i] === '.' && i >= 1 && text[i - 1] === '.') continue;
      // Skip abbreviation
      if (text[i] === '.') {
        const beforePeriod = current.slice(0, -1).trim();
        const lastWord = beforePeriod.split(/\s+/).pop() || '';
        if (ABBREVIATIONS.test(lastWord)) continue;
      }
      // Sentence end if: end of text, or followed by space+capital/digit/quote
      const atEnd = i >= text.length - 2;
      const afterPunct = text.slice(i + 1, i + 4);
      const validFollow = /^['"]?\s+[A-Z0-9"']/.test(afterPunct) ||
                          /^\s+[A-Z0-9"']/.test(afterPunct);
      if (atEnd || validFollow) {
        sentences.push(current.trim());
        current = '';
      }
    }
  }
  if (current.trim()) sentences.push(current.trim());
  return sentences;
}

// ─── Build word timestamp lookup ────────────────────────────────────────

/**
 * Build a lookup that maps character positions in the full text to timestamps.
 * Uses word-level data when available, falls back to segment-level interpolation.
 */
function buildTimeLookup(rawData) {
  const segments = rawData.segments || [];
  const words = (rawData.words || []).filter(w => w.word && w.start != null && w.end != null);

  // Build full text from segments (punctuated)
  const fullText = segments.map(s => (s.text || '').trim()).join(' ');

  if (words.length > 10) {
    // Strategy A: Use word-level timestamps
    // Map each word in the full text to a word timestamp
    const textWords = fullText.split(/\s+/);
    const wordTimes = []; // { start, end } for each word in textWords

    let wIdx = 0;
    for (const tw of textWords) {
      const twNorm = normalize(tw);
      // Search forward in word list for a match
      let found = false;
      for (let search = wIdx; search < Math.min(wIdx + 5, words.length); search++) {
        const rawNorm = normalize(words[search].word);
        if (rawNorm === twNorm || (twNorm.length > 2 && rawNorm.startsWith(twNorm.slice(0, 3)))) {
          wordTimes.push({ start: words[search].start, end: words[search].end });
          wIdx = search + 1;
          found = true;
          break;
        }
      }
      if (!found) {
        // Interpolate from neighbors
        const prev = wordTimes.length > 0 ? wordTimes[wordTimes.length - 1] : null;
        const nextWord = wIdx < words.length ? words[wIdx] : null;
        if (prev && nextWord) {
          const t = (prev.end + nextWord.start) / 2;
          wordTimes.push({ start: t, end: t + 0.3 });
        } else if (prev) {
          wordTimes.push({ start: prev.end, end: prev.end + 0.3 });
        } else if (nextWord) {
          wordTimes.push({ start: nextWord.start, end: nextWord.start + 0.3 });
        } else {
          wordTimes.push({ start: 0, end: 0.3 });
        }
      }
    }

    return { fullText, textWords, wordTimes };
  }

  // Strategy B: Segment-level interpolation
  const textWords = fullText.split(/\s+/);
  const wordTimes = [];
  let globalWordIdx = 0;

  for (const seg of segments) {
    const segWords = (seg.text || '').trim().split(/\s+/).filter(Boolean);
    const segDuration = (seg.end || 0) - (seg.start || 0);
    const timePerWord = segWords.length > 0 ? segDuration / segWords.length : 0;

    for (let i = 0; i < segWords.length; i++) {
      const start = (seg.start || 0) + i * timePerWord;
      const end = start + timePerWord;
      wordTimes.push({ start, end });
      globalWordIdx++;
    }
  }

  return { fullText, textWords, wordTimes };
}

// ─── Build segments from sentences and timing ───────────────────────────

function rebuildTranscript(rawData) {
  const segments = rawData.segments || [];
  if (segments.length === 0) return null;

  const { fullText, textWords, wordTimes } = buildTimeLookup(rawData);
  if (textWords.length === 0 || wordTimes.length === 0) return null;

  const sentences = splitIntoSentences(fullText);
  if (sentences.length < 2) return null;

  // Map each sentence to word indices in textWords
  const sentenceRanges = []; // { text, startWordIdx, endWordIdx, start, end }
  let wordCursor = 0;

  for (const sent of sentences) {
    const sentTokens = sent.split(/\s+/).filter(Boolean);
    if (sentTokens.length === 0) continue;

    const startWordIdx = wordCursor;
    const endWordIdx = Math.min(wordCursor + sentTokens.length - 1, textWords.length - 1);

    // Verify alignment (fuzzy check on first word)
    const expectedFirst = normalize(sentTokens[0]);
    const actualFirst = normalize(textWords[startWordIdx] || '');
    if (expectedFirst !== actualFirst) {
      // Try to find alignment
      for (let search = startWordIdx; search < Math.min(startWordIdx + 5, textWords.length); search++) {
        if (normalize(textWords[search]) === expectedFirst) {
          wordCursor = search;
          break;
        }
      }
    }

    const sIdx = Math.min(wordCursor, wordTimes.length - 1);
    const eIdx = Math.min(wordCursor + sentTokens.length - 1, wordTimes.length - 1);

    sentenceRanges.push({
      text: sent,
      start: wordTimes[sIdx]?.start ?? 0,
      end: wordTimes[eIdx]?.end ?? (wordTimes[sIdx]?.start ?? 0) + 3
    });

    wordCursor = eIdx + 1;
  }

  if (sentenceRanges.length === 0) return null;

  // Group sentences into segments with 4-6 second targets
  const newSegments = [];
  let currentTexts = [];
  let segStart = null;

  for (let i = 0; i < sentenceRanges.length; i++) {
    const sr = sentenceRanges[i];
    if (segStart === null) segStart = sr.start;
    currentTexts.push(sr.text);

    const duration = sr.end - segStart;
    const isLast = i === sentenceRanges.length - 1;

    if (isLast) {
      newSegments.push({
        start: round(segStart),
        end: round(sr.end),
        en: currentTexts.join(' '),
        ko: ''
      });
      currentTexts = [];
      segStart = null;
    } else {
      const nextSr = sentenceRanges[i + 1];
      const durationWithNext = nextSr.end - segStart;

      // Split if:
      // 1. We've reached minimum duration AND adding next would exceed max
      // 2. We've reached target duration
      // 3. Current duration + next would be over max
      if (duration >= MIN_DURATION && (duration >= TARGET_DURATION || durationWithNext > MAX_DURATION)) {
        newSegments.push({
          start: round(segStart),
          end: round(sr.end),
          en: currentTexts.join(' '),
          ko: ''
        });
        currentTexts = [];
        segStart = null;
      }
    }
  }

  // Flush remaining
  if (currentTexts.length > 0 && segStart !== null) {
    const lastSr = sentenceRanges[sentenceRanges.length - 1];
    newSegments.push({
      start: round(segStart),
      end: round(lastSr.end),
      en: currentTexts.join(' '),
      ko: ''
    });
  }

  // Sanity check: no segment should be > 30 seconds
  // If any are, the alignment failed badly
  const maxSegDuration = Math.max(...newSegments.map(s => s.end - s.start));
  if (maxSegDuration > 30) return null;

  return newSegments.length > 0 ? newSegments : null;
}

// ─── Ko translation mapping ─────────────────────────────────────────────

function mapKoTranslations(newSegments, oldSegments) {
  for (const ns of newSegments) {
    const koFragments = [];
    for (const os of oldSegments) {
      if (!os.ko) continue;
      const overlapStart = Math.max(ns.start, os.start);
      const overlapEnd = Math.min(ns.end, os.end);
      if (overlapEnd - overlapStart > 0.1) {
        const oldDuration = os.end - os.start;
        const overlapFraction = oldDuration > 0 ? (overlapEnd - overlapStart) / oldDuration : 0;
        if (overlapFraction > 0.3) {
          koFragments.push(os.ko.trim());
        }
      }
    }
    ns.ko = koFragments.join(' ').trim();
  }
  return newSegments;
}

// ─── Main ───────────────────────────────────────────────────────────────

function main() {
  console.log('=== Fix Mid-Sentence Cuts ===\n');

  console.log('Finding transcript files with mid-sentence cuts...');
  const badFiles = findBadFiles();
  console.log(`Found ${badFiles.length} files with 3+ mid-sentence cuts`);

  console.log('Checking reseg commit bad95bf1...');
  const resegFiles = getResegFiles();
  console.log(`Files in reseg commit (SKIP): ${resegFiles.size}`);

  const toFix = badFiles.filter(b => !resegFiles.has(b.file));
  console.log(`Files to fix (not in reseg): ${toFix.length}`);

  const rawAvailable = new Set(existsSync(RAW_DIR) ? readdirSync(RAW_DIR) : []);
  const toFixWithRaw = toFix.filter(b => rawAvailable.has(b.file));
  const toFixNoRaw = toFix.filter(b => !rawAvailable.has(b.file));
  console.log(`With raw whisper data: ${toFixWithRaw.length}`);
  console.log(`Without raw data (skip): ${toFixNoRaw.length}\n`);

  let fixed = 0, failed = 0, alignFail = 0;
  const results = [];

  for (const { file, cuts: oldCuts } of toFixWithRaw) {
    try {
      const rawData = JSON.parse(readFileSync(join(RAW_DIR, file), 'utf-8'));
      const oldData = JSON.parse(readFileSync(join(TRANSCRIPTS_DIR, file), 'utf-8'));

      const newSegments = rebuildTranscript(rawData);

      if (!newSegments) {
        alignFail++;
        results.push({ file, oldCuts, status: 'align-fail' });
        continue;
      }

      // Map ko translations
      mapKoTranslations(newSegments, oldData);

      // Verify improvement
      const newCuts = countMidSentenceCuts(newSegments);
      if (newCuts >= oldCuts) {
        failed++;
        results.push({ file, oldCuts, newCuts, status: 'no-improvement' });
        continue;
      }

      // Write
      writeFileSync(join(TRANSCRIPTS_DIR, file), JSON.stringify(newSegments, null, 2));
      fixed++;
      results.push({
        file, oldCuts, newCuts,
        oldSegs: oldData.length, newSegs: newSegments.length,
        maxDur: round(Math.max(...newSegments.map(s => s.end - s.start))),
        status: 'fixed'
      });

    } catch (e) {
      failed++;
      results.push({ file, status: 'error', error: e.message });
    }
  }

  console.log('═══ Results ═══');
  console.log(`Fixed (improved): ${fixed}`);
  console.log(`Alignment failed (>30s segments): ${alignFail}`);
  console.log(`Failed/no improvement: ${failed}`);
  console.log(`Skipped (no raw data): ${toFixNoRaw.length}`);

  const fixedResults = results.filter(r => r.status === 'fixed');
  if (fixedResults.length > 0) {
    const totalOldCuts = fixedResults.reduce((s, r) => s + r.oldCuts, 0);
    const totalNewCuts = fixedResults.reduce((s, r) => s + r.newCuts, 0);
    console.log(`Total cuts reduced: ${totalOldCuts} → ${totalNewCuts} (-${totalOldCuts - totalNewCuts})`);

    console.log('\nSample fixed files:');
    for (const r of fixedResults.slice(0, 15)) {
      console.log(`  ${r.file}: ${r.oldCuts}→${r.newCuts} cuts (${r.oldSegs}→${r.newSegs} segs, max ${r.maxDur}s)`);
    }
  }

  const noImprove = results.filter(r => r.status === 'no-improvement');
  if (noImprove.length > 0) {
    console.log(`\nNo-improvement (${noImprove.length}):`);
    for (const r of noImprove.slice(0, 5)) {
      console.log(`  ${r.file}: ${r.oldCuts}→${r.newCuts}`);
    }
  }

  if (alignFail > 0) {
    console.log(`\nAlignment failures: ${alignFail} files (sentences couldn't map to <30s segments)`);
  }

  const errors = results.filter(r => r.status === 'error');
  if (errors.length > 0) {
    console.log(`\nErrors (${errors.length}):`);
    for (const r of errors.slice(0, 5)) {
      console.log(`  ${r.file}: ${r.error}`);
    }
  }

  // Final verification
  console.log('\n═══ Verification ═══');
  const afterBad = findBadFiles();
  const afterNotReseg = afterBad.filter(b => !resegFiles.has(b.file));
  console.log(`Bad files (not in reseg): ${toFix.length} → ${afterNotReseg.length}`);
  const totalCutsAfter = afterNotReseg.reduce((s, b) => s + b.cuts, 0);
  const totalCutsBefore = toFix.reduce((s, b) => s + b.cuts, 0);
  console.log(`Total cuts (not in reseg): ${totalCutsBefore} → ${totalCutsAfter}`);
}

main();
