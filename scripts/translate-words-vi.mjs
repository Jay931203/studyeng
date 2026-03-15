/**
 * translate-words-vi.mjs
 *
 * Translates all word entries in word-entries.json to Vietnamese.
 * Adds meaning_vi and example_vi fields using Claude API in batches of 50.
 * Saves progress every 100 entries so it can resume if interrupted.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-words-vi.mjs
 *
 * To force re-translate entries that already have Vietnamese fields:
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-words-vi.mjs --force
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRIES_PATH = path.resolve(__dirname, '../src/data/word-entries.json');
const BATCH_SIZE = 50;
const SAVE_INTERVAL = 100;
const FORCE = process.argv.includes('--force');

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('[ERROR] ANTHROPIC_API_KEY environment variable is required.');
  process.exit(1);
}

/**
 * Call the Claude API with a given prompt.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @returns {Promise<string>} The assistant response text.
 */
async function callClaude(systemPrompt, userPrompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

/**
 * Translate a batch of word entries to Vietnamese using Claude.
 * @param {Array<{id: string, meaning_ko: string, example_en: string, example_ko: string}>} batch
 * @returns {Promise<Record<string, {meaning_vi: string, example_vi: string}>>}
 */
async function translateBatch(batch) {
  const systemPrompt = `You are a professional English-Vietnamese translator for a language learning app.
You will be given a list of English words with their Korean meanings and example sentences.
Translate each word's meaning and example sentence into natural, accurate Vietnamese (Tieng Viet).

Rules:
- meaning_vi should be comma-separated Vietnamese translations, similar in style to the Korean meaning_ko field.
- example_vi should be a natural Vietnamese translation of the English example sentence.
- Keep translations concise and natural -- this is for language learners.
- Output ONLY valid JSON, no markdown fences, no explanation.
- Output format: { "word_id": { "meaning_vi": "...", "example_vi": "..." }, ... }`;

  const items = batch.map((entry) => ({
    id: entry.id,
    canonical: entry.canonical || entry.id,
    pos: entry.pos,
    meaning_ko: entry.meaning_ko,
    example_en: entry.example_en,
    example_ko: entry.example_ko,
  }));

  const userPrompt = `Translate these ${items.length} English words to Vietnamese.\n\n${JSON.stringify(items, null, 2)}`;

  const raw = await callClaude(systemPrompt, userPrompt);

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\s*\n?/m, '').replace(/\n?```\s*$/m, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[ERROR] Failed to parse Claude response as JSON.');
    console.error('Raw response (first 500 chars):', raw.slice(0, 500));
    throw err;
  }
}

/**
 * Save entries to disk.
 * @param {Record<string, object>} entries
 */
function saveEntries(entries) {
  fs.writeFileSync(ENTRIES_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
}

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log('[START] Reading word-entries.json...');
  const entries = JSON.parse(fs.readFileSync(ENTRIES_PATH, 'utf-8'));
  const allKeys = Object.keys(entries);
  const totalCount = allKeys.length;

  // Determine which entries need translation
  const keysToTranslate = allKeys.filter((key) => {
    const entry = entries[key];
    if (!entry.meaning_ko) return false;
    if (FORCE) return true;
    return !entry.meaning_vi;
  });

  const alreadyDone = totalCount - keysToTranslate.length;
  console.log(`[INFO] Total entries: ${totalCount}`);
  console.log(`[INFO] Already have Vietnamese: ${alreadyDone}`);
  console.log(`[INFO] To translate: ${keysToTranslate.length}`);
  if (FORCE) {
    console.log('[INFO] --force flag set: re-translating all entries with meaning_ko.');
  }

  if (keysToTranslate.length === 0) {
    console.log('[DONE] Nothing to translate.');
    return;
  }

  let translated = 0;
  let savedAt = 0;

  // Process in batches
  for (let i = 0; i < keysToTranslate.length; i += BATCH_SIZE) {
    const batchKeys = keysToTranslate.slice(i, i + BATCH_SIZE);
    const batchEntries = batchKeys.map((key) => entries[key]);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(keysToTranslate.length / BATCH_SIZE);

    console.log(`[BATCH ${batchNum}/${totalBatches}] Translating ${batchKeys.length} words...`);

    let result;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        result = await translateBatch(batchEntries);
        break;
      } catch (err) {
        retries++;
        if (retries >= maxRetries) {
          console.error(`[ERROR] Batch ${batchNum} failed after ${maxRetries} retries. Saving progress and exiting.`);
          saveEntries(entries);
          console.log(`[SAVED] Progress saved. ${translated} entries translated so far.`);
          process.exit(1);
        }
        console.warn(`[WARN] Batch ${batchNum} attempt ${retries} failed: ${err.message}. Retrying in 5s...`);
        await sleep(5000);
      }
    }

    // Merge results back into entries
    let batchTranslated = 0;
    for (const key of batchKeys) {
      const translation = result[key];
      if (translation && translation.meaning_vi && translation.example_vi) {
        entries[key].meaning_vi = translation.meaning_vi;
        entries[key].example_vi = translation.example_vi;
        batchTranslated++;
      } else {
        console.warn(`[WARN] Missing translation for "${key}". Skipping.`);
      }
    }

    translated += batchTranslated;
    console.log(`[PROGRESS] ${translated}/${keysToTranslate.length} translated (${batchTranslated} in this batch)`);

    // Save periodically
    if (translated - savedAt >= SAVE_INTERVAL) {
      saveEntries(entries);
      savedAt = translated;
      console.log(`[SAVED] Progress saved at ${translated} entries.`);
    }

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < keysToTranslate.length) {
      await sleep(1000);
    }
  }

  // Final save
  saveEntries(entries);
  console.log(`[DONE] Translation complete. ${translated} entries translated.`);
  console.log(`[DONE] Output written to ${ENTRIES_PATH}`);
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
