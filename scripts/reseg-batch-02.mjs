#!/usr/bin/env node
/**
 * Subtitle resegmentation script - Batch 02
 * Processes transcript JSON files to fix segment boundaries.
 *
 * Phase 1: Merge mid-sentence fragments into whole sentences
 * Phase 2: Apply segmentation rules (split multi-sentence, long segments, etc.)
 * Phase 3: Merge tiny fragments
 * Phase 4: Remove consecutive duplicates
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = 'C:/Users/hyunj/studyeng';
const TRANSCRIPTS_DIR = join(BASE, 'public/transcripts');
const OUTPUT_PATH = join(BASE, 'src/data/reseg-results/batch-02.json');

const VIDEO_IDS = [
  '1g7z6Aw4X1M', '1ipRd0WgB0c', '1ltymoURNLM', '1lWJXDG2i0A',
  '1mlFdXpcf9c', '1nCqRmx3Dnw', '1oKHoUfGH00', '1plPyJdXKIY',
  '1PY6xIDkIj4', '1pzV9GoSuys', '1q-EkcmkYfE', '1QQBB3cwNM0',
  '1RfHsPlFfT0', '1rJU2ZbRtv0', '1U6-eyq04Zg', '1uRBxyPqkh0',
  '1WDW8XKEGgU', '1WjwK3kUsyY', '1xnJQ96juX8', '1Y5JBB3BG_0',
  '1Ylk2e-x--8', '1z_GF0KAAkg', '1zOoWSvPVxk', '21Ki96Lsxhc',
  '221F55VPp2M', '24E2WNAvQNU', '2bujRZhOt9w', '2cHOV5f9H0c',
  '2D2TLWLu43Q', '2dh8C_HHE2g', '2DXR7Ny1qNE', '2fR-bXoby6c',
  '2G89nIGH53g', '2IaXJSJ6sIQ', '2JkTrIVESVc', '2M97rPDcPEg',
];

// Abbreviations that should NOT be treated as sentence boundaries
const ABBREVIATIONS = /(?:Dr|Mr|Mrs|Ms|Jr|Sr|St|vs|etc|e\.g|i\.e|U\.S|a\.m|p\.m)\./g;

// Music/effects patterns
function isMusicOrEffects(en) {
  const t = en.trim();
  return t.startsWith('\u266a') || /^\[(?:music|Music|applause|Applause|laughter|Laughter)/i.test(t)
    || /^\[.*\]$/.test(t);
}

// Check if file is predominantly song lyrics
function isLikelyLyrics(segments) {
  let musicCount = 0;
  for (const seg of segments) {
    if (isMusicOrEffects(seg.en)) musicCount++;
  }
  return musicCount > segments.length * 0.3;
}

/**
 * Check if a segment ends mid-sentence (no sentence-ending punctuation at end).
 */
