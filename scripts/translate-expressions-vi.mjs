#!/usr/bin/env node

/**
 * translate-expressions-vi.mjs
 *
 * Translates expression entries' Korean meanings to Vietnamese using Claude API.
 * Processes in batches of 50 for efficiency, saves progress every 100 entries,
 * and supports resuming from where it left off if interrupted.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-expressions-vi.mjs
 *
 * Optional flags:
 *   --dry-run   Print stats without calling the API
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.resolve(__dirname, '../src/data/expression-entries-v2.json');
const PROGRESS_PATH = path.resolve(__dirname, '../src/data/.translate-vi-progress.json');

const BATCH_SIZE = 50;
const SAVE_EVERY = 100;
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!ANTHROPIC_API_KEY && !DRY_RUN) {
  console.error('[ERROR] ANTHROPIC_API_KEY environment variable is required.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Read the expression entries JSON file.
 * @returns {Record<string, object>}
 */
function readEntries() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Write entries back to the JSON file (pretty-printed, 2-space indent).
 * @param {Record<string, object>} entries
 */
function writeEntries(entries) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
}

/**
 * Load saved progress (set of already-translated IDs) so we can resume.
 * @returns {Set<string>}
 */
function loadProgress() {
  if (!fs.existsSync(PROGRESS_PATH)) return new Set();
  try {
    const data = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8'));
    return new Set(data.translated || []);
  } catch {
    return new Set();
  }
}

/**
 * Save progress checkpoint.
 * @param {Set<string>} translatedIds
 */
function saveProgress(translatedIds) {
  fs.writeFileSync(
    PROGRESS_PATH,
    JSON.stringify({ translated: [...translatedIds] }, null, 2) + '\n',
    'utf-8',
  );
}

/**
 * Call Claude API to translate a batch of expressions to Vietnamese.
 * @param {{ id: string; canonical: string; meaning_ko: string }[]} batch
 * @returns {Promise<Record<string, string>>} Map of id -> meaning_vi
 */
