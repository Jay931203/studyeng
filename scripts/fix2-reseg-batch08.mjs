/**
 * fix2-reseg-batch08.mjs
 * Re-segment transcripts that have multi-sentence segments > 3s
 * Split them proportionally by character count, respecting 1.5s minimum.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE = 'C:/Users/hyunj/studyeng';
const TRANSCRIPTS_DIR = join(BASE, 'public/transcripts');
const OUTPUT_DIR = join(BASE, 'src/data/reseg-results');

const FILE_IDS = [
  'Gbsw-XxPREA','GcaKkWsVtM4','GDEVOCTW4qk','gf-tZ8OAc1U','gFr0_ywVdhY',
  'GHTQQHwKa7Q','GjIKnpjUZP0','gJuNiHitc40','gKGOG-Pr81E','gNi_6U5Pm_o',
  'GNtS6KzseN8','GNxiVJbqncs','Goem3yP-__4','GOfv3rAVOPA','gpeh1DUAusk',
  'gQ-she8Xneo','gQU3EphIpMY','GSu7BGbyJqc','Gt75VjvRW34','Gu08f15KnMI',
  'gvGNWLszAQA','gWVHses2GCY','GzjDUUOLMlY','H-0RHqDWcJE','H-2kbp8CFuk',
  'H14bBuluwB8','h28p_stPK5Q','hA5ezR0Kh80','hAFuD-S-e_E','hBaiyzj5wdc',
  'HE6P2HDYlZs','hEWsqLKlEr4','HFNakraGHYk','hFyLq6qNRew','HhrbbYD5ScI',
  'HHvTBIKyCq8','HiCnnsHfadU','hIYZoUg1gg8','hJCUJLMSEK0','hKi3-5gO4uE'
];

// Abbreviations that are NOT sentence boundaries
const ABBREVS = /(?:Dr|Mr|Mrs|Ms|St|Jr|Sr|U\.S)$/;

/**
 * Split English text into sentences at period/question/exclamation + space + uppercase
 * Respects abbreviations.
 */
