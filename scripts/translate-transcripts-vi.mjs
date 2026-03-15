/**
 * Batch translate all transcript files to add Vietnamese translations.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/translate-transcripts-vi.mjs
 *
 * Features:
 *   - Scans public/transcripts/*.json for all transcript files
 *   - Skips files that already have `vi` field in every segment
 *   - Batches large files (>50 segments) into chunks of 50
 *   - Saves progress to output/vi-translation-progress.json for restart
 *   - Max 5 concurrent API requests (rate limiting)
 *   - Graceful error handling: logs failures and continues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRANSCRIPTS_DIR = path.resolve(__dirname, '../public/transcripts');
const PROGRESS_FILE = path.resolve(__dirname, '../output/vi-translation-progress.json');
const API_URL = 'https://api.anthropic.com/v1/messages';
const MAX_CONCURRENT = 5;
const BATCH_SIZE = 50;

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY environment variable is required.');
  process.exit(1);
}

// ---- Progress tracking ----

/**
 * Load the set of already-completed file IDs from the progress file.
 * @returns {Set<string>}
 */
function loadProgress() {
  try {
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    return new Set(data.completed || []);
  } catch {
    return new Set();
  }
}

/**
 * Save the set of completed file IDs to the progress file.
 * @param {Set<string>} completedSet
 */
function saveProgress(completedSet) {
  // Ensure output directory exists
  const dir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(
    PROGRESS_FILE,
    JSON.stringify({ completed: [...completedSet], updatedAt: new Date().toISOString() }, null, 2)
  );
}

// ---- Claude API ----

/**
 * Call the Claude API to translate English segments to Vietnamese.
 * @param {string[]} englishTexts - Array of English text strings
 * @returns {Promise<string[]>} Array of Vietnamese translations in the same order
 */
async function translateBatch(englishTexts) {
  const prompt = [
    'Translate these English subtitle segments to natural Vietnamese (Tieng Viet).',
    'Keep translations concise and conversational, matching the tone of the original.',
    'Return a JSON array of just the Vietnamese translations in the same order.',
    '',
    'Segments:',
    JSON.stringify(englishTexts),
  ].join('\n');

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API error ${response.status}: ${body}`);
  }

  const result = await response.json();
  const text = result.content?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Claude API');
  }

  // Extract JSON array from the response (may be wrapped in markdown code block)
  const jsonMatch = text.match(/\[[\s\S]*?\]/);
  if (!jsonMatch) {
    throw new Error(`Could not parse JSON array from response: ${text.slice(0, 200)}`);
  }

  const translations = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(translations) || translations.length !== englishTexts.length) {
    throw new Error(
      `Translation count mismatch: expected ${englishTexts.length}, got ${Array.isArray(translations) ? translations.length : 'non-array'}`
    );
  }

  return translations;
}

// ---- Concurrency limiter ----

/**
 * Simple concurrency limiter.
 * @param {number} limit
 */
function createLimiter(limit) {
  let running = 0;
  const queue = [];

  function next() {
    if (queue.length === 0 || running >= limit) return;
    running++;
    const { fn, resolve, reject } = queue.shift();
    fn().then(resolve, reject).finally(() => {
      running--;
      next();
    });
  }

  /**
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   * @template T
   */
  function run(fn) {
    return new Promise((resolve, reject) => {
      queue.push({ fn, resolve, reject });
      next();
    });
  }

  return { run };
}

// ---- File processing ----

/**
 * Check whether a transcript file already has Vietnamese translations on all segments.
 * @param {Array<{en: string, ko?: string, vi?: string}>} segments
 * @returns {boolean}
 */
function hasVietnamese(segments) {
  return segments.every(
    (seg) => seg.vi !== undefined && seg.vi !== null
  );
}

/**
 * Translate a single transcript file, adding `vi` fields.
 * For files with >50 segments, splits into batches of 50.
 *
 * @param {string} filePath
 * @param {Array<{en: string, ko?: string}>} segments
 * @returns {Promise<boolean>} true if translation succeeded
 */
async function translateFile(filePath, segments) {
  // Collect indices and texts of segments that need translation
  const toTranslate = [];
  for (let i = 0; i < segments.length; i++) {
    if (segments[i].vi === undefined || segments[i].vi === null) {
      toTranslate.push({ index: i, en: segments[i].en || '' });
    }
  }

  if (toTranslate.length === 0) return true;

  // Split into batches of BATCH_SIZE
  const batches = [];
  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    batches.push(toTranslate.slice(i, i + BATCH_SIZE));
  }

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    const englishTexts = batch.map((item) => item.en);
    let translations;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        translations = await translateBatch(englishTexts);
        break;
      } catch (err) {
        if (attempt === 2) throw err;
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    for (let j = 0; j < batch.length; j++) {
      segments[batch[j].index].vi = translations[j];
    }
  }

  // Write back immediately
  fs.writeFileSync(filePath, JSON.stringify(segments, null, 2));
  return true;
}

// ---- Main ----

async function main() {
  // Discover all transcript files
  const allFiles = fs
    .readdirSync(TRANSCRIPTS_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  console.log(`Found ${allFiles.length} transcript files.`);

  // Load progress
  const completed = loadProgress();
  console.log(`Already completed: ${completed.size} files (from progress file).`);

  // Build work list: skip completed and already-translated files
  const workList = [];
  for (const filename of allFiles) {
    const fileId = filename.replace(/\.json$/, '');
    if (completed.has(fileId)) continue;

    const filePath = path.join(TRANSCRIPTS_DIR, filename);
    try {
      const segments = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (!Array.isArray(segments) || segments.length === 0) continue;
      if (hasVietnamese(segments)) {
        // Already done but not in progress file -- record it
        completed.add(fileId);
        continue;
      }
      workList.push({ fileId, filename, filePath, segments });
    } catch (err) {
      console.error(`SKIP (parse error): ${filename} - ${err.message}`);
    }
  }

  // Save any newly-discovered completed files
  saveProgress(completed);

  console.log(`Files to translate: ${workList.length}`);
  if (workList.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  const limiter = createLimiter(MAX_CONCURRENT);
  let doneCount = 0;
  const totalCount = workList.length;
  const failed = [];

  const promises = workList.map((item) =>
    limiter.run(async () => {
      try {
        await translateFile(item.filePath, item.segments);
        completed.add(item.fileId);
        doneCount++;

        // Save progress every 10 files
        if (doneCount % 10 === 0) {
          saveProgress(completed);
        }

        console.log(
          `[${doneCount}/${totalCount}] Translated: ${item.filename} (${item.segments.length} segments)`
        );
      } catch (err) {
        doneCount++;
        failed.push(item.filename);
        console.error(
          `[${doneCount}/${totalCount}] FAILED: ${item.filename} - ${err.message}`
        );
      }
    })
  );

  await Promise.all(promises);

  // Final progress save
  saveProgress(completed);

  console.log('\n--- Summary ---');
  console.log(`Total files: ${totalCount}`);
  console.log(`Completed: ${totalCount - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  if (failed.length > 0) {
    console.log('Failed files:');
    for (const f of failed) {
      console.log(`  - ${f}`);
    }
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
