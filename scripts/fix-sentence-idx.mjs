/**
 * Fix out-of-range sentenceIdx in expression-index-v3.json and word-index.json.
 *
 * For each video, load transcript and check every match's sentenceIdx.
 * If out of range:
 *   1. Try to find the correct segment by text matching (en field)
 *   2. If no match, cap to transcript.length - 1
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const ROOT = join(import.meta.dirname, "..");
const TRANSCRIPTS_DIR = join(ROOT, "public", "transcripts");

function loadTranscript(videoId) {
  const path = join(TRANSCRIPTS_DIR, `${videoId}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

/**
 * Normalize text for fuzzy comparison: lowercase, collapse whitespace, strip punctuation
 */
function normalize(text) {
  if (!text) return "";
  return text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Find the best matching transcript segment index for a given match entry.
 * Returns the index or -1 if no good match found.
 */
function findMatchingSegment(transcript, entry) {
  const entryEn = normalize(entry.en);
  const surface = normalize(entry.surfaceForm);

  // Strategy 1: exact en match
  for (let i = 0; i < transcript.length; i++) {
    if (normalize(transcript[i].en) === entryEn) return i;
  }

  // Strategy 2: transcript segment contains the entry's en text
  for (let i = 0; i < transcript.length; i++) {
    if (entryEn && normalize(transcript[i].en).includes(entryEn)) return i;
  }

  // Strategy 3: entry en contains the transcript segment text
  for (let i = 0; i < transcript.length; i++) {
    if (entryEn && entryEn.includes(normalize(transcript[i].en))) return i;
  }

  // Strategy 4: surfaceForm appears in transcript segment
  if (surface) {
    for (let i = 0; i < transcript.length; i++) {
      if (normalize(transcript[i].en).includes(surface)) return i;
    }
  }

  return -1;
}

function fixIndex(indexPath, idField) {
  const index = JSON.parse(readFileSync(indexPath, "utf-8"));
  const videoIds = Object.keys(index);

  let totalEntries = 0;
  let outOfRange = 0;
  let fixedByText = 0;
  let fixedByCap = 0;
  let missingTranscript = 0;
  let videosAffected = new Set();

  for (const videoId of videoIds) {
    const entries = index[videoId];
    const transcript = loadTranscript(videoId);

    if (!transcript) {
      // Check if any entries are suspicious - we can't fix without transcript
      for (const entry of entries) {
        totalEntries++;
      }
      missingTranscript++;
      continue;
    }

    const tLen = transcript.length;

    for (const entry of entries) {
      totalEntries++;
      if (entry.sentenceIdx >= tLen || entry.sentenceIdx < 0) {
        outOfRange++;
        videosAffected.add(videoId);

        // Try text matching
        const matchIdx = findMatchingSegment(transcript, entry);
        if (matchIdx >= 0) {
          entry.sentenceIdx = matchIdx;
          fixedByText++;
        } else {
          // Cap to last segment
          entry.sentenceIdx = tLen - 1;
          fixedByCap++;
        }
      }
    }
  }

  writeFileSync(indexPath, JSON.stringify(index, null, 2) + "\n");

  return { totalEntries, outOfRange, fixedByText, fixedByCap, missingTranscript, videosAffected: videosAffected.size };
}

// Fix expression-index-v3.json
const exprPath = join(ROOT, "src", "data", "expression-index-v3.json");
console.log("=== Fixing expression-index-v3.json ===");
const exprResult = fixIndex(exprPath, "exprId");
console.log(`  Total entries: ${exprResult.totalEntries}`);
console.log(`  Out of range: ${exprResult.outOfRange}`);
console.log(`  Fixed by text match: ${exprResult.fixedByText}`);
console.log(`  Fixed by capping: ${exprResult.fixedByCap}`);
console.log(`  Videos affected: ${exprResult.videosAffected}`);
console.log(`  Missing transcripts: ${exprResult.missingTranscript}`);

// Fix word-index.json
const wordPath = join(ROOT, "src", "data", "word-index.json");
console.log("\n=== Fixing word-index.json ===");
const wordResult = fixIndex(wordPath, "wordId");
console.log(`  Total entries: ${wordResult.totalEntries}`);
console.log(`  Out of range: ${wordResult.outOfRange}`);
console.log(`  Fixed by text match: ${wordResult.fixedByText}`);
console.log(`  Fixed by capping: ${wordResult.fixedByCap}`);
console.log(`  Videos affected: ${wordResult.videosAffected}`);
console.log(`  Missing transcripts: ${wordResult.missingTranscript}`);

console.log(`\n=== TOTAL ===`);
console.log(`  Fixed: ${exprResult.outOfRange + wordResult.outOfRange} entries across ${exprResult.videosAffected + wordResult.videosAffected} videos`);

// Verification pass
console.log("\n=== Verification ===");
let remaining = 0;

function verify(indexPath) {
  const index = JSON.parse(readFileSync(indexPath, "utf-8"));
  let bad = 0;
  for (const videoId of Object.keys(index)) {
    const transcript = loadTranscript(videoId);
    if (!transcript) continue;
    for (const entry of index[videoId]) {
      if (entry.sentenceIdx >= transcript.length || entry.sentenceIdx < 0) {
        bad++;
      }
    }
  }
  return bad;
}

const exprRemaining = verify(exprPath);
const wordRemaining = verify(wordPath);
console.log(`  expression-index-v3.json: ${exprRemaining} out-of-range remaining`);
console.log(`  word-index.json: ${wordRemaining} out-of-range remaining`);
console.log(`  TOTAL remaining: ${exprRemaining + wordRemaining}`);

if (exprRemaining + wordRemaining === 0) {
  console.log("\n  All sentenceIdx values are now valid!");
} else {
  console.log("\n  WARNING: Some sentenceIdx values are still out of range!");
  process.exit(1);
}