async function translateBatch(batch) {
  const batchPayload = batch.map((e) => ({
    id: e.id,
    canonical: e.canonical,
    meaning_ko: e.meaning_ko,
  }));

  const systemPrompt = [
    'You are a professional translator specializing in English, Korean, and Vietnamese.',
    'Translate these English expressions\' meanings to Vietnamese (Tieng Viet).',
    'Each expression has an English canonical form and Korean meaning.',
    'Keep translations natural and concise.',
    '',
    'RULES:',
    '- Output ONLY valid JSON: an array of objects with "id" and "meaning_vi" fields.',
    '- Keep the same "id" values from the input.',
    '- The Vietnamese meaning should be a natural dictionary-style definition, not a literal word-for-word translation.',
    '- Be concise: match the brevity of the Korean meanings.',
    '- Do NOT include any markdown, code fences, or extra text outside the JSON array.',
  ].join('\n');

  const userMessage = JSON.stringify(batchPayload, null, 2);

  const body = {
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errText}`);
  }

  const result = await response.json();
  const text = result.content?.[0]?.text || '';

  // Parse JSON from the response (handle possible markdown fences)
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  /** @type {{ id: string; meaning_vi: string }[]} */
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('[ERROR] Failed to parse Claude response as JSON:');
    console.error(cleaned.slice(0, 500));
    throw parseErr;
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Expected an array from Claude response, got: ' + typeof parsed);
  }

  const map = {};
  for (const item of parsed) {
    if (item.id && item.meaning_vi) {
      map[item.id] = item.meaning_vi;
    }
  }
  return map;
}

/**
 * Sleep for the given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('[INFO] Reading expression entries from:', DATA_PATH);
  const entries = readEntries();
  const allIds = Object.keys(entries);
  console.log(`[INFO] Total entries: ${allIds.length}`);

  // Determine which entries need translation
  const alreadyDone = loadProgress();
  const needsTranslation = allIds.filter((id) => {
    const entry = entries[id];
    // Skip if already has meaning_vi
    if (entry.meaning_vi) return false;
    // Skip if already processed in a previous run
    if (alreadyDone.has(id)) return false;
    // Must have meaning_ko to translate from
    if (!entry.meaning_ko) return false;
    return true;
  });

  const alreadyHaveVi = allIds.filter((id) => entries[id].meaning_vi).length;
  const noKo = allIds.filter((id) => !entries[id].meaning_ko).length;

  console.log(`[INFO] Already have meaning_vi: ${alreadyHaveVi}`);
  console.log(`[INFO] No meaning_ko (skipped): ${noKo}`);
  console.log(`[INFO] Need translation: ${needsTranslation.length}`);
  console.log(`[INFO] Previously completed (progress file): ${alreadyDone.size}`);

  if (DRY_RUN) {
    console.log('[DRY-RUN] Exiting without API calls.');
    return;
  }

  if (needsTranslation.length === 0) {
    console.log('[INFO] Nothing to translate. All entries already have meaning_vi.');
    // Clean up progress file if everything is done
    if (fs.existsSync(PROGRESS_PATH)) {
      fs.unlinkSync(PROGRESS_PATH);
      console.log('[INFO] Removed progress file.');
    }
    return;
  }

  // Build batches of BATCH_SIZE
  const batches = [];
  for (let i = 0; i < needsTranslation.length; i += BATCH_SIZE) {
    batches.push(needsTranslation.slice(i, i + BATCH_SIZE));
  }

  console.log(`[INFO] Will process ${batches.length} batches of up to ${BATCH_SIZE} entries each.`);

  let translated = 0;
  let failed = 0;
  let sinceLastSave = 0;

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batchIds = batches[batchIdx];
    const batchEntries = batchIds.map((id) => ({
      id,
      canonical: entries[id].canonical,
      meaning_ko: entries[id].meaning_ko,
    }));

    console.log(
      `[BATCH ${batchIdx + 1}/${batches.length}] Translating ${batchEntries.length} entries...`,
    );

    try {
      const translations = await translateBatch(batchEntries);
      const translatedCount = Object.keys(translations).length;

      // Apply translations to entries
      for (const [id, meaningVi] of Object.entries(translations)) {
        if (entries[id]) {
          entries[id].meaning_vi = meaningVi;
          alreadyDone.add(id);
          translated++;
          sinceLastSave++;
        }
      }

      const missing = batchEntries.length - translatedCount;
      if (missing > 0) {
        console.warn(`[WARN] ${missing} entries in this batch did not get translations.`);
        failed += missing;
      }

      console.log(
        `[BATCH ${batchIdx + 1}/${batches.length}] Done. Got ${translatedCount}/${batchEntries.length} translations. Total: ${translated} translated, ${failed} failed.`,
      );
    } catch (err) {
      console.error(`[ERROR] Batch ${batchIdx + 1} failed:`, err.message);
      failed += batchEntries.length;
      // Save what we have so far and continue with next batch
      writeEntries(entries);
      saveProgress(alreadyDone);
      sinceLastSave = 0;
      console.log('[INFO] Saved progress after error. Continuing with next batch...');
      // Brief pause before retrying next batch
      await sleep(2000);
      continue;
    }

    // Save progress periodically
    if (sinceLastSave >= SAVE_EVERY) {
      console.log(`[INFO] Saving progress checkpoint (${translated} translated so far)...`);
      writeEntries(entries);
      saveProgress(alreadyDone);
      sinceLastSave = 0;
    }

    // Rate-limit: brief pause between batches to avoid hitting API limits
    if (batchIdx < batches.length - 1) {
      await sleep(500);
    }
  }

  // Final save
  console.log('[INFO] Saving final results...');
  writeEntries(entries);

  // Clean up progress file on successful completion
  if (failed === 0 && fs.existsSync(PROGRESS_PATH)) {
    fs.unlinkSync(PROGRESS_PATH);
    console.log('[INFO] All translations complete. Removed progress file.');
  } else {
    saveProgress(alreadyDone);
    console.log('[INFO] Progress file retained (some entries may have failed).');
  }

  console.log('');
  console.log('=== Summary ===');
  console.log(`Total entries:    ${allIds.length}`);
  console.log(`Translated (vi):  ${translated}`);
  console.log(`Failed:           ${failed}`);
  console.log(`Skipped (no ko):  ${noKo}`);
  console.log(`Already had vi:   ${alreadyHaveVi}`);
  console.log('[DONE]');
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