function splitSentences(text) {
  const sentences = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    current += text[i];

    // Check for sentence boundary: .!? followed by space and uppercase
    if ((text[i] === '.' || text[i] === '!' || text[i] === '?') &&
        i + 2 < text.length &&
        text[i + 1] === ' ' &&
        text[i + 2] >= 'A' && text[i + 2] <= 'Z') {

      // Check if this is an abbreviation
      const beforePunct = current.slice(0, -1).trim(); // text before the punctuation
      if (text[i] === '.' && ABBREVS.test(beforePunct)) {
        continue; // Not a sentence boundary
      }

      // Single letter initial (e.g., "Samuel L." or "J. K.")
      if (text[i] === '.' && /\b[A-Z]$/.test(beforePunct)) {
        continue; // Not a sentence boundary
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
 * Try to split Korean text at matching sentence boundaries.
 * Returns array of ko parts matching en sentence groups.
 */
function splitKorean(ko, numParts) {
  if (numParts <= 1) return [ko];
  if (!ko || ko.trim() === '') return [ko, ...Array(numParts - 1).fill('')];

  // Find sentence boundaries in Korean too
  const koParts = [];
  let current = '';
  const koSentences = [];

  for (let i = 0; i < ko.length; i++) {
    current += ko[i];
    if ((ko[i] === '.' || ko[i] === '!' || ko[i] === '?') &&
        i + 1 < ko.length && ko[i + 1] === ' ') {
      koSentences.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) koSentences.push(current.trim());

  // If we have matching count of sentences, group them to match en groups
  if (koSentences.length >= numParts) {
    // Distribute ko sentences evenly across numParts groups
    const perGroup = Math.floor(koSentences.length / numParts);
    const extra = koSentences.length % numParts;
    let idx = 0;
    for (let g = 0; g < numParts; g++) {
      const count = perGroup + (g < extra ? 1 : 0);
      const group = koSentences.slice(idx, idx + count).join(' ');
      koParts.push(group);
      idx += count;
    }
    return koParts;
  }

  // If fewer ko sentences than parts, put full ko in first, rest empty
  return [ko, ...Array(numParts - 1).fill('')];
}

/**
 * Group sentences so each group is >= 1.5s when possible.
 * Returns array of { enGroup: string[], charCount: number }
 */
function groupSentences(sentences, totalDuration) {
  if (sentences.length <= 1) return [{ enGroup: sentences, charCount: sentences[0]?.length || 0 }];

  const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);

  // Calculate approximate duration for each sentence
  const sentDurations = sentences.map(s => (s.length / totalChars) * totalDuration);

  // Check if each sentence individually >= 1.5s
  const allLongEnough = sentDurations.every(d => d >= 1.5);

  if (allLongEnough) {
    // Split individually
    return sentences.map(s => ({ enGroup: [s], charCount: s.length }));
  }

  // Group sentences so each group >= 1.5s
  const groups = [];
  let currentGroup = [];
  let currentChars = 0;

  for (let i = 0; i < sentences.length; i++) {
    currentGroup.push(sentences[i]);
    currentChars += sentences[i].length;

    const currentDuration = (currentChars / totalChars) * totalDuration;
    const remainingChars = sentences.slice(i + 1).reduce((sum, s) => sum + s.length, 0);
    const remainingDuration = (remainingChars / totalChars) * totalDuration;
    const remainingSentences = sentences.length - i - 1;

    // Close this group if:
    // 1. Duration >= 1.5s AND
    // 2. Remaining can form at least one group of >= 1.5s (or no remaining)
    if (currentDuration >= 1.5 && (remainingSentences === 0 || remainingDuration >= 1.5)) {
      groups.push({ enGroup: [...currentGroup], charCount: currentChars });
      currentGroup = [];
      currentChars = 0;
    }
  }

  // If leftover sentences, merge into last group
  if (currentGroup.length > 0) {
    if (groups.length > 0) {
      const last = groups[groups.length - 1];
      last.enGroup.push(...currentGroup);
      last.charCount += currentChars;
    } else {
      groups.push({ enGroup: currentGroup, charCount: currentChars });
    }
  }

  // Validate: don't leave 3+ sentences in one group if we can avoid it
  // Re-check each group
  const finalGroups = [];
  for (const group of groups) {
    if (group.enGroup.length >= 3) {
      const groupTotalChars = group.charCount;
      const groupDuration = (groupTotalChars / totalChars) * totalDuration;

      // Try to split this group further
      const subGroups = trySplitGroup(group.enGroup, groupDuration);
      finalGroups.push(...subGroups);
    } else {
      finalGroups.push(group);
    }
  }

  return finalGroups;
}

function trySplitGroup(sentences, duration) {
  if (sentences.length < 2) return [{ enGroup: sentences, charCount: sentences.reduce((s, x) => s + x.length, 0) }];

  const totalChars = sentences.reduce((s, x) => s + x.length, 0);

  // Try to split into 2 groups where each >= 1.0s (min segment)
  for (let splitAt = 1; splitAt < sentences.length; splitAt++) {
    const part1 = sentences.slice(0, splitAt);
    const part2 = sentences.slice(splitAt);
    const chars1 = part1.reduce((s, x) => s + x.length, 0);
    const chars2 = part2.reduce((s, x) => s + x.length, 0);
    const dur1 = (chars1 / totalChars) * duration;
    const dur2 = (chars2 / totalChars) * duration;

    if (dur1 >= 1.0 && dur2 >= 1.0) {
      // Check if part2 still has 3+ sentences and can be further split
      const result = [{ enGroup: part1, charCount: chars1 }];
      if (part2.length >= 3 && dur2 >= 2.0) {
        result.push(...trySplitGroup(part2, dur2));
      } else {
        result.push({ enGroup: part2, charCount: chars2 });
      }
      return result;
    }
  }

  // Can't split further
  return [{ enGroup: sentences, charCount: totalChars }];
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function processSegment(seg) {
  const duration = seg.end - seg.start;

  // Skip segments <= 3s
  if (duration <= 3) return [seg];

  // Skip music/effects (typically in brackets or no real text)
  if (/^\[.*\]$/.test(seg.en.trim()) || /^\(.*\)$/.test(seg.en.trim())) return [seg];

  const sentences = splitSentences(seg.en);

  // Skip single-sentence segments
  if (sentences.length <= 1) return [seg];

  // Group sentences
  const groups = groupSentences(sentences, duration);

  // If grouping didn't actually split (still 1 group), skip
  if (groups.length <= 1) return [seg];

  // Calculate timing proportionally
  const totalChars = groups.reduce((sum, g) => sum + g.charCount, 0);

  // Split Korean
  const koParts = splitKorean(seg.ko, groups.length);

  const result = [];
  let currentStart = seg.start;

  for (let i = 0; i < groups.length; i++) {
    const proportion = groups[i].charCount / totalChars;
    let segDuration = proportion * duration;

    // Enforce minimum 1.0s
    if (segDuration < 1.0) segDuration = 1.0;

    let segEnd;
    if (i === groups.length - 1) {
      segEnd = seg.end; // Last segment gets the exact end
    } else {
      segEnd = round1(currentStart + segDuration);
      // Don't exceed the original end
      if (segEnd >= seg.end) segEnd = round1(seg.end - 0.1);
    }

    // Ensure start < end
    if (segEnd <= currentStart) segEnd = round1(currentStart + 1.0);

    result.push({
      start: round1(currentStart),
      end: segEnd,
      en: groups[i].enGroup.join(' '),
      ko: koParts[i] || ''
    });

    currentStart = segEnd;
  }

  return result;
}

function processFile(fileId) {
  const filePath = join(TRANSCRIPTS_DIR, `${fileId}.json`);

  if (!existsSync(filePath)) {
    console.log(`  SKIP: ${fileId} - file not found`);
    return { splits: 0, segsBefore: 0, segsAfter: 0, skipped: true };
  }

  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  const segsBefore = data.length;

  const newData = [];
  let splits = 0;

  for (const seg of data) {
    const result = processSegment(seg);
    if (result.length > 1) {
      splits++;
    }
    newData.push(...result);
  }

  if (splits > 0) {
    writeFileSync(filePath, JSON.stringify(newData, null, 2));
    console.log(`  ${fileId}: ${splits} splits (${segsBefore} -> ${newData.length} segments)`);
  } else {
    console.log(`  ${fileId}: no changes needed`);
  }

  return { splits, segsBefore, segsAfter: newData.length };
}

// Main
console.log('=== fix2-reseg-batch08 ===');
console.log(`Processing ${FILE_IDS.length} files...\n`);

const report = {
  batch: '08',
  filesProcessed: 0,
  filesChanged: 0,
  totalSplits: 0,
  details: {}
};

for (const fileId of FILE_IDS) {
  const result = processFile(fileId);
  report.filesProcessed++;

  if (!result.skipped) {
    report.details[fileId] = {
      splits: result.splits,
      segsBefore: result.segsBefore,
      segsAfter: result.segsAfter
    };

    if (result.splits > 0) {
      report.filesChanged++;
      report.totalSplits += result.splits;
    }
  }
}

console.log(`\n=== Summary ===`);
console.log(`Files processed: ${report.filesProcessed}`);
console.log(`Files changed: ${report.filesChanged}`);
console.log(`Total splits: ${report.totalSplits}`);

if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
writeFileSync(join(OUTPUT_DIR, 'fix2-batch-08.json'), JSON.stringify(report, null, 2));
console.log(`\nReport written to src/data/reseg-results/fix2-batch-08.json`);
