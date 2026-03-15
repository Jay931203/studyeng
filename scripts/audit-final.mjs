#!/usr/bin/env node
/**
 * Final comprehensive subtitle quality audit.
 * Reports:
 *   - Mid-sentence cuts (files with 3+ cuts)
 *   - Bad punctuation (<20% segments ending with .!?)
 *   - Timing overlaps
 *   - Too-long segments (>15s)
 *   - Missing Korean translations
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const TRANSCRIPTS_DIR = join(process.cwd(), 'public', 'transcripts');

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

function punctuationRate(data) {
  const withEn = data.filter(d => d.en && d.en.trim().length > 5);
  if (withEn.length === 0) return 1;
  const ended = withEn.filter(d => /[.!?;:'"]$/.test(d.en.trim()));
  return ended.length / withEn.length;
}

function countTimingOverlaps(data) {
  let overlaps = 0;
  for (let i = 0; i < data.length - 1; i++) {
    if (data[i].end > data[i + 1].start + 0.01) overlaps++;
  }
  return overlaps;
}

function countLongSegments(data, threshold = 15) {
  return data.filter(d => (d.end - d.start) > threshold).length;
}

function missingKoRate(data) {
  const withEn = data.filter(d => d.en && d.en.trim().length > 0);
  if (withEn.length === 0) return 0;
  const missingKo = withEn.filter(d => !d.ko || d.ko.trim() === '');
  return missingKo.length / withEn.length;
}

async function main() {
  const files = (await readdir(TRANSCRIPTS_DIR)).filter(f => f.endsWith('.json'));
  console.log(`Auditing ${files.length} transcript files...\n`);

  let midSentenceBadFiles = 0;
  let totalMidSentenceCuts = 0;
  let badPunctFiles = 0;
  let totalOverlapFiles = 0;
  let totalOverlaps = 0;
  let longSegFiles = 0;
  let totalLongSegs = 0;
  let missingKoFiles = 0;  // files where >50% entries lack ko
  let totalMissingKo = 0;
  let totalEntries = 0;
  let parseErrors = 0;

  for (const file of files) {
    try {
      const data = JSON.parse(await readFile(join(TRANSCRIPTS_DIR, file), 'utf-8'));
      if (!Array.isArray(data) || data.length === 0) continue;

      totalEntries += data.length;

      // Mid-sentence cuts
      const cuts = countMidSentenceCuts(data);
      totalMidSentenceCuts += cuts;
      if (cuts >= 3) midSentenceBadFiles++;

      // Punctuation
      const pRate = punctuationRate(data);
      if (pRate < 0.2) badPunctFiles++;

      // Timing overlaps
      const overlaps = countTimingOverlaps(data);
      totalOverlaps += overlaps;
      if (overlaps > 0) totalOverlapFiles++;

      // Long segments
      const longSegs = countLongSegments(data, 15);
      totalLongSegs += longSegs;
      if (longSegs > 0) longSegFiles++;

      // Missing Ko
      const koRate = missingKoRate(data);
      const missingKoCount = data.filter(d => d.en && d.en.trim() && (!d.ko || !d.ko.trim())).length;
      totalMissingKo += missingKoCount;
      if (koRate > 0.5) missingKoFiles++;

    } catch (e) {
      parseErrors++;
    }
  }

  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     FINAL SUBTITLE QUALITY AUDIT REPORT     ║');
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║ Total files:              ${String(files.length).padStart(8)}          ║`);
  console.log(`║ Total entries:            ${String(totalEntries).padStart(8)}          ║`);
  console.log(`║ Parse errors:             ${String(parseErrors).padStart(8)}          ║`);
  console.log('╠══════════════════════════════════════════════╣');
  console.log(`║ Mid-sentence cuts (3+/file): ${String(midSentenceBadFiles).padStart(5)} files      ║`);
  console.log(`║   Total cuts:             ${String(totalMidSentenceCuts).padStart(8)}          ║`);
  console.log(`║ Bad punctuation (<20%):      ${String(badPunctFiles).padStart(5)} files      ║`);
  console.log(`║ Timing overlaps:             ${String(totalOverlapFiles).padStart(5)} files      ║`);
  console.log(`║   Total overlaps:         ${String(totalOverlaps).padStart(8)}          ║`);
  console.log(`║ Too-long segments (>15s):    ${String(longSegFiles).padStart(5)} files      ║`);
  console.log(`║   Total long segs:        ${String(totalLongSegs).padStart(8)}          ║`);
  console.log(`║ Missing Korean (>50%):       ${String(missingKoFiles).padStart(5)} files      ║`);
  console.log(`║   Total missing ko:       ${String(totalMissingKo).padStart(8)}          ║`);
  console.log('╚══════════════════════════════════════════════╝');
}

main().catch(console.error);
