#!/usr/bin/env node
/**
 * build-expression-index.mjs
 *
 * Reads src/data/expression-dictionary.json (large, ~4MB) and produces two
 * compact artefacts that the runtime lookup module can import without bloating
 * the bundle:
 *
 *   src/data/expression-entries.json
 *     – expression metadata (no occurrences array)
 *     – keyed by expression id for O(1) lookup
 *
 *   src/data/expression-index.json
 *     – per-video mapping:  videoId -> [{exprId, sentenceIdx}]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const dictPath = resolve(ROOT, "src/data/expression-dictionary.json");
const entriesOutPath = resolve(ROOT, "src/data/expression-entries.json");
const indexOutPath = resolve(ROOT, "src/data/expression-index.json");

console.log("Reading dictionary…");
const dict = JSON.parse(readFileSync(dictPath, "utf-8"));

/** @type {Record<string, object>} */
const entries = {};

/** @type {Record<string, Array<{exprId: string, sentenceIdx: number}>>} */
const videoIndex = {};

for (const expr of dict.expressions) {
  // Build the compact entry (no occurrences)
  entries[expr.id] = {
    id: expr.id,
    canonical: expr.canonical,
    meaning_ko: expr.meaning_ko,
    category: expr.category,
    cefr: expr.cefr,
    theme: expr.theme,
    register: expr.register,
    learner_value: expr.learner_value,
    videoCount: expr.videoCount,
  };

  // Build the video -> expressions index
  for (const occ of expr.occurrences) {
    const key = occ.videoId;
    if (!videoIndex[key]) {
      videoIndex[key] = [];
    }
    videoIndex[key].push({
      exprId: expr.id,
      sentenceIdx: occ.sentenceIdx,
      en: occ.en,
      ko: occ.ko,
    });
  }
}

console.log(`Writing ${Object.keys(entries).length} entries → expression-entries.json`);
writeFileSync(entriesOutPath, JSON.stringify(entries), "utf-8");

const videoCount = Object.keys(videoIndex).length;
const occTotal = Object.values(videoIndex).reduce((s, a) => s + a.length, 0);
console.log(
  `Writing index (${videoCount} videos, ${occTotal} occurrences) → expression-index.json`
);
writeFileSync(indexOutPath, JSON.stringify(videoIndex), "utf-8");

console.log("Done.");
