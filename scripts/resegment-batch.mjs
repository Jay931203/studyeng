#!/usr/bin/env node
/**
 * Subtitle re-segmentation script for Shortee.
 * Processes transcript JSON files and fixes segmentation per rules.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TRANSCRIPTS_DIR = join(process.cwd(), 'public/transcripts');
const OUTPUT_DIR = join(process.cwd(), 'src/data/reseg-results');

const VIDEO_IDS = [
  '0AhpcCST5xY', '0aZOOcTt0E4', '0b-H8oQUs1A', '0c2w8i1KOd8',
  '0cgbqOq6tZw', '0CzTetpGBi8', '0D8nRpJsQlk', '0dsvhatg29s',
  '0Dyl2mpd9F0', '0EGPLZ2AnIw', '-0EiP69JURo', '0fMuMs4ouLs',
  '0FSGPPB39P0', '0FSKTndbwVo', '0h19anH4MdE', '0habxsuXW4g',
  '0Hrnnt7Mxc0', '0Kvw2BPKjz0', '0mapwWviBEM', '0mQ_hMx6KTY',
  '-0n9wcJJzWA', '0Nz8YrCC9X8', '0SSJKsZiWHg', '0TIrnxSYSIQ',
  '0u8KUgUqprw', '0WqBCG_-udw', '10GhbNjRgRs', '13wEuXLk958',
  '15pqpVbhs0c', '18-LLjQBGko', '1aA1WGON49E', '1bH4sagx8tI',
  '1BmLvIjyMd4', '1C5lc2GIisQ', '1DKFrDtEVWI', '1Ec3rMMLyWg'
];

// ─── Abbreviation-aware sentence splitting ───────────────────────────

const ABBREVIATIONS = /(?:Dr|Mr|Mrs|Ms|U\.S|St|Jr|Sr|vs|Prof|Gen|Gov|Lt|Sgt|Cpl|Pvt|Rev|Hon|Inc|Ltd|Corp|Co|No|Vol|Dept|Est|Approx|etc|i\.e|e\.g)$/;

/**
 * Split English text into sentences, respecting abbreviations and ellipsis.
 * Returns array of sentence strings.
 */
function splitIntoSentences(text) {
  // Find all potential sentence boundaries: .!? followed by space and capital letter
  const sentences = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    current += text[i];

    if ((text[i] === '.' || text[i] === '!' || text[i] === '?') &&
        i + 1 < text.length && text[i + 1] === ' ' &&
        i + 2 < text.length && /[A-Z]/.test(text[i + 2])) {

      // Skip ellipsis: if this period is preceded by another period, it's "..." not a sentence end
      if (text[i] === '.') {
        if (i >= 1 && text[i - 1] === '.') {
          continue; // Part of ellipsis (.., ..., etc.)
        }

        // Check if this period is part of an abbreviation
        const beforePeriod = current.slice(0, -1).trim();
        const lastWord = beforePeriod.split(/\s+/).pop() || '';
        if (ABBREVIATIONS.test(lastWord)) {
          continue; // Not a sentence boundary
        }
      }

      sentences.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    sentences.push(current.trim());
  }

  return sentences;
}

/**
 * Split Korean text at sentence boundaries to match English splits.
 * Returns array of ko strings, padded with "" if needed.
 */
