#!/usr/bin/env node
/**
 * Fix remaining >15s segments by capping duration.
 * For short-text segments with inflated timing, cap end time.
 * For long-text segments, split at sentence/comma boundaries.
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const TRANSCRIPTS_DIR = join(process.cwd(), 'public', 'transcripts');
const MAX_DURATION = 15;

function round2(v) { return Math.round(v * 100) / 100; }

function estimateDuration(text) {
  // ~3 words per second for English speech
  const words = (text || '').split(/\s+/).filter(Boolean).length;
  return Math.max(1.5, Math.min(15, words / 3 + 0.5));
}

function fixEntry(entry, nextStart) {
  const text = (entry.en || '').trim();
  const duration = entry.end - entry.start;

  if (duration <= MAX_DURATION) return [entry];

  // If text is short, just cap the duration based on text length
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 20) {
    const estDur = estimateDuration(text);
    const newEnd = round2(Math.min(entry.start + estDur, nextStart || entry.end));
    return [{ ...entry, end: newEnd }];
  }

  // For longer text, try to split at sentence boundary
  const sentenceEnds = [];
  for (let i = 0; i < text.length; i++) {
    if ('.!?'.includes(text[i])) {
      const after = text.slice(i + 1, i + 4);
      if (i >= text.length - 2 || /^['"]?\s+[A-Z]/.test(after) || /^\s+[A-Z]/.test(after)) {
        sentenceEnds.push(i + 1);
      }
    }
  }

  // Filter out sentence ends at the very start or end (they don't create a real split)
  const usableSentenceEnds = sentenceEnds.filter(pos => pos > 5 && pos < text.length - 5);

  if (usableSentenceEnds.length > 0) {
    const midChar = text.length / 2;
    let bestSplit = usableSentenceEnds.reduce((best, pos) =>
      Math.abs(pos - midChar) < Math.abs(best - midChar) ? pos : best
    );

    const fraction = bestSplit / text.length;
    const splitTime = round2(entry.start + (duration * fraction));

    const parts = [
      { start: entry.start, end: splitTime, en: text.slice(0, bestSplit).trim(), ko: entry.ko || '' },
      { start: splitTime, end: entry.end, en: text.slice(bestSplit).trim(), ko: '' },
    ];

    // Recursively fix if still too long
    const result = [];
    for (let i = 0; i < parts.length; i++) {
      const ns = i < parts.length - 1 ? parts[i + 1].start : nextStart;
      result.push(...fixEntry(parts[i], ns));
    }
    return result;
  }

  // Cap duration for remaining cases
  const estDur = estimateDuration(text);
  return [{ ...entry, end: round2(entry.start + estDur) }];
}

async function main() {
  const files = (await readdir(TRANSCRIPTS_DIR)).filter(f => f.endsWith('.json'));
  let filesFixed = 0;
  let segmentsFixed = 0;

  for (const file of files) {
    try {
      const data = JSON.parse(await readFile(join(TRANSCRIPTS_DIR, file), 'utf-8'));
      if (!Array.isArray(data)) continue;

      const hasLong = data.some(d => (d.end - d.start) > MAX_DURATION);
      if (!hasLong) continue;

      const newData = [];
      let modified = false;

      for (let i = 0; i < data.length; i++) {
        const entry = data[i];
        const nextStart = i < data.length - 1 ? data[i + 1].start : null;

        if ((entry.end - entry.start) > MAX_DURATION) {
          const parts = fixEntry(entry, nextStart);
          newData.push(...parts);
          modified = true;
          segmentsFixed++;
        } else {
          newData.push(entry);
        }
      }

      if (modified) {
        await writeFile(join(TRANSCRIPTS_DIR, file), JSON.stringify(newData, null, 2) + '\n', 'utf-8');
        filesFixed++;
      }
    } catch (e) {}
  }

  console.log(`=== Long Segment Fix v2 ===`);
  console.log(`Files fixed: ${filesFixed}`);
  console.log(`Segments fixed: ${segmentsFixed}`);
}

main().catch(console.error);
