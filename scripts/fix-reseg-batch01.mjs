/**
 * fix-reseg-batch01.mjs
 * Fix multi-sentence segments that were left unsplit by the previous (too conservative) agent.
 *
 * Rules:
 * - Split segments with 2+ sentences where duration > 3s
 * - Group short sentences so each part >= 1.5s
 * - Never create a part < 1.0s
 * - Distribute timing proportionally by character count
 * - Don't touch music/effects segments
 * - Don't touch segments <= 3s
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const TRANSCRIPTS_DIR = 'public/transcripts';
const REPORT_DIR = 'src/data/reseg-results';

const VIDEO_IDS = [
  '1pzV9GoSuys','1q-EkcmkYfE','1QQBB3cwNM0','1RfHsPlFfT0','1uRBxyPqkh0',
  '1WDW8XKEGgU','1WjwK3kUsyY','1xnJQ96juX8','1Y5JBB3BG_0','1Ylk2e-x--8',
  '1zOoWSvPVxk','21Ki96Lsxhc','2bujRZhOt9w','2cHOV5f9H0c','2dh8C_HHE2g',
  '2G89nIGH53g','2JkTrIVESVc','2ONo4fpnhII','2RB3edZyeYw','2swCX5-GE9E',
  '2Szzj6XN6pA','2tM1LFFxeKg','2Tpb1XyqGOQ','2Vv-BfVoq4g','2XKg3lsfxGU',
  '389nJrZjK1w','38FMDG7tiA4','3bQXPUQqn9Y','3cEg2HCl50I','3F8oJh3J1T0',
  '3fbhVPnhX-4','3HKOHxHDoGI','3ik6EwMNvXg','3mCN6dh16eU','3MP5qHvuHE0',
  '3nc6Tf26afI','3q0mxPLg39I','3Q9l8nI0xtA','3quvRb-vca8','3S517s7E4wk'
];

// Abbreviations that are NOT sentence boundaries
const ABBREVS = /(?:Dr|Mr|Mrs|Ms|St|Jr|Sr|Prof|Gen|Gov|Sgt|Cpl|Pvt|Lt|Col|Maj|Capt|Rev|Hon|U\.S|U\.K|U\.N|Inc|Ltd|Corp|vs|etc|approx|dept|est|govt|i\.e|e\.g)\./gi;

/**
 * Split English text into sentences at sentence boundaries.
 * A boundary: ". " or "! " or "? " followed by an uppercase letter or quote.
 * Abbreviations like "Mr.", "Dr.", etc. are NOT boundaries.
 */