function splitKorean(ko, enSentenceCount) {
  if (!ko || enSentenceCount <= 1) return [ko];

  // Split Korean by iterating through the string character by character.
  // A sentence boundary is: a single . or ! or ? followed by a space,
  // but NOT ellipsis (...) or multiple punctuation.
  const koParts = [];
  let current = '';

  for (let i = 0; i < ko.length; i++) {
    current += ko[i];
    const ch = ko[i];

    // Check for sentence-ending punctuation followed by space
    if ((ch === '.' || ch === '!' || ch === '?') &&
        i + 1 < ko.length && ko[i + 1] === ' ') {

      // Skip ellipsis: check if this dot is part of ".." or "..."
      if (ch === '.') {
        if ((i >= 1 && ko[i - 1] === '.') || (i + 1 < ko.length && ko[i + 1] === '.')) {
          continue; // Part of ellipsis
        }
      }

      // This looks like a real sentence boundary
      koParts.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    koParts.push(current.trim());
  }

  // If we got matching count, use it
  if (koParts.length === enSentenceCount) {
    return koParts;
  }

  // If we can't cleanly split, put all in first and empty for rest
  const result = [ko];
  for (let i = 1; i < enSentenceCount; i++) {
    result.push('');
  }
  return result;
}

/**
 * Distribute time proportionally by character count.
 * Returns array of {start, end} objects.
 */
function distributeTime(start, end, texts) {
  const totalDuration = end - start;
  const totalChars = texts.reduce((sum, t) => sum + t.length, 0);

  if (totalChars === 0) {
    // Edge case: equal distribution
    const each = totalDuration / texts.length;
    return texts.map((_, i) => ({
      start: round2(start + i * each),
      end: round2(start + (i + 1) * each)
    }));
  }

  const times = [];
  let currentStart = start;

  for (let i = 0; i < texts.length; i++) {
    const proportion = texts[i].length / totalChars;
    const duration = totalDuration * proportion;
    const segEnd = (i === texts.length - 1) ? end : round2(currentStart + duration);
    times.push({ start: round2(currentStart), end: segEnd });
    currentStart = segEnd;
  }

  return times;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Check if segment is music/effects
 */
function isMusicOrEffects(en) {
  if (!en) return false;
  const trimmed = en.trim();
  return trimmed.startsWith('♪') ||
         trimmed.toLowerCase().startsWith('[music') ||
         trimmed.toLowerCase().startsWith('[applause') ||
         trimmed.toLowerCase().startsWith('[singing') ||
         trimmed.toLowerCase().startsWith('[laughter') ||
         /^\[.*\]$/.test(trimmed);
}

/**
 * Check if text looks like song lyrics (heuristic: lines with ♪)
 */
function isSongLyrics(en) {
  return en && en.includes('♪');
}

/**
 * Find clause boundary for splitting long single sentences.
 * Returns index of the comma before the conjunction, or -1.
 */
function findClauseBoundary(text) {
  const conjunctions = [', and ', ', but ', ', because ', ', which ', ', so ', ', or ', ', when ', ', if ', ', although ', ', since ', ', while ', ', though ', ', yet '];

  let bestIdx = -1;
  let bestMid = Infinity; // prefer split closest to middle
  const mid = text.length / 2;

  for (const conj of conjunctions) {
    let idx = text.indexOf(conj);
    while (idx !== -1) {
      const splitPoint = idx + 2; // after ", "
      const distFromMid = Math.abs(splitPoint - mid);
      if (distFromMid < bestMid) {
        bestMid = distFromMid;
        bestIdx = idx;
      }
      idx = text.indexOf(conj, idx + 1);
    }
  }

  return bestIdx;
}

// ─── Main Processing ─────────────────────────────────────────────────

function processTranscript(segments) {
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;
  const segsBefore = segments.length;

  let result = JSON.parse(JSON.stringify(segments)); // deep clone

  // Pass 1: Remove consecutive duplicates
  let deduped = [];
  for (let i = 0; i < result.length; i++) {
    if (i > 0 && result[i].en === result[i - 1].en) {
      dupsRemoved++;
      continue;
    }
    deduped.push(result[i]);
  }
  result = deduped;

  // Pass 2: Split multi-sentence segments and long segments
  let expanded = [];
  for (let i = 0; i < result.length; i++) {
    const seg = result[i];
    const duration = seg.end - seg.start;
    const en = (seg.en || '').trim();

    // Case H: Music/effects - skip
    if (isMusicOrEffects(en) || isSongLyrics(en)) {
      expanded.push(seg);
      continue;
    }

    // Try sentence split
    const sentences = splitIntoSentences(en);

    if (sentences.length >= 2) {
      // Case A: Multi-sentence, duration > 3s → split
      if (duration > 3) {
        // Check if any split would be < 1.5s
        const times = distributeTime(seg.start, seg.end, sentences);
        const allLongEnough = times.every(t => (t.end - t.start) >= 1.5);

        if (allLongEnough) {
          const koParts = splitKorean(seg.ko, sentences.length);

          for (let j = 0; j < sentences.length; j++) {
            expanded.push({
              start: times[j].start,
              end: times[j].end,
              en: sentences[j],
              ko: koParts[j] || ''
            });
          }
          splits += sentences.length - 1;
          continue;
        } else {
          // Some segments too short - try grouping short ones together
          // Merge segments that would be < 1.5s with adjacent ones
          let groups = [];
          let currentGroup = { sentences: [sentences[0]], startIdx: 0 };

          for (let j = 1; j < sentences.length; j++) {
            const t = times[j];
            if ((t.end - t.start) < 1.5) {
              currentGroup.sentences.push(sentences[j]);
            } else {
              groups.push(currentGroup);
              currentGroup = { sentences: [sentences[j]], startIdx: j };
            }
          }
          groups.push(currentGroup);

          // Check first group
          if (groups.length > 1 && groups[0].sentences.length === 1) {
            const firstTime = times[0];
            if ((firstTime.end - firstTime.start) < 1.5) {
              groups[1].sentences = [...groups[0].sentences, ...groups[1].sentences];
              groups[1].startIdx = 0;
              groups.shift();
            }
          }

          if (groups.length > 1) {
            // Rebuild merged sentence texts
            const mergedTexts = groups.map(g => g.sentences.join(' '));
            const newTimes = distributeTime(seg.start, seg.end, mergedTexts);
            const koParts = splitKorean(seg.ko, mergedTexts.length);

            for (let j = 0; j < mergedTexts.length; j++) {
              expanded.push({
                start: newTimes[j].start,
                end: newTimes[j].end,
                en: mergedTexts[j],
                ko: koParts[j] || ''
              });
            }
            splits += mergedTexts.length - 1;
            continue;
          }
          // If all groups merged into one, fall through (keep as is)
        }
      }
      // Case B: Multi-sentence, duration <= 3s → keep as is
      expanded.push(seg);
      continue;
    }

    // Single sentence cases
    // Case C: duration > 8s → split at clause boundary
    if (duration > 8) {
      const clauseIdx = findClauseBoundary(en);
      if (clauseIdx !== -1) {
        const part1 = en.slice(0, clauseIdx + 1).trim(); // include the comma
        const part2 = en.slice(clauseIdx + 2).trim(); // skip ", "

        const times = distributeTime(seg.start, seg.end, [part1, part2]);

        // Only split if each part >= 3s
        if ((times[0].end - times[0].start) >= 3 && (times[1].end - times[1].start) >= 3) {
          const koParts = splitKorean(seg.ko, 2);
          expanded.push({
            start: times[0].start,
            end: times[0].end,
            en: part1,
            ko: koParts[0] || ''
          });
          expanded.push({
            start: times[1].start,
            end: times[1].end,
            en: part2,
            ko: koParts[1] || ''
          });
          splits++;
          continue;
        }
      }
      expanded.push(seg);
      continue;
    }

    // Case D: duration 5-8s → only split if >= 6s and clear clause boundary
    if (duration >= 5 && duration <= 8) {
      if (duration >= 6) {
        const clauseIdx = findClauseBoundary(en);
        if (clauseIdx !== -1) {
          const part1 = en.slice(0, clauseIdx + 1).trim();
          const part2 = en.slice(clauseIdx + 2).trim();

          const times = distributeTime(seg.start, seg.end, [part1, part2]);

          // Only split if each part >= 3s
          if ((times[0].end - times[0].start) >= 3 && (times[1].end - times[1].start) >= 3) {
            const koParts = splitKorean(seg.ko, 2);
            expanded.push({
              start: times[0].start,
              end: times[0].end,
              en: part1,
              ko: koParts[0] || ''
            });
            expanded.push({
              start: times[1].start,
              end: times[1].end,
              en: part2,
              ko: koParts[1] || ''
            });
            splits++;
            continue;
          }
        }
      }
      expanded.push(seg);
      continue;
    }

    // Case E/F: < 5s → no change
    expanded.push(seg);
  }

  result = expanded;

  // Pass 3: Merge fragments (≤ 2 words, < 1.5s)
  let merged = [];
  let skipNext = false;

  for (let i = 0; i < result.length; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }

    const seg = result[i];
    const duration = seg.end - seg.start;
    const en = (seg.en || '').trim();
    const wordCount = en.split(/\s+/).filter(w => w.length > 0).length;

    // Case G: Fragment
    if (wordCount <= 2 && duration < 1.5 && !isMusicOrEffects(en)) {
      // Check if previous segment doesn't end with sentence punctuation
      // Also check there's no large time gap (> 2s) between segments
      if (merged.length > 0) {
        const prev = merged[merged.length - 1];
        const prevEn = (prev.en || '').trim();
        const endsWithPunct = /[.!?]$/.test(prevEn);
        const gapFromPrev = seg.start - prev.end;

        if (!endsWithPunct && gapFromPrev < 2) {
          // Merge with previous
          prev.en = prevEn + ' ' + en;
          prev.ko = ((prev.ko || '') + ' ' + (seg.ko || '')).trim();
          prev.end = seg.end;
          merges++;
          continue;
        }
      }

      // Try merge with next (only if gap is small)
      if (i + 1 < result.length) {
        const next = result[i + 1];
        const gapToNext = next.start - seg.end;

        if (gapToNext < 2) {
          merged.push({
            start: seg.start,
            end: next.end,
            en: en + ' ' + (next.en || '').trim(),
            ko: ((seg.ko || '') + ' ' + (next.ko || '')).trim()
          });
          merges++;
          skipNext = true;
          continue;
        }
      }
    }

    merged.push(seg);
  }

  result = merged;

  const segsAfter = result.length;
  const changed = splits > 0 || merges > 0 || dupsRemoved > 0;

  return {
    result,
    stats: { splits, merges, dupsRemoved, segsBefore, segsAfter },
    changed
  };
}

// ─── Main ────────────────────────────────────────────────────────────

function main() {
  const report = {
    batch: '01',
    filesProcessed: 0,
    filesChanged: 0,
    totalSplits: 0,
    totalMerges: 0,
    totalDupsRemoved: 0,
    details: {}
  };

  for (const videoId of VIDEO_IDS) {
    const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`);

    try {
      const raw = readFileSync(filePath, 'utf-8');
      const segments = JSON.parse(raw);
      report.filesProcessed++;

      const { result, stats, changed } = processTranscript(segments);

      if (changed) {
        writeFileSync(filePath, JSON.stringify(result, null, 2) + '\n', 'utf-8');
        report.filesChanged++;
        report.totalSplits += stats.splits;
        report.totalMerges += stats.merges;
        report.totalDupsRemoved += stats.dupsRemoved;
        report.details[videoId] = stats;

        console.log(`[CHANGED] ${videoId}: +${stats.splits} splits, +${stats.merges} merges, -${stats.dupsRemoved} dups (${stats.segsBefore} → ${stats.segsAfter} segs)`);
      } else {
        console.log(`[OK] ${videoId}: no changes needed`);
      }
    } catch (err) {
      console.error(`[ERROR] ${videoId}: ${err.message}`);
    }
  }

  // Write report
  const reportPath = join(OUTPUT_DIR, 'batch-01.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');

  console.log('\n--- Summary ---');
  console.log(`Files processed: ${report.filesProcessed}`);
  console.log(`Files changed: ${report.filesChanged}`);
  console.log(`Total splits: ${report.totalSplits}`);
  console.log(`Total merges: ${report.totalMerges}`);
  console.log(`Total dups removed: ${report.totalDupsRemoved}`);
  console.log(`Report written to: ${reportPath}`);
}

main();
