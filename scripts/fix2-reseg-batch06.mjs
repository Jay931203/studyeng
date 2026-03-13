/**
 * fix2-reseg-batch06.mjs
 * Splits multi-sentence segments (>3s, 2+ sentences) in 40 transcript files.
 *
 * Rules:
 * - If each sentence >= 1.5s proportionally -> split individually
 * - If each sentence < 1.5s -> group 2-3 sentences so each group >= 1.5s
 * - Never leave 3+ sentences in one segment if total allows >= 1.5s groups
 * - Timing: proportional by char count, round to 1 decimal, min 1.0s
 * - Korean: split at matching boundary if possible, else full ko in first, "" for rest
 * - Skip: segments <= 3s, single-sentence, music/effects (♪, [, etc.)
 */

import fs from 'fs';
import path from 'path';

const TRANSCRIPTS_DIR = 'C:/Users/hyunj/studyeng/public/transcripts';
const RESULTS_DIR = 'C:/Users/hyunj/studyeng/src/data/reseg-results';

const FILE_IDS = [
  'cYGuWN1OhD8','CyOmCdtRrgo','D1JZBseDjfU','D3tYM5zVvJU','d4ftmOI5NnI',
  'd7ONQzygvB0','d8uTB5XorBw','D9MS2y2YU_o','D9tAKLTktY0','DA2ukcfd9Vo',
  'DbCM6WvB57c','DdjWGbPUmrg','DGbIzSq4eWA','dGIGG6QLjLg','DIIIDF6bkqI',
  'dJbntFepz0o','DLzxrzFCyOs','dMbnfxwus0s','DNXGUn0Yrb8','dOkyKyVFnSs',
  'dQw4w9WgXcQ','DsNvk7heXgI','DtRhrfhP5b4','DvkYRhu-TP0','dVmOvmH4dL4',
  'DVrFuGJ2QjQ','DvtxOzO6OAE','DVWyxC64FcA','DW4Q9bdE_BY','Dwiczhta4e0',
  'Dwnl43ASLBA','dx5jTXNnCZw','E1I0hAxGFXw','e1KEC_3vygc','e2zyjbH9zzA',
  'e5BFR-E-ae0','e6Funs6yyEw','E6LpBIwGyA4','EApCLbgAE5E','eazNXtXuohc'
];

// Abbreviations that are NOT sentence boundaries
const ABBREVS = ['Dr.', 'Mr.', 'Mrs.', 'Ms.', 'St.', 'U.S.', 'Jr.', 'Sr.'];

/**
 * Split English text into sentences.
 * Boundary: period/question/exclamation + space + uppercase letter
 * Except abbreviations.
 */
function splitSentences(text) {
  if (!text || text.trim().length === 0) return [text];

  // Build a regex that matches sentence-ending punctuation followed by space and uppercase
  // but NOT after known abbreviations
  const sentences = [];
  let current = '';
  let i = 0;

  while (i < text.length) {
    current += text[i];

    // Check if we're at a sentence boundary
    if ((text[i] === '.' || text[i] === '!' || text[i] === '?') &&
        i + 2 < text.length &&
        text[i + 1] === ' ' &&
        text[i + 2] >= 'A' && text[i + 2] <= 'Z') {

      // Check if this period is part of an abbreviation
      let isAbbrev = false;
      for (const abbr of ABBREVS) {
        if (current.endsWith(abbr)) {
          isAbbrev = true;
          break;
        }
      }

      if (!isAbbrev) {
        sentences.push(current.trim());
        current = '';
        i++; // skip the space
        i++; // continue from uppercase
        continue;
      }
    }
    i++;
  }

  if (current.trim()) {
    sentences.push(current.trim());
  }

  return sentences.filter(s => s.length > 0);
}

/**
 * Try to split Korean text at matching sentence boundaries.
 * Korean sentences often end with . ! ? or Korean-specific endings.
 */
function splitKorean(ko, numParts) {
  if (!ko || numParts <= 1) return [ko];

  // Try splitting Korean by sentence-ending punctuation
  const koParts = [];
  const koSentences = ko.split(/(?<=[.!?。])\s+/).filter(s => s.trim());

  if (koSentences.length >= numParts) {
    // Distribute Korean sentences among parts
    const perPart = Math.floor(koSentences.length / numParts);
    const extra = koSentences.length % numParts;
    let idx = 0;
    for (let p = 0; p < numParts; p++) {
      const count = perPart + (p < extra ? 1 : 0);
      const chunk = koSentences.slice(idx, idx + count).join(' ');
      koParts.push(chunk);
      idx += count;
    }
    return koParts;
  }

  // Not enough Korean sentences - put full ko in first, "" for rest
  const result = [ko];
  for (let i = 1; i < numParts; i++) {
    result.push('');
  }
  return result;
}

/**
 * Group sentences so each group is >= 1.5s
 * Returns array of { sentences: string[], charCount: number }
 */
