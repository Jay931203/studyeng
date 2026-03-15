#!/usr/bin/env node
/**
 * Fix segments longer than 15 seconds by splitting at sentence boundaries.
 * If no sentence boundary found, split at the midpoint.
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const TRANSCRIPTS_DIR = join(process.cwd(), 'public', 'transcripts');
const MAX_DURATION = 15;

function round2(v) {
  return Math.round(v * 100) / 100;
}

function splitSegment(entry) {
  const text = entry.en || '';
  const duration = entry.end - entry.start;

  if (duration <= MAX_DURATION) return [entry];

  // Try to find sentence boundaries (. ! ?)
  const sentenceEnds = [];
  for (let i = 0; i < text.length; i++) {
    if ('.!?'.includes(text[i])) {
      // Check it's a real sentence end (followed by space+capital or end of string)
      const after = text.slice(i + 1, i + 4);
      const isEnd = i >= text.length - 2 || /^['"]?\s+[A-Z]/.test(after) || /^\s+[A-Z]/.test(after);
      if (isEnd) {
        sentenceEnds.push(i + 1); // position after the punctuation
      }
    }
  }

  if (sentenceEnds.length > 0) {
    // Find the best split point (closest to middle)
    const midChar = text.length / 2;
    let bestSplit = sentenceEnds[0];
    let bestDist = Math.abs(sentenceEnds[0] - midChar);
    for (const pos of sentenceEnds) {
      const dist = Math.abs(pos - midChar);
      if (dist < bestDist) {
        bestDist = dist;
        bestSplit = pos;
      }
    }

    const fraction = bestSplit / text.length;
    const splitTime = round2(entry.start + (duration * fraction));

    const part1 = {
      start: entry.start,
      end: splitTime,
      en: text.slice(0, bestSplit).trim(),
      ko: entry.ko || '',
    };
    const part2 = {
      start: splitTime,
      end: entry.end,
      en: text.slice(bestSplit).trim(),
      ko: '',
    };

    // Recursively split if still too long
    return [...splitSegment(part1), ...splitSegment(part2)];
  }

  // No sentence boundary - split at comma or midpoint
  const commaPos = text.indexOf(', ', Math.floor(text.length * 0.3));
  if (commaPos > 0 && commaPos < text.length * 0.7) {
    const splitPos = commaPos + 2;
    const fraction = splitPos / text.length;
    const splitTime = round2(entry.start + (duration * fraction));

    return [
      { start: entry.start, end: splitTime, en: text.slice(0, splitPos).trim(), ko: entry.ko || '' },
      { start: splitTime, end: entry.end, en: text.slice(splitPos).trim(), ko: '' },
    ];
  }

  // Last resort: split at midpoint
  const midTime = round2(entry.start + duration / 2);
  const midText = Math.floor(text.length / 2);
  // Find nearest word boundary
  let splitAt = midText;
  for (let d = 0; d < 20; d++) {
    if (midText + d < text.length && text[midText + d] === ' ') { splitAt = midText + d + 1; break; }
    if (midText - d >= 0 && text[midText - d] === ' ') { splitAt = midText - d + 1; break; }
  }

  return [
    { start: entry.start, end: midTime, en: text.slice(0, splitAt).trim(), ko: entry.ko || '' },
    { start: midTime, end: entry.end, en: text.slice(splitAt).trim(), ko: '' },
  ];
}

async function main() {
  const files = (await readdir(TRANSCRIPTS_DIR)).filter(f => f.endsWith('.json'));
  console.log(`Scanning ${files.length} transcript files for segments > ${MAX_DURATION}s...`);

  let filesFixed = 0;
  let segmentsSplit = 0;

  for (const file of files) {
    try {
      const data = JSON.parse(await readFile(join(TRANSCRIPTS_DIR, file), 'utf-8'));
      if (!Array.isArray(data)) continue;

      const newData = [];
      let modified = false;

      for (const entry of data) {
        const duration = (entry.end || 0) - (entry.start || 0);
        if (duration > MAX_DURATION) {
          const parts = splitSegment(entry);
          newData.push(...parts);
          if (parts.length > 1) {
            modified = true;
            segmentsSplit += parts.length - 1;
          }
        } else {
          newData.push(entry);
        }
      }

      if (modified) {
        await writeFile(join(TRANSCRIPTS_DIR, file), JSON.stringify(newData, null, 2) + '\n', 'utf-8');
        filesFixed++;
      }
    } catch (e) {
      // skip
    }
  }

  console.log(`\n=== Long Segment Fix ===`);
  console.log(`Files fixed: ${filesFixed}`);
  console.log(`Segments split: ${segmentsSplit}`);
}

main().catch(console.error);
