#!/usr/bin/env node
/**
 * fix-punctuation.mjs
 *
 * Fixes transcript files that lost punctuation during Whisper word-level rebuild.
 * Matches current transcript entries to raw Whisper segments by time overlap,
 * then replaces `en` text with the properly punctuated version.
 */

import fs from 'fs';
import path from 'path';

const TRANSCRIPTS_DIR = 'public/transcripts';
const RAW_DIR = 'logs/whisper-raw';
const PUNCT_THRESHOLD = 0.20; // files with < 20% punctuated lines are "low"

function hasPunctuation(text) {
  return /[.!?,;:]/.test(text);
}

function getPunctRatio(entries) {
  if (entries.length === 0) return 1;
  const withPunct = entries.filter(e => hasPunctuation(e.en)).length;
  return withPunct / entries.length;
}

/**
 * Find raw segments that overlap with [start, end].
 * Overlap means: rawStart < end && rawEnd > start
 */
function findOverlappingSegments(rawSegments, start, end) {
  const overlapping = [];
  for (const seg of rawSegments) {
    if (seg.start < end && seg.end > start) {
      overlapping.push(seg);
    }
  }
  return overlapping;
}

/**
 * Given overlapping raw segments, build the punctuated text.
 * If a raw segment only partially overlaps, we still include its full text
 * (punctuation is at sentence boundaries, splitting mid-sentence would lose it).
 */
function buildPunctuatedText(overlapping) {
  if (overlapping.length === 0) return null;
  return overlapping.map(s => s.text.trim()).join(' ');
}

function processFile(transcriptPath, rawPath, videoId) {
  const transcript = JSON.parse(fs.readFileSync(transcriptPath, 'utf8'));

  const ratio = getPunctRatio(transcript);
  if (ratio >= PUNCT_THRESHOLD) {
    return { status: 'skip-has-punct', ratio };
  }

  if (!fs.existsSync(rawPath)) {
    return { status: 'skip-no-raw' };
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  } catch (e) {
    return { status: 'skip-bad-json' };
  }
  const rawSegments = raw.segments;
  if (!rawSegments || rawSegments.length === 0) {
    return { status: 'skip-no-segments' };
  }

  let fixedCount = 0;
  let unchangedCount = 0;
  let noMatchCount = 0;

  for (const entry of transcript) {
    const overlapping = findOverlappingSegments(rawSegments, entry.start, entry.end);

    if (overlapping.length === 0) {
      noMatchCount++;
      continue;
    }

    const punctuated = buildPunctuatedText(overlapping);
    if (punctuated && punctuated !== entry.en) {
      entry.en = punctuated;
      fixedCount++;
    } else {
      unchangedCount++;
    }
  }

  if (fixedCount > 0) {
    fs.writeFileSync(transcriptPath, JSON.stringify(transcript, null, 2), 'utf8');
  }

  return { status: 'fixed', fixedCount, unchangedCount, noMatchCount, total: transcript.length, ratio };
}

// Main
const transcriptFiles = fs.readdirSync(TRANSCRIPTS_DIR).filter(f => f.endsWith('.json'));
console.log(`Found ${transcriptFiles.length} transcript files`);

let stats = {
  total: 0,
  skippedHasPunct: 0,
  skippedNoRaw: 0,
  skippedNoSegments: 0,
  skippedBadJson: 0,
  fixed: 0,
  totalLinesFixed: 0,
  totalNoMatch: 0,
};

for (const file of transcriptFiles) {
  const videoId = file.replace('.json', '');
  const transcriptPath = path.join(TRANSCRIPTS_DIR, file);
  const rawPath = path.join(RAW_DIR, file);

  stats.total++;
  const result = processFile(transcriptPath, rawPath, videoId);

  switch (result.status) {
    case 'skip-has-punct':
      stats.skippedHasPunct++;
      break;
    case 'skip-no-raw':
      stats.skippedNoRaw++;
      break;
    case 'skip-no-segments':
      stats.skippedNoSegments++;
      break;
    case 'skip-bad-json':
      stats.skippedBadJson++;
      break;
    case 'fixed':
      if (result.fixedCount > 0) {
        stats.fixed++;
        stats.totalLinesFixed += result.fixedCount;
        stats.totalNoMatch += result.noMatchCount;
        console.log(`  Fixed ${videoId}: ${result.fixedCount}/${result.total} lines (punct ratio was ${result.ratio.toFixed(2)})`);
      } else {
        stats.skippedHasPunct++; // text matched already
      }
      break;
  }
}

console.log('\n=== Summary ===');
console.log(`Total files scanned: ${stats.total}`);
console.log(`Files with good punctuation (skipped): ${stats.skippedHasPunct}`);
console.log(`Files without raw data (skipped): ${stats.skippedNoRaw}`);
console.log(`Files without segments (skipped): ${stats.skippedNoSegments}`);
console.log(`Files with bad JSON (skipped): ${stats.skippedBadJson}`);
console.log(`Files fixed: ${stats.fixed}`);
console.log(`Total lines fixed: ${stats.totalLinesFixed}`);
console.log(`Total lines with no time match: ${stats.totalNoMatch}`);