function groupSentences(sentences, totalDuration, totalChars) {
  if (sentences.length <= 1) return [sentences];

  const charCounts = sentences.map(s => s.length);
  const groups = [];
  let currentGroup = [];
  let currentChars = 0;

  for (let i = 0; i < sentences.length; i++) {
    currentGroup.push(sentences[i]);
    currentChars += charCounts[i];

    // Calculate duration for current group
    const groupDuration = (currentChars / totalChars) * totalDuration;

    // Check if remaining sentences need to be considered
    const remainingChars = charCounts.slice(i + 1).reduce((a, b) => a + b, 0);
    const remainingDuration = (remainingChars / totalChars) * totalDuration;
    const remainingSentences = sentences.length - i - 1;

    if (groupDuration >= 1.5 && remainingSentences > 0) {
      // If remaining can form valid groups, commit this group
      if (remainingDuration >= 1.0) {
        groups.push([...currentGroup]);
        currentGroup = [];
        currentChars = 0;
      }
    }
  }

  // Add any remaining
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  // Validate: merge tiny trailing groups
  while (groups.length > 1) {
    const lastGroup = groups[groups.length - 1];
    const lastChars = lastGroup.join(' ').length;
    const lastDur = (lastChars / totalChars) * totalDuration;
    if (lastDur < 1.0) {
      const merged = groups.pop();
      groups[groups.length - 1].push(...merged);
    } else {
      break;
    }
  }

  return groups;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

/**
 * Process a single segment, returning array of segments (1 if no split needed)
 */
function processSegment(seg) {
  const duration = seg.end - seg.start;

  // Skip: <=3s
  if (duration <= 3) return [seg];

  // Skip: music/effects
  if (seg.en.includes('♪') || seg.en.startsWith('[') || seg.en.startsWith('(')) return [seg];

  const sentences = splitSentences(seg.en);

  // Skip: single sentence
  if (sentences.length < 2) return [seg];

  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);

  // Check if proportional split gives each sentence >= 1.5s
  const sentDurations = sentences.map(s => (s.length / totalChars) * duration);
  const allAboveMin = sentDurations.every(d => d >= 1.5);

  let groups;
  if (allAboveMin) {
    // Split individually
    groups = sentences.map(s => [s]);
  } else {
    // Group sentences so each group >= 1.5s
    groups = groupSentences(sentences, duration, totalChars);
  }

  // If grouping didn't actually split, return original
  if (groups.length <= 1) return [seg];

  // Build English text for each group
  const groupTexts = groups.map(g => g.join(' '));
  const groupCharCounts = groupTexts.map(t => t.length);
  const groupTotalChars = groupCharCounts.reduce((a, b) => a + b, 0);

  // Split Korean
  const koParts = splitKorean(seg.ko, groups.length);

  // Calculate timing proportionally
  const result = [];
  let currentStart = seg.start;

  for (let i = 0; i < groups.length; i++) {
    let segDuration;
    if (i === groups.length - 1) {
      // Last segment gets remaining time
      segDuration = seg.end - currentStart;
    } else {
      segDuration = (groupCharCounts[i] / groupTotalChars) * duration;
      // Enforce min 1.0s
      segDuration = Math.max(segDuration, 1.0);
    }

    const segEnd = i === groups.length - 1
      ? seg.end
      : round1(currentStart + segDuration);

    // Ensure end doesn't exceed original end
    const clampedEnd = Math.min(segEnd, seg.end);

    // Ensure valid segment (at least 1.0s unless it's the last)
    if (clampedEnd - currentStart < 0.5 && i < groups.length - 1) {
      // Too short, merge with next group
      groups[i + 1] = [...groups[i], ...groups[i + 1]];
      groupTexts[i + 1] = groups[i + 1].join(' ');
      groupCharCounts[i + 1] = groupTexts[i + 1].length;
      if (koParts[i] && koParts[i + 1] !== undefined) {
        koParts[i + 1] = koParts[i] + (koParts[i + 1] ? ' ' + koParts[i + 1] : '');
      }
      continue;
    }

    result.push({
      start: round1(currentStart),
      end: round1(clampedEnd),
      en: groupTexts[i],
      ko: koParts[i] || ''
    });

    currentStart = round1(clampedEnd);
  }

  return result;
}

/**
 * Process a single file
 */
function processFile(fileId) {
  const filePath = path.join(TRANSCRIPTS_DIR, fileId + '.json');

  if (!fs.existsSync(filePath)) {
    return { error: 'file not found' };
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const segsBefore = data.length;
  let splits = 0;

  const newData = [];
  for (const seg of data) {
    const result = processSegment(seg);
    if (result.length > 1) {
      splits++;
    }
    newData.push(...result);
  }

  // Write back
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2) + '\n', 'utf8');

  return {
    splits,
    segsBefore,
    segsAfter: newData.length
  };
}

// Main
function main() {
  console.log('Processing', FILE_IDS.length, 'files...');

  const details = {};
  let totalSplits = 0;
  let filesChanged = 0;

  for (const fileId of FILE_IDS) {
    const result = processFile(fileId);

    if (result.error) {
      console.log(`  ${fileId}: ${result.error}`);
      details[fileId] = { error: result.error };
      continue;
    }

    if (result.splits > 0) {
      filesChanged++;
      totalSplits += result.splits;
      console.log(`  ${fileId}: ${result.splits} splits (${result.segsBefore} -> ${result.segsAfter} segs)`);
    } else {
      console.log(`  ${fileId}: no changes needed`);
    }

    details[fileId] = result;
  }

  const report = {
    batch: '06',
    filesProcessed: FILE_IDS.length,
    filesChanged,
    totalSplits,
    details
  };

  fs.writeFileSync(
    path.join(RESULTS_DIR, 'fix2-batch-06.json'),
    JSON.stringify(report, null, 2) + '\n',
    'utf8'
  );

  console.log('\nDone!');
  console.log(`Files processed: ${FILE_IDS.length}`);
  console.log(`Files changed: ${filesChanged}`);
  console.log(`Total splits: ${totalSplits}`);
  console.log(`Report: src/data/reseg-results/fix2-batch-06.json`);
}

main();