function splitIntoSentences(text) {
  if (!text || text.trim() === '') return [text];

  // Replace abbreviations with placeholders to avoid false splits
  const placeholders = [];
  let processed = text.replace(/\b(?:Dr|Mr|Mrs|Ms|St|Jr|Sr|Prof|Gen|Gov|Sgt|Cpl|Pvt|Lt|Col|Maj|Capt|Rev|Hon|Inc|Ltd|Corp|vs|etc|approx|dept|est|govt)\./gi, (match) => {
    placeholders.push(match);
    return `__ABBR${placeholders.length - 1}__`;
  });

  // Also protect "U.S.", "U.K.", "U.N.", "i.e.", "e.g."
  processed = processed.replace(/\b(?:U\.S|U\.K|U\.N|i\.e|e\.g)\./gi, (match) => {
    placeholders.push(match);
    return `__ABBR${placeholders.length - 1}__`;
  });

  // Also protect "..." (ellipsis) - not a sentence boundary
  processed = processed.replace(/\.\.\./g, (match) => {
    placeholders.push(match);
    return `__ABBR${placeholders.length - 1}__`;
  });

  // Split at sentence boundaries: period/exclamation/question + space + uppercase letter or quote
  const parts = [];
  let current = '';

  for (let i = 0; i < processed.length; i++) {
    current += processed[i];

    // Check if we're at a sentence boundary
    if ((processed[i] === '.' || processed[i] === '!' || processed[i] === '?') &&
        i + 1 < processed.length && processed[i + 1] === ' ') {
      // Check what follows the space
      if (i + 2 < processed.length) {
        const nextChar = processed[i + 2];
        // Uppercase letter, quote, or opening bracket indicates new sentence
        if (/[A-Z"'\u201C\u201D(]/.test(nextChar)) {
          // This is a sentence boundary
          // Restore abbreviations in current part
          let restored = current;
          for (let j = 0; j < placeholders.length; j++) {
            restored = restored.replace(`__ABBR${j}__`, placeholders[j]);
          }
          parts.push(restored.trim());
          current = '';
          i++; // skip the space
          continue;
        }
      }
    }
  }

  // Add remaining text
  if (current.trim()) {
    let restored = current;
    for (let j = 0; j < placeholders.length; j++) {
      restored = restored.replace(`__ABBR${j}__`, placeholders[j]);
    }
    parts.push(restored.trim());
  }

  return parts.filter(s => s.length > 0);
}

/**
 * Split Korean text into sentences (best effort).
 */
function splitKoreanSentences(text) {
  if (!text || text.trim() === '') return [text];

  // Replace ... to avoid false splits
  const placeholders = [];
  let processed = text.replace(/\.\.\./g, (match) => {
    placeholders.push(match);
    return `__KP${placeholders.length - 1}__`;
  });

  // Split at Korean sentence endings: . ! ? followed by space
  const parts = [];
  let current = '';

  for (let i = 0; i < processed.length; i++) {
    current += processed[i];

    if ((processed[i] === '.' || processed[i] === '!' || processed[i] === '?') &&
        i + 1 < processed.length && processed[i + 1] === ' ') {
      let restored = current;
      for (let j = 0; j < placeholders.length; j++) {
        restored = restored.replace(`__KP${j}__`, placeholders[j]);
      }
      parts.push(restored.trim());
      current = '';
      i++; // skip space
      continue;
    }
  }

  if (current.trim()) {
    let restored = current;
    for (let j = 0; j < placeholders.length; j++) {
      restored = restored.replace(`__KP${j}__`, placeholders[j]);
    }
    parts.push(restored.trim());
  }

  return parts.filter(s => s.length > 0);
}

/**
 * Check if a segment is a music/effects segment.
 */
function isMusicOrEffects(en) {
  if (!en) return true;
  const trimmed = en.trim();
  return trimmed.startsWith('♪') || trimmed.startsWith('[') ||
         trimmed.toLowerCase().includes('[music]') ||
         trimmed.toLowerCase().includes('[applause]') ||
         trimmed === '';
}

/**
 * Group sentences so each group is >= minDuration.
 * Returns array of arrays of sentence indices.
 */
function groupSentences(sentences, totalDuration, minDuration = 1.5) {
  const n = sentences.length;
  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
  if (totalChars === 0) return [sentences.map((_, i) => i)];

  // Calculate duration for each sentence
  const durations = sentences.map(s => (s.length / totalChars) * totalDuration);

  // Check if individual sentences are long enough
  const allLongEnough = durations.every(d => d >= minDuration);

  if (allLongEnough) {
    // Each sentence can be its own group
    return sentences.map((_, i) => [i]);
  }

  // Need to group sentences together
  const groups = [];
  let currentGroup = [];
  let currentDuration = 0;

  for (let i = 0; i < n; i++) {
    currentGroup.push(i);
    currentDuration += durations[i];

    // Check if we should close this group
    const remainingSentences = n - i - 1;
    const remainingDuration = durations.slice(i + 1).reduce((s, d) => s + d, 0);

    if (currentDuration >= minDuration && remainingSentences > 0) {
      // Can we close this group and still have the rest be >= minDuration?
      if (remainingDuration >= minDuration) {
        groups.push([...currentGroup]);
        currentGroup = [];
        currentDuration = 0;
      }
    }
  }

  // Add remaining sentences
  if (currentGroup.length > 0) {
    // If current group would be too short, merge with previous
    if (currentDuration < 1.0 && groups.length > 0) {
      groups[groups.length - 1].push(...currentGroup);
    } else {
      groups.push(currentGroup);
    }
  }

  // Verify: every group should be >= 1.0s (hard minimum)
  // Recalculate group durations
  for (let g = 0; g < groups.length; g++) {
    const groupDur = groups[g].reduce((sum, idx) => sum + durations[idx], 0);
    if (groupDur < 1.0 && groups.length > 1) {
      // Merge with adjacent group
      if (g > 0) {
        groups[g - 1].push(...groups[g]);
        groups.splice(g, 1);
        g--;
      } else if (g < groups.length - 1) {
        groups[g].push(...groups[g + 1]);
        groups.splice(g + 1, 1);
      }
    }
  }

  return groups;
}

/**
 * Process a single segment, potentially splitting it.
 * Returns an array of segments (1 if no split, multiple if split).
 */
function processSegment(seg) {
  const { start, end, en, ko } = seg;
  const duration = end - start;

  // Skip music/effects
  if (isMusicOrEffects(en)) return [seg];

  // Skip short segments
  if (duration <= 3) return [seg];

  // Split into sentences
  const enSentences = splitIntoSentences(en);

  // Skip single-sentence segments
  if (enSentences.length < 2) return [seg];

  // Can we group sentences into parts >= 1.5s?
  const groups = groupSentences(enSentences, duration, 1.5);

  // If grouping resulted in just 1 group, no split needed
  if (groups.length < 2) return [seg];

  // Verify all groups would be >= 1.0s
  const totalChars = enSentences.reduce((sum, s) => sum + s.length, 0);
  if (totalChars === 0) return [seg];

  for (const group of groups) {
    const groupChars = group.reduce((sum, idx) => sum + enSentences[idx].length, 0);
    const groupDur = (groupChars / totalChars) * duration;
    if (groupDur < 1.0) return [seg]; // Would create too-short segment
  }

  // Split Korean text
  const koSentences = splitKoreanSentences(ko);

  // Build the split segments
  const result = [];
  let currentStart = start;

  for (let g = 0; g < groups.length; g++) {
    const group = groups[g];
    const groupEnText = group.map(idx => enSentences[idx]).join(' ');
    const groupChars = groupEnText.length;
    const groupDuration = (groupChars / totalChars) * duration;
    const groupEnd = g === groups.length - 1 ? end : Math.round((currentStart + groupDuration) * 10) / 10;

    // Try to align Korean sentences
    let groupKo = '';
    if (g === 0 && koSentences.length <= groups.length) {
      // Simple case: distribute ko sentences across groups if counts match
      groupKo = koSentences[g] || ko;
    } else if (koSentences.length === enSentences.length) {
      // Perfect 1:1 mapping
      groupKo = group.map(idx => koSentences[idx]).join(' ');
    } else if (koSentences.length >= groups.length) {
      // More ko sentences than groups - distribute proportionally
      const koPerGroup = Math.floor(koSentences.length / groups.length);
      const koExtra = koSentences.length % groups.length;
      let koStart = 0;
      for (let prevG = 0; prevG < g; prevG++) {
        koStart += koPerGroup + (prevG < koExtra ? 1 : 0);
      }
      const koCount = koPerGroup + (g < koExtra ? 1 : 0);
      const koEnd = Math.min(koStart + koCount, koSentences.length);

      if (g === groups.length - 1) {
        // Last group gets all remaining ko
        groupKo = koSentences.slice(koStart).join(' ');
      } else {
        groupKo = koSentences.slice(koStart, koEnd).join(' ');
      }
    } else {
      // Fewer ko sentences than groups
      if (g === 0) {
        groupKo = ko;
      } else {
        groupKo = '';
      }
    }

    result.push({
      start: Math.round(currentStart * 10) / 10,
      end: Math.round(groupEnd * 10) / 10,
      en: groupEnText,
      ko: groupKo || ''
    });

    currentStart = groupEnd;
  }

  return result;
}

/**
 * Process a single transcript file.
 * Returns { changed, splits, segsBefore, segsAfter }
 */
function processFile(videoId) {
  const filePath = join(TRANSCRIPTS_DIR, `${videoId}.json`);
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));

  const segsBefore = data.length;
  let totalSplits = 0;
  const newData = [];

  for (const seg of data) {
    const result = processSegment(seg);
    if (result.length > 1) {
      totalSplits++;
    }
    newData.push(...result);
  }

  const segsAfter = newData.length;
  const changed = totalSplits > 0;

  if (changed) {
    writeFileSync(filePath, JSON.stringify(newData, null, 2) + '\n');
  }

  return { changed, splits: totalSplits, segsBefore, segsAfter };
}