function endsMidSentence(en) {
  const trimmed = en.trim();
  if (!trimmed) return false;
  const lastChar = trimmed[trimmed.length - 1];
  return !/[.!?]/.test(lastChar) && !/["\u201D\u2019]/.test(lastChar);
}

/**
 * Check if a segment starts mid-sentence (starts with lowercase).
 */
function startsMidSentence(en) {
  const trimmed = en.trim();
  if (!trimmed) return false;
  return /^[a-z]/.test(trimmed);
}

/**
 * Protect abbreviations, split at sentence boundaries, restore abbreviations.
 * Returns array of sentence strings.
 */
function splitSentences(text) {
  // Protect abbreviations
  let idx = 0;
  const placeholders = [];
  const protectedText = text.replace(ABBREVIATIONS, (match) => {
    const ph = `\x00ABBR${idx++}\x00`;
    placeholders.push({ ph, orig: match });
    return ph;
  });

  // Split at: .?! followed by optional quote/paren then space then uppercase letter
  const sentences = [];
  let current = '';
  for (let i = 0; i < protectedText.length; i++) {
    current += protectedText[i];
    if (/[.!?]/.test(protectedText[i])) {
      // Allow optional closing quote/paren after punctuation
      let j = i + 1;
      while (j < protectedText.length && /["\u201D\u2019)\]]/.test(protectedText[j])) {
        current += protectedText[j];
        j++;
      }
      // Check for space + uppercase
      if (j < protectedText.length && protectedText[j] === ' ' && j + 1 < protectedText.length && /[A-Z]/.test(protectedText[j + 1])) {
        let s = current.trim();
        for (const { ph, orig } of placeholders) s = s.replaceAll(ph, orig);
        if (s) sentences.push(s);
        current = '';
        i = j; // skip the space, next iteration picks up the capital letter
      } else {
        i = j - 1; // rewind to handle normally
      }
    }
  }
  if (current.trim()) {
    let s = current.trim();
    for (const { ph, orig } of placeholders) s = s.replaceAll(ph, orig);
    sentences.push(s);
  }
  return sentences;
}

/**
 * Split Korean text into sentences.
 * Korean sentence boundaries: . ! ? 。 and sometimes newlines.
 */
function splitKoreanSentences(ko) {
  if (!ko) return [''];
  // Split at sentence-ending punctuation followed by space
  const parts = [];
  let current = '';
  for (let i = 0; i < ko.length; i++) {
    current += ko[i];
    if (/[.!?。]/.test(ko[i])) {
      // Look ahead for space or end of string
      if (i === ko.length - 1 || ko[i + 1] === ' ') {
        parts.push(current.trim());
        current = '';
        if (ko[i + 1] === ' ') i++; // skip space
      }
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts.filter(Boolean);
}

/**
 * Distribute Korean sentences across English sentence splits.
 * Tries to match by count, then by proportional position.
 */
function distributeKorean(ko, enParts) {
  if (!ko || enParts.length <= 1) return [ko || ''];

  const koSentences = splitKoreanSentences(ko);

  // If counts match perfectly, direct mapping
  if (koSentences.length === enParts.length) {
    return koSentences;
  }

  // If more Korean sentences than English, distribute proportionally
  if (koSentences.length > enParts.length) {
    const result = [];
    const ratio = koSentences.length / enParts.length;
    for (let i = 0; i < enParts.length; i++) {
      const startIdx = Math.round(i * ratio);
      const endIdx = Math.round((i + 1) * ratio);
      result.push(koSentences.slice(startIdx, endIdx).join(' '));
    }
    return result;
  }

  // Fewer Korean sentences than English: distribute based on character position
  if (koSentences.length >= 2) {
    const totalEnChars = enParts.reduce((s, p) => s + p.length, 0);
    const result = [];
    let koIdx = 0;
    let enCharsSoFar = 0;
    const koBreakPoints = [];

    // Calculate proportional break points for Korean
    let koCharsSoFar = 0;
    for (let i = 0; i < koSentences.length - 1; i++) {
      koCharsSoFar += koSentences[i].length;
      koBreakPoints.push(koCharsSoFar / ko.length);
    }

    for (let i = 0; i < enParts.length; i++) {
      enCharsSoFar += enParts[i].length;
      const enRatio = enCharsSoFar / totalEnChars;

      // Collect Korean sentences that fit before this English ratio point
      let group = [];
      while (koIdx < koSentences.length - 1 && koBreakPoints[koIdx] <= enRatio + 0.05) {
        group.push(koSentences[koIdx]);
        koIdx++;
      }

      // Last English part gets remaining Korean
      if (i === enParts.length - 1) {
        while (koIdx < koSentences.length) {
          group.push(koSentences[koIdx]);
          koIdx++;
        }
      }

      result.push(group.join(' '));
    }
    return result;
  }

  // Only 1 Korean sentence for multiple English: put in first, empty rest
  const result = [ko];
  for (let i = 1; i < enParts.length; i++) result.push('');
  return result;
}

/**
 * Find the best clause boundary for splitting long single sentences.
 * Looks for ", conjunction" patterns closest to the middle.
 */
function findClauseBoundary(text) {
  const conjunctions = [', and ', ', but ', ', because ', ', which ', ', so ', ', or ', ', when ', ', if ', ', although ', ', while ', ', since ', ', though ', ', where ', ', then '];

  let bestIdx = -1;
  let bestDist = Infinity;
  const mid = text.length / 2;

  for (const conj of conjunctions) {
    let idx = text.indexOf(conj);
    while (idx !== -1) {
      const dist = Math.abs(idx - mid);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
      idx = text.indexOf(conj, idx + 1);
    }
  }
  return bestIdx;
}

/**
 * Split Korean at clause boundary proportional to English split.
 */
function splitKoreanAtClause(ko, enLen, splitIdx) {
  if (!ko) return [ko || '', ''];
  const ratio = splitIdx / enLen;
  const koMid = Math.round(ko.length * ratio);
  const range = Math.max(10, Math.round(ko.length * 0.2));

  let bestSplit = -1;
  let bestDist = Infinity;
  for (let i = Math.max(0, koMid - range); i < Math.min(ko.length, koMid + range); i++) {
    if (ko[i] === ',' || ko[i] === '.' || ko[i] === '。') {
      const d = Math.abs(i - koMid);
      if (d < bestDist) { bestDist = d; bestSplit = i; }
    }
  }
  if (bestSplit !== -1) {
    return [ko.slice(0, bestSplit + 1).trim(), ko.slice(bestSplit + 1).trim()];
  }
  return [ko, ''];
}

function round2(n) { return Math.round(n * 100) / 100; }

function processFile(videoId) {
  const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`);
  let segments;
  try {
    segments = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`  Failed to read ${videoId}: ${e.message}`);
    return null;
  }

  const segsBefore = segments.length;
  let splits = 0;
  let merges = 0;
  let dupsRemoved = 0;
  let changed = false;
  const lyricsFile = isLikelyLyrics(segments);

  // ========== PHASE 0: Merge mid-sentence fragments ==========
  // Some transcripts have segments cut mid-sentence (e.g., "modals with a" / "past meaning and...")
  // Merge them before applying segmentation rules.
  // Guards: don't merge across time gaps, don't create mega-segments, don't merge already-long segments.
  let merged0 = [];
  for (let i = 0; i < segments.length; i++) {
    const seg = { ...segments[i] };
    if (merged0.length > 0) {
      const prev = merged0[merged0.length - 1];
      const gap = seg.start - prev.end;
      const prevDur = prev.end - prev.start;
      const mergedDur = seg.end - prev.start;
      // If previous segment ends mid-sentence and this starts mid-sentence, merge
      // But only if: gap < 0.5s, merged wouldn't exceed 15s
      if (endsMidSentence(prev.en) && startsMidSentence(seg.en) && gap < 0.5 && mergedDur <= 15) {
        prev.end = seg.end;
        prev.en = prev.en.trim() + ' ' + seg.en.trim();
        prev.ko = [prev.ko, seg.ko].filter(Boolean).join(' ');
        merges++;
        changed = true;
        continue;
      }
    }
    merged0.push(seg);
  }

  // ========== PHASE 1: Remove consecutive duplicates ==========
  let deduped = [];
  for (let i = 0; i < merged0.length; i++) {
    if (i > 0 && merged0[i].en === merged0[i - 1].en) {
      dupsRemoved++;
      changed = true;
      continue;
    }
    deduped.push({ ...merged0[i] });
  }

  // ========== PHASE 2: Split segments ==========
  let processed = [];
  for (const seg of deduped) {
    const duration = seg.end - seg.start;
    const en = seg.en;
    const ko = seg.ko;

    // Case H: Music/effects
    if (isMusicOrEffects(en)) { processed.push(seg); continue; }
    // Case I: Song lyrics
    if (lyricsFile) { processed.push(seg); continue; }

    const sentences = splitSentences(en);

    if (sentences.length >= 2 && duration > 3) {
      // Case A: Multi-sentence, duration > 3s
      const totalChars = sentences.reduce((s, p) => s + p.length, 0);
      const minSegDur = Math.min(...sentences.map(s => (s.length / totalChars) * duration));

      if (minSegDur >= 1.2) {
        // All splits are long enough -- split directly
        const koParts = distributeKorean(ko, sentences);
        let currentStart = seg.start;
        for (let i = 0; i < sentences.length; i++) {
          const ratio = sentences[i].length / totalChars;
          const segEnd = (i === sentences.length - 1) ? seg.end : round2(currentStart + ratio * duration);
          processed.push({ start: round2(currentStart), end: segEnd, en: sentences[i], ko: koParts[i] || '' });
          currentStart = segEnd;
        }
        splits += sentences.length - 1;
        changed = true;
        continue;
      }

      // Some segments too short -- group short sentences together
      const koParts = distributeKorean(ko, sentences);
      const groups = [];
      let grp = { enParts: [], koParts: [], chars: 0 };
      for (let i = 0; i < sentences.length; i++) {
        grp.enParts.push(sentences[i]);
        grp.koParts.push(koParts[i] || '');
        grp.chars += sentences[i].length;
        const gDur = (grp.chars / totalChars) * duration;
        if (gDur >= 1.5 || i === sentences.length - 1) {
          groups.push(grp);
          grp = { enParts: [], koParts: [], chars: 0 };
        }
      }
      // Merge last group if too small
      if (groups.length > 1) {
        const last = groups[groups.length - 1];
        if ((last.chars / totalChars) * duration < 1.5) {
          const prev = groups[groups.length - 2];
          prev.enParts.push(...last.enParts);
          prev.koParts.push(...last.koParts);
          prev.chars += last.chars;
          groups.pop();
        }
      }
      if (groups.length > 1) {
        let currentStart = seg.start;
        const totalGroupChars = groups.reduce((s, g) => s + g.chars, 0);
        for (let i = 0; i < groups.length; i++) {
          const ratio = groups[i].chars / totalGroupChars;
          const segEnd = (i === groups.length - 1) ? seg.end : round2(currentStart + ratio * duration);
          processed.push({
            start: round2(currentStart),
            end: segEnd,
            en: groups[i].enParts.join(' '),
            ko: groups[i].koParts.filter(Boolean).join(' '),
          });
          currentStart = segEnd;
        }
        splits += groups.length - 1;
        changed = true;
        continue;
      }
      // Fallthrough if only 1 group
    }

    // Case B: Multi-sentence, duration <= 3s => keep as is
    if (sentences.length >= 2 && duration <= 3) {
      processed.push(seg);
      continue;
    }

    // Single sentence cases
    if (sentences.length <= 1) {
      if (duration > 8) {
        // Case C: > 8s single sentence, split at clause boundary
        const ci = findClauseBoundary(en);
        if (ci !== -1) {
          const firstEn = en.slice(0, ci + 1).trim();
          const secondEn = en.slice(ci + 2).trim();
          const firstRatio = firstEn.length / en.length;
          const firstDur = firstRatio * duration;
          const secondDur = duration - firstDur;
          if (firstDur >= 3 && secondDur >= 3) {
            const [fKo, sKo] = splitKoreanAtClause(ko, en.length, ci);
            const splitTime = round2(seg.start + firstDur);
            processed.push({ start: seg.start, end: splitTime, en: firstEn, ko: fKo });
            processed.push({ start: splitTime, end: seg.end, en: secondEn, ko: sKo });
            splits++;
            changed = true;
            continue;
          }
        }
      } else if (duration >= 6 && duration <= 8) {
        // Case D: 6-8s single sentence, split at clause boundary
        const ci = findClauseBoundary(en);
        if (ci !== -1) {
          const firstEn = en.slice(0, ci + 1).trim();
          const secondEn = en.slice(ci + 2).trim();
          const firstRatio = firstEn.length / en.length;
          const firstDur = firstRatio * duration;
          const secondDur = duration - firstDur;
          if (firstDur >= 3 && secondDur >= 3) {
            const [fKo, sKo] = splitKoreanAtClause(ko, en.length, ci);
            const splitTime = round2(seg.start + firstDur);
            processed.push({ start: seg.start, end: splitTime, en: firstEn, ko: fKo });
            processed.push({ start: splitTime, end: seg.end, en: secondEn, ko: sKo });
            splits++;
            changed = true;
            continue;
          }
        }
      }
      // Cases E/F: < 6s or no good split point
    }
    processed.push(seg);
  }

  // ========== PHASE 2.5: Post-split mid-sentence merge ==========
  // After splitting multi-sentence segments, some residual mid-sentence fragments
  // may exist (from original bad segmentation). Merge them with adjacent segments.
  let postMerged = [];
  for (let i = 0; i < processed.length; i++) {
    const seg = { ...processed[i] };
    if (postMerged.length > 0) {
      const prev = postMerged[postMerged.length - 1];
      const gap = seg.start - prev.end;
      const mergedDur = seg.end - prev.start;
      if (endsMidSentence(prev.en) && startsMidSentence(seg.en) && gap < 0.5 && mergedDur <= 12) {
        prev.end = seg.end;
        prev.en = prev.en.trim() + ' ' + seg.en.trim();
        prev.ko = [prev.ko, seg.ko].filter(Boolean).join(' ');
        merges++;
        changed = true;
        continue;
      }
    }
    postMerged.push(seg);
  }
  processed = postMerged;

  // ========== PHASE 3: Merge tiny fragments ==========
  let merged = [];
  for (let i = 0; i < processed.length; i++) {
    const seg = processed[i];
    const dur = seg.end - seg.start;
    const words = seg.en.trim().split(/\s+/).length;

    if (words <= 2 && dur < 1.5 && !isMusicOrEffects(seg.en)) {
      if (merged.length > 0 && !/[.!?]$/.test(merged[merged.length - 1].en.trim())) {
        // Merge with previous (it doesn't end with punctuation)
        const prev = merged[merged.length - 1];
        prev.end = seg.end;
        prev.en = prev.en + ' ' + seg.en;
        prev.ko = [prev.ko, seg.ko].filter(Boolean).join(' ');
        merges++;
        changed = true;
        continue;
      } else if (i + 1 < processed.length) {
        // Merge with next
        const next = processed[i + 1];
        next.start = seg.start;
        next.en = seg.en + ' ' + next.en;
        next.ko = [seg.ko, next.ko].filter(Boolean).join(' ');
        merges++;
        changed = true;
        continue;
      }
    }
    merged.push(seg);
  }

  // ========== PHASE 4: Final dedup ==========
  let final = [];
  for (let j = 0; j < merged.length; j++) {
    if (j > 0 && merged[j].en === merged[j - 1].en) {
      dupsRemoved++;
      changed = true;
      continue;
    }
    final.push(merged[j]);
  }

  if (!changed) return null;

  writeFileSync(filePath, JSON.stringify(final, null, 2) + '\n', 'utf-8');
  return { splits, merges, dupsRemoved, segsBefore, segsAfter: final.length };
}

// ========== Main ==========
const report = {
  batch: '02',
  filesProcessed: VIDEO_IDS.length,
  filesChanged: 0,
  totalSplits: 0,
  totalMerges: 0,
  totalDupsRemoved: 0,
  details: {},
};

for (const videoId of VIDEO_IDS) {
  console.log(`Processing ${videoId}...`);
  const result = processFile(videoId);
  if (result) {
    report.filesChanged++;
    report.totalSplits += result.splits;
    report.totalMerges += result.merges;
    report.totalDupsRemoved += result.dupsRemoved;
    report.details[videoId] = result;
    console.log(`  => Changed: +${result.splits} splits, +${result.merges} merges, -${result.dupsRemoved} dups (${result.segsBefore} -> ${result.segsAfter} segs)`);
  } else {
    console.log(`  => No changes needed`);
  }
}

writeFileSync(OUTPUT_PATH, JSON.stringify(report, null, 2) + '\n', 'utf-8');
console.log(`\nDone. Report: ${OUTPUT_PATH}`);
console.log(`Changed: ${report.filesChanged}/${report.filesProcessed}`);
console.log(`Splits: ${report.totalSplits}, Merges: ${report.totalMerges}, Dups removed: ${report.totalDupsRemoved}`);