// Main
function main() {
  console.log(`Processing ${VIDEO_IDS.length} transcript files...\n`);

  let filesChanged = 0;
  let totalSplits = 0;
  const details = {};

  for (const videoId of VIDEO_IDS) {
    const result = processFile(videoId);

    if (result.changed) {
      filesChanged++;
      totalSplits += result.splits;
      details[videoId] = {
        splits: result.splits,
        segsBefore: result.segsBefore,
        segsAfter: result.segsAfter
      };
      console.log(`  ${videoId}: ${result.splits} splits (${result.segsBefore} -> ${result.segsAfter} segs)`);
    } else {
      console.log(`  ${videoId}: no changes`);
    }
  }

  // Write report
  if (!existsSync(REPORT_DIR)) {
    mkdirSync(REPORT_DIR, { recursive: true });
  }

  const report = {
    batch: '01',
    filesProcessed: VIDEO_IDS.length,
    filesChanged,
    totalSplits,
    details
  };

  writeFileSync(
    join(REPORT_DIR, 'fix2-batch-01.json'),
    JSON.stringify(report, null, 2) + '\n'
  );

  console.log(`\nDone! ${filesChanged}/${VIDEO_IDS.length} files changed, ${totalSplits} total splits.`);
  console.log(`Report written to ${REPORT_DIR}/fix2-batch-01.json`);
}

main();
